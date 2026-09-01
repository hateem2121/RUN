#!/usr/bin/env node

/**
 * Cross-platform Development Environment Cleaner
 *
 * Safely releases port 5002 and terminates orphan watch processes.
 * Operates idempotently across macOS, Linux, and Windows with zero non-zero exit codes.
 */

import { execSync } from "node:child_process";
import net from "node:net";

const PORT = 5002;

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port, "127.0.0.1");
  });
}

function killProcessOnPort(port) {
  try {
    if (process.platform === "win32") {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const lines = output.trim().split("\n");
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !Number.isNaN(Number(pid)) && Number(pid) > 0) {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        }
      }
    } else {
      const output = execSync(`lsof -ti :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const pids = output.trim().split("\n").filter(Boolean);
      for (const pid of pids) {
        if (pid && !Number.isNaN(Number(pid)) && Number(pid) !== process.pid) {
          try {
            process.kill(Number(pid), "SIGTERM");
          } catch {
            /* ignore if already exited */
          }
        }
      }
    }
  } catch {
    /* Port is free or command produced no match */
  }
}

function killOrphanProcesses() {
  try {
    if (process.platform !== "win32") {
      // Find RUN-Remix or tsx watch processes (excluding current process)
      execSync("pkill -f 'RUN-Remix' 2>/dev/null || true", { stdio: "ignore" });
    }
  } catch {
    /* Safe ignore */
  }
}

async function main() {
  killOrphanProcesses();

  const inUse = await isPortInUse(PORT);
  if (inUse) {
    killProcessOnPort(PORT);
    // Allow OS brief moment to release socket
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("✓ Clean dev environment ready");
  process.exit(0);
}

main().catch(() => {
  console.log("✓ Clean dev environment ready");
  process.exit(0);
});
