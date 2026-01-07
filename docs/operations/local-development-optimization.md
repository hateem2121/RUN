# Node.js Optimization & Efficiency Plan

## 1. Current State Analysis

**Architecture:**

- **Monorepo:** Workspaces for `@run-remix/client`, `@run-remix/server`, `@run-remix/shared`.
- **Dev Entry:** `npm run dev` (Root) -> `npm run dev` (Server).
- **Process Model:** Single Node.js process (`tsx watch`) initializes the Express server, which in turn spawns the Vite Dev Server (via Middleware Mode).
- **Efficiency:** **High**. This "BFF (Backend for Frontend)" pattern avoids running two separate heavy processes (Vite + Express) and proxying between them.

## 2. Optimization Recommendations

### A. Zombie Process Prevention (Critical)

Your `package.json` currently uses `npx kill-port 5001`. This is good, but sometimes fails to kill unrelated detached processes or zombie workers.

**Recommendation:** Update `predev` to be more robust.

```json
// server/package.json
"scripts": {
  "predev": "npx kill-port 5001 && pkill -f 'tsx watch' || true",
}
```

### B. Memory Management

Node.js defaults to a 2GB (approx) heap limit. In a monitored environment or on a machine with limited RAM, this can be efficient or a bottleneck.

**Recommendation:** Use `NODE_OPTIONS` to set explicit limits if you encounter "OOM" errors or want to constrain usage.

```bash
# In .env or shell profile
export NODE_OPTIONS="--max-old-space-size=4096" # For performance
# OR
export NODE_OPTIONS="--max-old-space-size=2048" # To save battery/RAM
```

### C. Watcher Efficiency

The current ignore list in `server/package.json` is good:
`--ignore '**/node_modules' --ignore '../client/node_modules' --ignore 'dist' --ignore '.cache' --ignore 'coverage'`

**Optimization:** Add git-related files and logs to prevent spurious restarts.
`--ignore '.git' --ignore '*.log'`

### D. Hardware Acceleration for Biome/Vite

Ensure you are using the native binaries for your OS.

- You are on macOS (`darwin-arm64` or `x64`).
- **Verified:** Your `ps aux` showed `esbuild` running, which uses Go and is highly efficient.

## 3. Future Scalability (Proactive)

If the project grows, `tsx watch` might become slow as it re-compiles TS on the fly.

**Future Step:**

- **Switch to `swc`:** `tsx` uses `esbuild` under the hood (fast).
- **TurboRepo / Nx:** If you add more services (e.g., a separate worker process), use a task runner like TurboRepo to run them in parallel only when needed.

## 4. Runbook: How to "Reset" Development Environment

If your specific request "Kill all node.js servers" happens often, add a dedicated "nuke" command to your root `package.json`.

**Action:** Add `kill:all` script.

```json
// root package.json
"scripts": {
  "kill:all": "pkill -f 'RUN-Remix' || echo 'No processes found'"
}
```
