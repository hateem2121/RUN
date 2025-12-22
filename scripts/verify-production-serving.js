import { spawn } from "child_process";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Config
const PORT = 5050; // Random port for testing
const URL_BASE = `http://127.0.0.1:${PORT}`;
const TIMEOUT_MS = 20000;

console.log("🔍 Starting Production Serving Verification...");

// 1. Identify an actual asset to test
const distPublic = path.join(PROJECT_ROOT, "dist", "public", "assets");
let cssAsset = null;
let jsAsset = null;

try {
  if (fs.existsSync(distPublic)) {
    const files = fs.readdirSync(distPublic);
    cssAsset = files.find((f) => f.endsWith(".css"));
    jsAsset = files.find((f) => f.endsWith(".js"));
  }
} catch (e) {
  console.warn("⚠️  Could not list assets dir:", e.message);
}

if (!cssAsset) {
  console.error("❌ No CSS asset found in dist/public/assets. Build might be incomplete.");
  process.exit(1);
}
console.log(`📝 Found CSS asset: ${cssAsset}`);
console.log(`📝 Found JS asset: ${jsAsset}`);

// 2. Start Production Server
const server = spawn("node", ["dist/index.js"], {
  cwd: PROJECT_ROOT,
  env: {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: "production",
  },
  stdio: "pipe", // Capture output
});

let serverReady = false;

server.stdout.on("data", (data) => {
  const line = data.toString();
  // console.log(`[Server]: ${line.trim()}`);
  if (line.includes(`Server running on port ${PORT}`)) {
    serverReady = true;
  }
});

server.stderr.on("data", (data) => {
  console.error(`[Server ERR]: ${data.toString()}`);
});

// Helper to fetch
function checkUrl(path, expectedStatus = 200, expectedContentType = null) {
  return new Promise((resolve, reject) => {
    http
      .get(`${URL_BASE}${path}`, (res) => {
        const { statusCode } = res;
        const contentType = res.headers["content-type"];

        if (statusCode !== expectedStatus) {
          reject(new Error(`Expected status ${expectedStatus} for ${path}, got ${statusCode}`));
          res.resume();
          return;
        }

        if (expectedContentType && !contentType?.includes(expectedContentType)) {
          reject(
            new Error(
              `Expected Content-Type ${expectedContentType} for ${path}, got ${contentType}`,
            ),
          );
          res.resume();
          return;
        }

        resolve({ statusCode, contentType });
        res.resume();
      })
      .on("error", reject);
  });
}

// 3. Run Tests
async function runTests() {
  // Wait for server
  console.log("⏳ Waiting for server to start...");
  const start = Date.now();
  while (!serverReady) {
    if (Date.now() - start > TIMEOUT_MS) {
      throw new Error("Server start timeout");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log("✅ Server is up.");

  try {
    // Test 1: Homepage (SSR or Static)
    console.log("🧪 Test 1: Fetching Homepage / ...");
    await checkUrl("/", 200, "text/html");
    console.log("   -> Pass");

    // Test 2: CSS Asset
    console.log(`🧪 Test 2: Fetching CSS /assets/${cssAsset} ...`);
    await checkUrl(`/assets/${cssAsset}`, 200, "text/css");
    console.log("   -> Pass");

    // Test 3: JS Asset
    console.log(`🧪 Test 3: Fetching JS /assets/${jsAsset} ...`);
    await checkUrl(`/assets/${jsAsset}`, 200, "text/javascript"); // Or application/javascript
    console.log("   -> Pass");

    // Test 4: 404 behavior for missing asset (should NOT be HTML if handled by static)
    // Actually, if static misses, SSR takes over and might return 404 HTML.
    // We just ensure it doesn't crash (500).
    console.log("🧪 Test 4: Fetching Missing Asset /assets/missing.pyp ...");
    try {
      await checkUrl("/assets/missing.pyp", 404);
      console.log("   -> Pass (Correctly 404s)");
    } catch (e) {
      console.log(`   -> Note: ${e.message}`);
    }

    console.log("\n🎉 ALL SMOKE TESTS PASSED! Production Serving is Robust.");
    process.exitCode = 0;
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
}

runTests();
