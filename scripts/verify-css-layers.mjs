import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cssPath = path.resolve(__dirname, "../client/src/index.css");

if (!fs.existsSync(cssPath)) {
	process.exit(1);
}

const css = fs.readFileSync(cssPath, "utf-8");

// Find indices of layer definitions
const baseIndex = css.indexOf("@layer base");
const componentsIndex = css.indexOf("@layer components");
const utilitiesIndex = css.indexOf("@layer utilities");

let hasError = false;

if (baseIndex === -1) {
	hasError = true;
}

if (componentsIndex === -1) {
	hasError = true;
}

if (utilitiesIndex === -1) {
	hasError = true;
}

if (!hasError) {
	if (baseIndex > componentsIndex) {
		hasError = true;
	}

	if (componentsIndex > utilitiesIndex) {
		hasError = true;
	}
}

if (hasError) {
	process.exit(1);
} else {
	process.exit(0);
}
