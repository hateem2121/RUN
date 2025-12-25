// Extract and display user's business data for confirmation
import { storage } from "../server/storage.js";

const db = (storage as any).db;

async function showUserBusinessData() {
  let _categoryCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`categories:${i}`);
      if (result?.ok && result?.value) {
        const _cat = JSON.parse(result.value);
        _categoryCount++;
      }
    } catch (_e) {}
  }
  let _productCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`products:${i}`);
      if (result?.ok && result?.value) {
        const prod = JSON.parse(result.value);
        _productCount++;
        if (prod.sku) {
        }
        if (prod.description) {
        }
        if (prod.categoryId) {
        }
      }
    } catch (_e) {}
  }
  let _fabricCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`fabrics:${i}`);
      if (result?.ok && result?.value) {
        const fab = JSON.parse(result.value);
        _fabricCount++;
        if (fab.fabricType) {
        }
        if (fab.description) {
        }
      }
    } catch (_e) {}
  }
  let _fiberCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`fibers:${i}`);
      if (result?.ok && result?.value) {
        const fiber = JSON.parse(result.value);
        _fiberCount++;
        if (fiber.type) {
        }
        if (fiber.sustainabilityScore) {
        }
      }
    } catch (_e) {}
  }
  let _certCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`certificates:${i}`);
      if (result?.ok && result?.value) {
        const cert = JSON.parse(result.value);
        _certCount++;
        if (cert.type) {
        }
        if (cert.issuingBody) {
        }
      }
    } catch (_e) {}
  }
  let _accessoryCount = 0;
  for (let i = 1; i <= 50; i++) {
    try {
      const result = await db.get(`accessories:${i}`);
      if (result?.ok && result?.value) {
        const acc = JSON.parse(result.value);
        _accessoryCount++;
        if (acc.type) {
        }
        if (acc.description) {
        }
      }
    } catch (_e) {}
  }
}

showUserBusinessData().catch(console.error);
