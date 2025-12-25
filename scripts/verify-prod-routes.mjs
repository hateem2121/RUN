import http from "http";

const HOST = "localhost";
const PORT = 5002;
const TIMEOUT_MS = 5000;

const ROUTES_TO_CHECK = [
  { path: "/", expect: 200 },
  { path: "/about", expect: 200 },
  { path: "/technology", expect: 200 },
  { path: "/favicon.ico", expect: 200 }, // Static asset
  { path: "/does-not-exist-123", expect: 404 },
];

function checkRoute(route) {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${PORT}${route.path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        // Status Check
        if (res.statusCode !== route.expect) {
          // Allow 200 for 404 if it's an App Shell (SPA fallback), but specific to design
          // Here we expect server-side 404 for convenience or 200 with "Not Found" content
          // If we get 200 for a non-existent route, check content
          if (route.expect === 404 && res.statusCode === 200) {
            if (data.includes("Not Found") || data.includes("404")) {
              resolve(true);
              return;
            }
          }
          resolve(false);
          return;
        }

        // HTML Structural Check (Skip for static assets)
        if (res.headers["content-type"]?.includes("text/html")) {
          const errors = [];
          if (data.includes("<!--app-head-->")) errors.push("Unreplaced head marker");
          if (data.includes("<!--app-html-->")) errors.push("Unreplaced html marker");
          if (!data.includes('<div id="root">')) errors.push("Missing React Root");
          if (!data.includes("<!doctype html>")) errors.push("Missing Doctype");

          // Critical CSS check (Prod only)
          if (!/<link[^>]*rel="stylesheet"/i.test(data)) errors.push("Missing CSS Links");

          if (errors.length > 0) {
            resolve(false);
            return;
          }
        }
        resolve(true);
      });
    });

    req.on("error", (err) => {
      resolve(false);
    });

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function run() {
  let allPass = true;
  for (const route of ROUTES_TO_CHECK) {
    const pass = await checkRoute(route);
    if (!pass) allPass = false;
  }

  if (allPass) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run();
