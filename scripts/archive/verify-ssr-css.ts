// @ts-expect-error: Missing @types/jsdom
import { JSDOM } from "jsdom";

async function verifySsrCss(port = 5001) {
  const url = `http://localhost:${port}/`;

  try {
    const res = await fetch(url);
    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const errors: string[] = [];

    // Check 1: Inline Critical CSS
    const styleTags = Array.from(doc.querySelectorAll("style"));
    const criticalStyle = styleTags.find(
      (s: any) =>
        s.textContent?.includes("body {") && s.textContent?.includes("background-color: #09090b"),
    );

    if (!criticalStyle) {
      errors.push("❌ Missing critical inline CSS (body { background-color: #09090b })");
    } else {
    }

    // Check 2: Stylesheet Link
    const links = Array.from(doc.querySelectorAll("link[rel='stylesheet']"));
    const hasCssLink = links.some(
      (l: any) => l.href.includes("/src/index.css") || l.href.includes(".css"),
    );

    if (!hasCssLink) {
      errors.push("❌ Missing external stylesheet link (<link rel='stylesheet'>)");
    } else {
    }

    // Check 3: Placeholder Removal
    if (html.includes("<!--ssr-styles-->")) {
      errors.push("❌ <!--ssr-styles--> placeholder still present (not replaced)");
    } else {
    }

    if (errors.length > 0) {
      errors.forEach((_e) => {});
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (_err) {
    process.exit(1);
  }
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
verifySsrCss(port);
