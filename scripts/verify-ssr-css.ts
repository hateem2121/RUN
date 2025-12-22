import fetch from "node-fetch";
import { JSDOM } from "jsdom";

async function verifySsrCss(port = 5001) {
  const url = `http://localhost:${port}/`;
  console.log(`[Verify] Fetching ${url}...`);

  try {
    const res = await fetch(url);
    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const errors: string[] = [];

    // Check 1: Inline Critical CSS
    const styleTags = Array.from(doc.querySelectorAll("style"));
    const criticalStyle = styleTags.find(
      (s) =>
        s.textContent?.includes("body {") && s.textContent?.includes("background-color: #09090b"),
    );

    if (!criticalStyle) {
      errors.push("❌ Missing critical inline CSS (body { background-color: #09090b })");
    } else {
      console.log("✅ Found critical inline CSS.");
    }

    // Check 2: Stylesheet Link
    const links = Array.from(doc.querySelectorAll("link[rel='stylesheet']"));
    const hasCssLink = links.some(
      (l) => l.href.includes("/src/index.css") || l.href.includes(".css"),
    );

    if (!hasCssLink) {
      errors.push("❌ Missing external stylesheet link (<link rel='stylesheet'>)");
    } else {
      console.log(`✅ Found stylesheet link(s): ${links.map((l) => l.href).join(", ")}`);
    }

    // Check 3: Placeholder Removal
    if (html.includes("<!--ssr-styles-->")) {
      errors.push("❌ <!--ssr-styles--> placeholder still present (not replaced)");
    } else {
      console.log("✅ <!--ssr-styles--> placeholder successfully replaced.");
    }

    if (errors.length > 0) {
      console.error("\nVerification Failed:");
      errors.forEach((e) => console.error(e));
      process.exit(1);
    } else {
      console.log("\n🎉 SSR CSS Verification Passed!");
      process.exit(0);
    }
  } catch (err) {
    console.error("Fetch error:", err);
    process.exit(1);
  }
}

const port = process.env.PORT ? parseInt(process.env.PORT) : 5001;
verifySsrCss(port);
