import { type ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_PATH = path.resolve(__dirname, "../../server/index.ts");
const TSX_PATH = path.resolve(__dirname, "../../node_modules/.bin/tsx");

export interface TestServer {
  process: ChildProcess;
  baseUrl: string;
  kill: () => void;
}

export async function startTestServer(env: NodeJS.ProcessEnv = {}): Promise<TestServer> {
  const spawnEnv = {
    ...process.env,
    PORT: "0", // Dynamic port
    ENABLE_DEBUG_ROUTES: "true",
    DEBUG_ROUTE_TOKEN: "test-token-123",
    // Inherit real DB config if present
    DATABASE_URL: process.env.DATABASE_URL || "postgres://localhost:5432/test",
    TEST_REAL_DB: process.env.TEST_REAL_DB || "false",
    SESSION_SECRET: "test-session-secret-12345-long-enough", // 32+ chars
    JWT_SECRET: "test-jwt-secret-12345",
    FORCE_LISTEN: "true",
    VITEST: "true", // Ensure spawned server knows it's in test mode
    ...env,
  };
  const serverProcess = spawn(TSX_PATH, [SERVER_PATH], {
    env: spawnEnv,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  let killed = false;
  const kill = () => {
    if (killed) {
      return;
    }
    killed = true;
    if (serverProcess.pid) {
      serverProcess.kill("SIGTERM");
      // Force kill fallback if it hangs
      setTimeout(() => {
        if (serverProcess.exitCode === null) {
          try {
            process.kill(serverProcess.pid!, "SIGKILL");
          } catch (_e) {
            /* ignore if already gone */
          }
        }
      }, 2000).unref();
    }
  };

  return new Promise((resolve, reject) => {
    // Increased timeout for CI environments and cold starts
    const timeout = setTimeout(() => {
      kill();
      reject(new Error("Server start timeout after 60s"));
    }, 60000);

    let baseUrl = "";

    let _stdoutData = "";
    let _stderrData = "";

    serverProcess.stdout?.on("data", (data) => {
      _stdoutData += data.toString();
      process.stderr.write(data); // Debug: Pipe server stdout to test runner stderr
      const str = data.toString();
      // console.log("[Server]", str); // Optional debug
      const match = str.match(/Server running on port (\d+)/);
      if (match) {
        const port = match[1];
        baseUrl = `http://localhost:${port}`;
        clearTimeout(timeout);
        // Don't resolve yet if we want to wait for "Ready"?
        // Current app prints "Server running on port..." as final step.
        resolve({ process: serverProcess, baseUrl, kill });
      }
    });

    serverProcess.stderr?.on("data", (data) => {
      _stderrData += data.toString();
    });

    serverProcess.stderr?.pipe(process.stderr);

    serverProcess.on("exit", (code) => {
      if (!baseUrl) {
        clearTimeout(timeout);
        reject(new Error(`Server exited prematurely with code ${code}`));
      }
    });

    serverProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
