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
  const serverProcess = spawn(TSX_PATH, [SERVER_PATH], {
    env: {
      ...process.env,
      PORT: "0", // Dynamic port
      JWT_SECRET: process.env.JWT_SECRET || "test-jwt-secret-12345", // Ensure valid secret for startup check
      FORCE_LISTEN: "true", // Force server to listen even in test mode
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let killed = false;
  const kill = () => {
    if (killed) return;
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
    const timeout = setTimeout(() => {
      kill();
      reject(new Error("Server start timeout"));
    }, 10000);

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
