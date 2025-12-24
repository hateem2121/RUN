import fs from "fs";
import http from "http";
import path from "path";

const HOST = "localhost";
const PORT = 5002;
// Wait up to 5 seconds for response
const TIMEOUT_MS = 5000;

function verifyHTML(html) {
	const errors = [];

	// 1. DOCTYPE
	if (!/<!doctype html>/i.test(html)) {
		errors.push("Missing <!doctype html>");
	}

	// 2. Head/Body count
	const headCount = (html.match(/<head>/g) || []).length;
	const bodyCount = (html.match(/<body/g) || []).length;
	if (headCount !== 1) errors.push(`Expected 1 <head>, found ${headCount}`);
	if (bodyCount !== 1) errors.push(`Expected 1 <body>, found ${bodyCount}`);

	// 3. Markers check (should be gone)
	if (html.includes("<!--app-head-->"))
		errors.push("Found unreplaced <!--app-head--> marker");
	if (html.includes("<!--app-html-->"))
		errors.push("Found unreplaced <!--app-html--> marker");

	// 4. Critical CSS (Production requirement)
	// We expect at least one link rel="stylesheet"
	if (!/<link[^>]*rel="stylesheet"/i.test(html)) {
		errors.push("Missing Critical CSS (<link rel='stylesheet'>)");
	}

	// 5. Entry Client Script
	if (!html.includes('src="/assets/entry-client')) {
		// In production, Vite hashes filenames, so exact match is hard.
		// But we expect SOME script module.
		if (
			!/<script type="module" crossorigin src="\/assets\/index-[^"]+\.js"><\/script>/.test(
				html,
			) &&
			!html.includes("entry-client")
		) {
			// It might be named index.js or entry-client.js depending on build config
			// But standard vite build produces assets/index-[hash].js
			// Let's check for ANY module script in assets
			if (!/src="\/assets\/.*\.js"/.test(html)) {
				errors.push("Missing Client Entry script");
			}
		}
	}

	return errors;
}

function checkServer() {
	const req = http.get(`http://${HOST}:${PORT}/`, (res) => {
		let data = "";
		res.on("data", (chunk) => (data += chunk));
		res.on("end", () => {
			if (res.statusCode !== 200) {
				process.exit(1);
			}

			const errors = verifyHTML(data);
			if (errors.length > 0) {
				errors.forEach((e) => {});

				process.exit(1);
			}
			process.exit(0);
		});
	});

	req.on("error", (err) => {
		process.exit(1);
	});

	req.setTimeout(TIMEOUT_MS, () => {
		req.destroy();
		process.exit(1);
	});
}

// Only run if called directly
checkServer();
