import { appStorageService } from "../app-storage-service.js";

async function listStorageDetailed() {
  try {
    const publicFiles = await appStorageService.listAssets("public/");
    publicFiles.forEach((_file, _i) => {});
    const privateFiles = await appStorageService.listAssets("private/");

    // Group by directory
    const tempUploads = privateFiles.filter((f) => f.includes("temp/uploads/"));
    const otherPrivate = privateFiles.filter((f) => !f.includes("temp/uploads/"));
    if (tempUploads.length > 0 && tempUploads.length <= 20) {
      tempUploads.forEach((_file, _i) => {});
    } else if (tempUploads.length > 20) {
    }
    if (otherPrivate.length > 0) {
      otherPrivate.forEach((_file, _i) => {});
    }
  } catch (_error) {}
}

listStorageDetailed();
