import { Router } from "express";
import { getConfig } from "../config/production.js";

const router = Router();
const config = getConfig();

// Only serve docs in non-production or if explicitly enabled
const showDocs = config.app.environment !== "production" || process.env.ENABLE_API_DOCS === "true";

if (showDocs) {
  router.get("/", (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Run Apparel API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
        <style>
          body { margin: 0; padding: 0; }
          #swagger-ui { max-width: 1460px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              url: '/api-docs',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
              ],
              layout: "BaseLayout",
            });
          };
        </script>
      </body>
      </html>
    `);
  });
}

export default router;
