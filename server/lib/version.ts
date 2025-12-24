import { execSync } from "child_process";

let cachedVersion: string | null = null;

export const getAppVersion = (): string => {
	if (cachedVersion) return cachedVersion;

	try {
		cachedVersion = execSync("git rev-parse --short HEAD").toString().trim();
	} catch (error) {
		cachedVersion = process.env.GIT_SHA || "dev";
	}

	return cachedVersion;
};

export const APP_VERSION = getAppVersion();
