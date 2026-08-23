import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 },
];

const THEMES = ["light", "dark"] as const;

const MASTER_ROUTES = [
  // 20 Public Routes
  "/",
  "/about",
  "/products",
  "/categories",
  "/fabrics",
  "/fibers",
  "/manufacturing",
  "/sustainability",
  "/technology",
  "/services",
  "/certifications",
  "/collections",
  "/gallery",
  "/contact",
  "/blog",
  "/size-charts",
  "/accessories",
  "/developer",
  "/privacy",
  "/terms",
  // 22 Admin Routes
  "/admin",
  "/admin/homepage",
  "/admin/about",
  "/admin/sustainability",
  "/admin/manufacturing",
  "/admin/technology",
  "/admin/blog",
  "/admin/categories",
  "/admin/products",
  "/admin/fabrics",
  "/admin/fibers",
  "/admin/certificates",
  "/admin/size-charts",
  "/admin/accessories",
  "/admin/collections",
  "/admin/gallery",
  "/admin/contact",
  "/admin/inquiries",
  "/admin/navigation",
  "/admin/footer",
  "/admin/media",
  "/admin/storage-optimization",
];

async function captureMatrix() {
  const args = process.argv.slice(2);
  const routeArgs = args.filter((a) => a.startsWith("/"));
  const routes = routeArgs.length > 0 ? routeArgs : MASTER_ROUTES;

  const outBase = path.resolve(process.cwd(), "visual-audit/captures");
  fs.mkdirSync(outBase, { recursive: true });

  console.log(`🚀 Starting visual capture for ${routes.length} routes: ${routes.join(", ")}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // If any route is admin, authenticate first via mock-login
  const hasAdmin = routes.some((r) => r.startsWith("/admin"));
  if (hasAdmin) {
    const authPage = await context.newPage();
    try {
      await authPage.goto("http://localhost:5002/api/auth/mock-login?returnTo=/admin/homepage", {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      console.log("🔐 Authenticated admin session successfully.");
    } catch (e) {
      console.warn("⚠️ Mock login warning (ignoring if dev auth bypass active):", e);
    } finally {
      await authPage.close();
    }
  }

  for (const route of routes) {
    const routeSlug = route === "/" ? "homepage" : route.replace(/^\//, "").replace(/\//g, "-");
    const routeDir = path.join(outBase, routeSlug);
    fs.mkdirSync(routeDir, { recursive: true });

    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        const page = await context.newPage({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme,
        });

        const targetUrl = route.startsWith("/admin")
          ? `http://localhost:5002/api/auth/mock-login?returnTo=${encodeURIComponent(route)}`
          : `http://localhost:5002${route}`;
        try {
          await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
          await page.evaluate((th) => {
            document.documentElement.setAttribute("data-theme", th);
            if (th === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }, theme);

          await page.addStyleTag({
            content: `
              *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
              }
            `,
          });

          if (route.startsWith("/admin")) {
            await page
              .waitForFunction(
                () => {
                  const text = document.body.innerText;
                  return (
                    !text.includes("Checking access...") &&
                    !text.includes("Redirecting to login...")
                  );
                },
                { timeout: 10000 },
              )
              .catch(() => {});
            await page.waitForTimeout(1000);
          } else {
            await page.waitForTimeout(800);
          }

          const filename = `${vp.name}-${theme}.png`;
          const filePath = path.join(routeDir, filename);

          await page.screenshot({
            path: filePath,
            fullPage: false,
          });

          console.log(`📸 [${routeSlug}] ${vp.name} (${theme}) -> ${filePath}`);
        } catch (err) {
          console.error(`❌ Failed capturing ${route} on ${vp.name} (${theme}):`, err);
        } finally {
          await page.close();
        }
      }
    }
  }

  await context.close();
  await browser.close();
  console.log("✅ Visual capture batch completed.");
}

if (process.env.NODE_ENV !== "test") {
  captureMatrix().catch((e) => {
    console.error("Matrix capture fatal error:", e);
    process.exit(1);
  });
}
