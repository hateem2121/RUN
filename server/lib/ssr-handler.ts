import { dehydrate } from "@tanstack/react-query";
import type { NextFunction, Request, Response } from "express";
import fs from "fs";
import type { Server as HttpServer } from "http"; // HMR FIX: Import HttpServer type
import path from "path";
import { pathToFileURL } from "url";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { logging } from "../config/environment.js";
import { getStorage } from "./storage-singleton.js";
import { ViteAssetManager } from "./vite-manifest.js";

const isProduction = process.env.NODE_ENV === "production";
const root = process.cwd();

// HMR FIX: Update signature to accept optional http server
async function createSsrHandler(app: any, server?: HttpServer) {
  let vite: ViteDevServer | undefined;

  if (!isProduction) {
    vite = await createViteServer({
      server: {
        middlewareMode: true,
        // HMR FIX: Attach to existing server if provided
        ...(server
          ? {
              hmr: {
                server: server,
                host: "localhost", // Explicit connection host
                port: 5001, // Match the Express port
              },
            }
          : {}),
      },
      appType: "custom",
      configFile: path.resolve(root, "vite.config.ts"),
    });
    app.use(vite.middlewares);
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only handle HTML requests
    if (
      req.method !== "GET" ||
      req.originalUrl.startsWith("/api") ||
      req.originalUrl.includes(".")
    ) {
      return next();
    }

    try {
      const url = req.originalUrl;

      // P0: Harden Routing - Explicitly ignore static assets
      const ext = path.extname(url.split("?")[0] || "");
      if (
        (ext && ext !== ".html") ||
        url.startsWith("/assets/") ||
        url.startsWith("/fonts/") ||
        url.startsWith("/images/") ||
        url.startsWith("/favicon.ico")
      ) {
        return next();
      }

      if (
        req.headers.accept &&
        !req.headers.accept.includes("text/html") &&
        !req.headers.accept.includes("*/*")
      ) {
        return next();
      }

      let template: string;
      let render: (url: string, res: any, options?: any, queryClient?: any) => any;
      let createQueryClient: any;

      if (vite) {
        template = fs.readFileSync(path.resolve(root, "client/index.html"), "utf-8");

        // P0: Dark Mode - Prevent White Flash (Dev Mode)
        const rawCookie = req.headers.cookie || "";
        if (rawCookie.includes("theme=dark")) {
          template = template.replace(/<html([^>]*)>/, '<html$1 class="dark">');
          if (!template.includes('class="dark"')) {
            template = template.replace("<html>", '<html class="dark">');
          }
        }

        // FIX: Inject CSS manually in dev mode to prevent FOUC
        const cssLink = `<link rel="stylesheet" href="/src/index.css" />`;
        if (template.includes("<!--ssr-styles-->")) {
          template = template.replace("<!--ssr-styles-->", cssLink);
        } else if (template.includes("<!--app-head-->")) {
          template = template.replace("<!--app-head-->", `${cssLink}\n<!--app-head-->`);
        }

        template = await vite.transformIndexHtml(url, template);
        const module = await vite.ssrLoadModule("/src/entry-server.tsx");
        render = module.render;
        createQueryClient = module.createQueryClient;
      } else {
        template = fs.readFileSync(path.resolve(root, "dist/public/index.html"), "utf-8");

        // P0: Dark Mode - Prevent White Flash
        // Injects 'dark' class into <html> or <body> if 'theme' cookie is 'dark'
        const rawCookie = req.headers.cookie || "";
        if (rawCookie.includes("theme=dark")) {
          // Robust replacement for <html class="..."> or <html>
          template = template.replace(/<html([^>]*)>/, '<html$1 class="dark">');
          if (!template.includes('class="dark"')) {
            // Fallback if class attribute already exists but regex failed
            template = template.replace("<html>", '<html class="dark">');
          }
        }

        // P0: Security - Inject CSP Nonce into static scripts (Vite bundles)
        if (res.locals.cspNonce) {
          const nonce = res.locals.cspNonce;
          // Nonce all script tags
          template = template.replace(/<script\b([^>]*)>/g, (match, attributes) => {
            if (attributes && attributes.includes("nonce=")) return match;
            return `<script nonce="${nonce}"${attributes}>`;
          });
          // Nonce preload links
          template = template.replace(
            /<link\b([^>]*\brel=["'](?:modulepreload|preload)["'][^>]*)>/g,
            (match, attributes) => {
              if (attributes && attributes.includes("nonce=")) return match;
              return `<link nonce="${nonce}"${attributes}>`;
            },
          );
        }

        const entryServerPath = path.resolve(root, "dist/server/entry-server.js");
        const module = await import(pathToFileURL(entryServerPath).href);
        render = module.render;
        createQueryClient = module.createQueryClient;

        // P1: FOUC Prevention - Inject Critical CSS using Type-Safe Asset Manager
        try {
          const assetManager = new ViteAssetManager(root);
          const injectionHtml = assetManager.generateInjectionHtml();

          if (injectionHtml) {
            if (template.includes("<!--ssr-styles-->")) {
              template = template.replace("<!--ssr-styles-->", injectionHtml);
            } else if (template.includes("<!--app-head-->")) {
              template = template.replace("<!--app-head-->", `${injectionHtml}\n<!--app-head-->`);
            } else {
              template = template.replace("</head>", `${injectionHtml}</head>`);
            }
          }
        } catch (e) {
          console.error("[SSR-HANDLER-ERROR] Asset Injection failed:", e);
        }
      }

      // PREFETCH DATA
      const queryClient = createQueryClient();

      try {
        const categories = await getStorage().getCategories();
        queryClient.setQueryData(["/api/categories"], categories);
      } catch (err) {}

      try {
        if (url === "/contact" || url.startsWith("/contact?")) {
          const contactConfig = await getStorage().getContactPageConfiguration();
          if (contactConfig) {
            queryClient.setQueryData(["/api/contact-info"], contactConfig);
          }
        }
      } catch (err) {}

      // Template Marker Strategy
      // We no longer split by strings/regex. We use exact placeholder replacements.
      // This ensures 1 head and 1 body.

      const {
        pipe,
        // queryClient: finalClient,
        helmetContext,
      } = render(
        url,
        res,
        {
          onShellReady() {
            console.log(`[SSR-HANDLER-LOG] PROOF OF EXECUTION FOR: ${url}`);
            console.log(`[SSR-HANDLER-LOG] FINAL HTML NONCE: ${res.locals.cspNonce}`);

            res.status(200);
            res.set("Content-Type", "text/html");

            const { helmet } = helmetContext as any;

            // Construct Head Content with Nonce Injection for Helmet Scripts
            const nonceInfo = res.locals.cspNonce ? ` nonce="${res.locals.cspNonce}"` : "";
            const helmetScripts = helmet.script
              .toString()
              .replace(/<script/g, `<script${nonceInfo}`);

            // P2: Dynamic Canonical URL Generation (SEO)
            // Strip query params to prevent duplicate content penalties
            const baseUrl = process.env.CANONICAL_BASE_URL || "https://wear-run.com";
            const canonicalPath = url.split("?")[0] || "/";
            const canonicalTag = `<link rel="canonical" href="${baseUrl}${canonicalPath}" />`;

            const headContent = `
              ${helmet.title.toString()}
              ${helmet.priority.toString()}
              ${helmet.meta.toString()}
              ${canonicalTag}
              ${helmet.link.toString()}
              ${helmetScripts}
            `;

            // Prepare the stream with STRICT marker replacement
            // We expect index.html to have <!--app-head--> and <!--app-html-->

            if (!template.includes("<!--app-head-->") || !template.includes("<!--app-html-->")) {
              // We cannot recover gracefully if markers are missing in production
              res
                .status(500)
                .send("<h1>Server Configuration Error</h1><p>Missing SSR markers.</p>");
              return;
            }

            const parts = template.split("<!--app-html-->");
            let beforeApp = parts[0] || ""; // Fallback for TS safety, though check above covers it

            // Deterministic Replacement: HEAD
            beforeApp = beforeApp.replace("<!--app-head-->", headContent);

            // Override res.end immediately to ensure we capture the end of the stream
            // even if it happens synchronously (no Suspense)
            const originalEnd = res.end.bind(res);
            res.end = ((chunk: any, encoding: any, cb: any) => {
              // Inject Dehydrated State and invalidation scripts
              // We dehydrate here to get the final state
              // USE SAFE VARIABLE: queryClient (from outer scope) instead of finalClient (from return value)
              const dehydratedState = dehydrate(queryClient);

              // Defensive replacer for JSON.stringify to handle undefined/complex types
              const safeJsonStringify = (obj: any) => {
                return JSON.stringify(obj, (key, value) => {
                  if (typeof value === "undefined") return null;
                  return value;
                }).replace(/</g, "\\u003c");
              };

              res.write(`
                  <!-- FAIL-SAFE: Hydration Script must have explicit Nonce -->
                  <script nonce="${res.locals.cspNonce || ""}">
                    window.__REACT_QUERY_STATE__ = ${safeJsonStringify(dehydratedState)};
                    window.ENV = {
                      SENTRY_DSN: "${logging.sentry.dsn || ""}",
                      SENTRY_ENVIRONMENT: "${logging.sentry.environment || "production"}"
                    };
                  </script>
                `);

              const parts = template.split("<!--app-html-->");
              const footer = parts[1] || "";
              // Vite handles script injection via transformIndexHtml (Dev) and manifest/index.html (Prod).
              // So we just write the footer (which contains the scripts)
              res.write(footer);
              return originalEnd(chunk, encoding, cb);
            }) as any;
            res.write(beforeApp);
            pipe(res);
          },
          onAllReady() {
            // No-op - we handle cleanup in res.end wrapper
          },
          onShellError(error: any) {
            import("@sentry/node")
              .then((Sentry) => {
                Sentry.captureException(error, {
                  tags: { context: "ssr-shell" },
                });
              })
              .catch(() => {});

            if (!res.headersSent) {
              res.status(500).send("<h1>Server Error</h1><pre>" + error?.message + "</pre>");
            } else {
              res.end();
            }
          },
          onError(error: any) {
            console.error("[SSR-RENDER-ERROR]", error); // Explicit server-side log
            import("@sentry/node")
              .then((Sentry) => {
                Sentry.captureException(error, {
                  tags: { context: "ssr-render" },
                });
              })
              .catch(() => {});

            if (!res.headersSent) {
              res.status(500).send(`
                <h1>Server Error (Render)</h1>
                <p>${error?.message || "Unknown error during SSR"}</p>
                <pre>${error?.stack || ""}</pre>
              `);
            }
          },
        },
        queryClient,
      );
    } catch (e) {
      vite?.ssrFixStacktrace(e as Error);
      next(e);
    }
  };
}

export { createSsrHandler };
