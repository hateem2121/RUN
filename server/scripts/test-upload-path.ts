import { appStorageService } from "../app-storage-service.js";

async function testUploadPath() {
	// Create a test image buffer
	const testBuffer = Buffer.from(
		"Test image data - path normalization fix test",
	);
	const testPath =
		"public/media/images/2025/10/1760264400000-test-upload-fix.png";

	try {
		await appStorageService.uploadAsset(testPath, testBuffer, {
			contentType: "image/png",
		});
		const publicFiles = await appStorageService.listAssets("public/media/");
		const testFile = publicFiles.find((f) => f.includes("test-upload-fix"));

		if (testFile) {
			if (testFile === testPath) {
			} else {
			}
		} else {
			// Check if it went to wrong location
			const privateFiles =
				await appStorageService.listAssets("private/public/");
			const wrongFile = privateFiles.find((f) => f.includes("test-upload-fix"));

			if (wrongFile) {
			}
		}

		// Cleanup
		await appStorageService.deleteAsset(testPath);
	} catch (error) {}
}

testUploadPath();
