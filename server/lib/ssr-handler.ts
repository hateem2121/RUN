import { dehydrate } from "@tanstack/react-query";
import type { NextFunction, Request, Response } from "express";
import fs from "fs";
import type { Server as HttpServer } from "http"; // HMR FIX: Import HttpServer type
import path from "path";
import { pathToFileURL } from "url";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { logging } from "../config/environment.js";
import { getStorage } from "./storage-singleton.js";

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

    console.log("[SSR] Handling Request:", req.originalUrl);

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
        // FIX: Inject CSS manually in dev mode to prevent FOUC
        // We preferentially use the new <!--ssr-styles--> placeholder
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
        console.log("[SSR] Running in Production/Build Mode");
        template = fs.readFileSync(path.resolve(root, "dist/public/index.html"), "utf-8");
        const entryServerPath = path.resolve(root, "dist/server/entry-server.js");
        const module = await import(pathToFileURL(entryServerPath).href);
        render = module.render;
        createQueryClient = module.createQueryClient;

        // P1: FOUC Prevention - Inject Critical CSS
        try {
          const manifestPath = path.resolve(root, "dist/public/.vite/manifest.json");
          if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
            // Find entry chunk (index.html or entry-client.tsx)
            const entryKey = "index.html";
            const entry = manifest[entryKey];

            if (entry && entry.css) {
              const cssLinks = entry.css
                .filter((file: string) => !template.includes(file))
                .map((file: string) => `<link rel="stylesheet" href="/${file}">`)
                .join("\n");

              if (template.includes("<!--ssr-styles-->")) {
                template = template.replace("<!--ssr-styles-->", cssLinks);
              } else if (template.includes("<!--app-head-->")) {
                template = template.replace("<!--app-head-->", `${cssLinks}\n<!--app-head-->`);
              } else {
                template = template.replace("</head>", `${cssLinks}</head>`);
              }
            }
          }
        } catch (e) {
          console.error("[SSR] Failed to inject critical CSS:", e);
        }
      }

      // PREFETCH DATA
      const queryClient = createQueryClient();

      try {
        const categories = await getStorage().getCategories();
        queryClient.setQueryData(["/api/categories"], categories);
      } catch (err) {
        console.error("SSR Prefetch Error (Categories):", err);
      }

      try {
        if (url === "/contact" || url.startsWith("/contact?")) {
          const contactConfig = await getStorage().getContactPageConfiguration();
          if (contactConfig) {
            queryClient.setQueryData(["/api/contact-info"], contactConfig);
          }
        }
      } catch (err) {
        console.error("SSR Prefetch Error (Route Specific):", err);
      }

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
            console.log("[SSR] onShellReady called");
            res.status(200);
            res.set("Content-Type", "text/html");

            const { helmet } = helmetContext as any;

            // Construct Head Content
            const headContent = `
              ${helmet.title.toString()}
              ${helmet.priority.toString()}
              ${helmet.meta.toString()}
              ${helmet.link.toString()}
              ${helmet.script.toString()}
            `;

            // Prepare the stream with STRICT marker replacement
            // We expect index.html to have <!--app-head--> and <!--app-html-->

            if (!template.includes("<!--app-head-->") || !template.includes("<!--app-html-->")) {
              console.error("[SSR] CRITICAL: Missing template markers in index.html");
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
              console.log("[SSR] res.end called! Writing footer...");
              // Inject Dehydrated State and invalidation scripts
              // We dehydrate here to get the final state
              // USE SAFE VARIABLE: queryClient (from outer scope) instead of finalClient (from return value)
              const dehydratedState = dehydrate(queryClient);

              res.write(`
                  <script nonce="${res.locals.cspNonce || ""}">
                    window.__REACT_QUERY_STATE__ = ${JSON.stringify(dehydratedState).replace(
                      /</g,
                      "\\u003c",
                    )};
                    window.ENV = {
                      SENTRY_DSN: "${logging.sentry.dsn || ""}",
                      SENTRY_ENVIRONMENT: "${logging.sentry.environment || "production"}"
                    };
                  </script>
                `);

              const parts = template.split("<!--app-html-->");
              const footer = parts[1] || "";

              console.log("[SSR] Footer length:", footer.length);
              // Vite handles script injection via transformIndexHtml (Dev) and manifest/index.html (Prod).
              // So we just write the footer (which contains the scripts)
              res.write(footer);

              console.log("[SSR] Calling originalEnd");
              return originalEnd(chunk, encoding, cb);
            }) as any;

            // Flush the first part (pre-app HTML)
            console.log("[SSR] Writing beforeApp length:", beforeApp.length);
            console.log("[SSR] beforeApp TAIL:", beforeApp.slice(-200));
            res.write(beforeApp);

            // Pipe the React Render Stream (app HTML)
            console.log("[SSR] Piping React stream...");
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
              console.error("SSR Shell Error (Headers already sent):", error);
              res.end();
            }
          },
          onError(error: any) {
            console.error("SSR Render Error:", error);
            import("@sentry/node")
              .then((Sentry) => {
                Sentry.captureException(error, {
                  tags: { context: "ssr-render" },
                });
              })
              .catch(() => {});

            if (!res.headersSent) {
              res.status(500).send("<h1>Server Error (Render)</h1>");
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
