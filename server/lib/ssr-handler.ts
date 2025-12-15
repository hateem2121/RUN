import type { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { createServer as createViteServer, ViteDevServer } from "vite";
import { dehydrate } from "@tanstack/react-query";
import { getStorage } from "./storage-singleton.js";

const isProduction = process.env.NODE_ENV === "production";
const root = process.cwd();

async function createSsrHandler(app: any) {
  let vite: ViteDevServer | undefined;

  if (!isProduction) {
    vite = await createViteServer({
      server: { middlewareMode: true },
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
      // console.log("[SSR] Skipping:", req.originalUrl); // Verbose
      return next();
    }

    console.log("[SSR] Handling Request:", req.originalUrl);

    try {
      const url = req.originalUrl;
      let template: string;
      let render: any;
      let createQueryClient: any;

      if (vite) {
        template = fs.readFileSync(path.resolve(root, "client/index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        const module = await vite.ssrLoadModule("/src/entry-server.tsx");
        render = module.render;
        createQueryClient = module.createQueryClient;
      } else {
        // Prod: Read built template and server bundle
        console.log("[SSR] Running in Production/Build Mode");
        template = fs.readFileSync(path.resolve(root, "dist/public/index.html"), "utf-8");
        const entryServerPath = path.resolve(root, "dist/server/entry-server.js");
        const module = await import(pathToFileURL(entryServerPath).href);
        // @ts-ignore
        render = module.render;
        // @ts-ignore
        createQueryClient = module.createQueryClient;
      }

      // PREFETCH DATA
      // Create a fresh QueryClient for this request
      const queryClient = createQueryClient();

      // 1. Prefetch Categories (common across all pages)
      try {
        const categories = await getStorage().getCategories();
        queryClient.setQueryData(["/api/categories"], categories);
      } catch (err) {
        console.error("SSR Prefetch Error (Categories):", err);
      }

      // 2. Route-Specific Prefetching (Fix for ISSUE-004)
      try {
        if (url === "/contact" || url.startsWith("/contact?")) {
          console.log("[SSR] Prefetching Contact Config");
          const contactConfig = await getStorage().getContactPageConfiguration();
          if (contactConfig) {
            queryClient.setQueryData(["/api/contact-info"], contactConfig);
          }
        }
      } catch (err) {
        console.error("SSR Prefetch Error (Route Specific):", err);
      }

      // Split template into head and footer
      // Assumes template has <!--app-root--> placeholder or similar
      // If not, we can split at <div id="root"></div> or inject into body.
      // Standard Vite templates often look like: <div id="root"></div>

      // Robustly finding the root div to inject app content
      // Handle potential whitespace/indentation around the root div
      const rootDivRegex = /<div id="root">\s*<\/div>/;
      let [head, footer] = template.split(rootDivRegex);

      if (!footer) {
        // Fallback: Try splitting by body tag if root div is missing or different
        const bodyRegex = /<body>/;
        const bodyMatch = template.match(bodyRegex);
        if (bodyMatch) {
          [head, footer] = template.split(bodyRegex);
          head += '<body><div id="root">';
          footer = "</div>" + footer;
        } else {
          console.error("SSR Error: Could not find <div id='root'> or <body> in template");
          // Emergency fallback
          head = template;
          footer = "";
        }
      } else {
        // Standard case: we found the root div, so we reconstruct the opening
        head += '<div id="root">';
        footer = "</div>" + footer;
      }

      const {
        pipe,
        queryClient: finalClient,
        helmetContext,
      } = render(
        url,
        res,
        {
          onShellReady() {
            // The instruction implies a `didError` variable, but it's not present in the original code.
            // Assuming the intent is to set status code based on rendering success/failure,
            // but for onShellReady, it's typically 200 unless an error occurred before this point.
            // Sticking to the original 200 for now, as `didError` is not defined.
            res.status(200); // Original: res.status(200);
            res.set("Content-Type", "text/html"); // Original: res.set("Content-Type", "text/html");

            // Extract helmet data from context
            const { helmet } = helmetContext as any;

            // Generate head tags string
            const headTags = `
              ${helmet.title.toString()}
              ${helmet.priority.toString()}
              ${helmet.meta.toString()}
              ${helmet.link.toString()}
              ${helmet.script.toString()}
            `;

            // Inject into head
            // Replace existing <title> tag if present to avoid duplicates, or just append if strict replacement isn't critical (Helmet usually manages this on client, but for SSR we want clean HTML)
            // A simple replacement for </head> works well to ensure it's at the end of head
            const finalHead = (head || "").replace("</head>", `${headTags}</head>`);

            res.write(finalHead);
          },
          async onAllReady() {
            const dehydratedState = dehydrate(finalClient);
            // Intercept res.end to inject scripts before closing
            const originalEnd = res.end.bind(res);
            res.end = function (chunk: any, encoding: any, cb: any) {
              // Vital: Ensure entry-client is injected.
              // React's pipe() might close the stream before we can write the footer normally on some environments.
              res.write(`
                  <script>
                    window.__REACT_QUERY_STATE__ = ${JSON.stringify(dehydratedState).replace(/</g, "\\u003c")};
                  </script>
                `);

              if (!footer.includes("entry-client.tsx")) {
                res.write('<script type="module" src="/src/entry-client.tsx"></script>');
              }
              res.write(footer);

              return originalEnd(chunk, encoding, cb);
            } as any;

            pipe(res);
          },
          onShellError(error: any) {
            if (!res.headersSent) {
              res.status(500).send("<h1>Server Error</h1><pre>" + error?.message + "</pre>");
            } else {
              console.error("SSR Shell Error (Headers already sent):", error);
              res.end();
            }
          },
          onError(error: any) {
            console.error("SSR Render Error:", error);
            if (!res.headersSent) {
              // If error happens before shell is ready, we can send a 500
              res.status(500).send("<h1>Server Error (Render)</h1>");
            }
          },
        },
        queryClient,
      ); // Pass the prefetched client
    } catch (e) {
      vite?.ssrFixStacktrace(e as Error);
      next(e);
    }
  };
}

export { createSsrHandler };
