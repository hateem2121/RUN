import { spawn } from "node:child_process";
import { createServer } from "node:net";

const PORT = 5003;
const BASE_URL = `http://localhost:${PORT}`;

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(true)); // Port in use
    server.once("listening", () => {
      server.close();
      resolve(false); // Port free
    });
    server.listen(port);
  });
}

async function waitForServer(port: number, timeout = 30000): Promise<void> {
  const start = Date.now();
  console.log(`Waiting for port ${port}...`);
  while (Date.now() - start < timeout) {
    const inUse = await checkPort(port);
    if (inUse) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout waiting for port ${port}`);
}

async function run() {
  // 1. Build
  console.log("Building...");
  const build = spawn("npm", ["run", "build"], { stdio: "inherit", shell: true });
  await new Promise<void>((resolve, reject) => {
    build.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error("Build failed"));
    });
  });

  // 2. Start Server
  console.log(`Starting Production Server on ${PORT}...`);
  const server = spawn("node", ["dist/index.js"], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "production" },
    stdio: "inherit",
    shell: true,
  });

  let serverExitCode: number | null = null;
  server.on("close", (code) => {
    serverExitCode = code;
  });

  try {
    await waitForServer(PORT);
    console.log("Server is up!");

    // 3. Run Tests
    console.log("Running Playwright...");
    const tests = spawn("npx", ["playwright", "test", "e2e/ssr-hydration.spec.ts"], {
      env: { ...process.env, E2E_BASE_URL: BASE_URL },
      stdio: "inherit",
      shell: true,
    });

    await new Promise<void>((resolve, reject) => {
      tests.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error("Tests failed"));
      });
    });

    console.log("Verification Passed!");
  } finally {
    console.log("Killing server...");
    server.kill();
    // Force kill if needed
    try {
      if (!server.killed) process.kill(server.pid!);
    } catch (_e) {}
    process.exit(serverExitCode || 0);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
