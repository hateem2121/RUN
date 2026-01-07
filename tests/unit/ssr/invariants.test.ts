import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";

const ROOT_DIR = process.cwd();
const CLIENT_DIR = resolve(ROOT_DIR, "client");

describe("SSR Invariants", () => {
  it("client/index.html must contain SSR markers", () => {
    const indexPath = resolve(CLIENT_DIR, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    const _$ = cheerio.load(html);

    // Check for comments involves looking at raw HTML or iterating nodes,
    // but simple string includes is safer for comment markers.
    expect(html).toContain("<!--app-head-->");
    expect(html).toContain("<!--app-html-->");
  });

  it("client/app/entry.client.tsx must use startTransition for React 19 hydration", () => {
    const entryPath = resolve(CLIENT_DIR, "app/entry.client.tsx");
    const content = readFileSync(entryPath, "utf-8");

    expect(content).toContain("startTransition");
    expect(content).toContain("hydrateRoot");
  });

  it("client/vite.config.ts must externalize backend dependencies", () => {
    const configPath = resolve(CLIENT_DIR, "vite.config.ts");
    const content = readFileSync(configPath, "utf-8");

    // Critical backend deps that must NOT be in client bundle
    const forbiddenDeps = ["pg", "drizzle-orm", "better-sqlite3"];

    // Check they are listed in external or noExternal appropriately
    // Actually we just want to ensure they ARE externalized in ssr.external
    forbiddenDeps.forEach((dep) => {
      expect(content).toMatch(new RegExp(`external:.*"${dep}"`, "s"));
    });
  });
});
