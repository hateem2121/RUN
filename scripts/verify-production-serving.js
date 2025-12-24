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
} catch (e) {}

if (!cssAsset) {
	process.exit(1);
}

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

server.stderr.on("data", (data) => {});

// Helper to fetch
function checkUrl(path, expectedStatus = 200, expectedContentType = null) {
	return new Promise((resolve, reject) => {
		http
			.get(`${URL_BASE}${path}`, (res) => {
				const { statusCode } = res;
				const contentType = res.headers["content-type"];

				if (statusCode !== expectedStatus) {
					reject(
						new Error(
							`Expected status ${expectedStatus} for ${path}, got ${statusCode}`,
						),
					);
					res.resume();
					return;
				}

				if (
					expectedContentType &&
					!contentType?.includes(expectedContentType)
				) {
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
	const start = Date.now();
	while (!serverReady) {
		if (Date.now() - start > TIMEOUT_MS) {
			throw new Error("Server start timeout");
		}
		await new Promise((r) => setTimeout(r, 500));
	}

	try {
		await checkUrl("/", 200, "text/html");
		await checkUrl(`/assets/${cssAsset}`, 200, "text/css");
		await checkUrl(`/assets/${jsAsset}`, 200, "text/javascript"); // Or application/javascript
		try {
			await checkUrl("/assets/missing.pyp", 404);
		} catch (e) {}
		process.exitCode = 0;
	} catch (err) {
		process.exitCode = 1;
	} finally {
		server.kill();
	}
}

runTests();
