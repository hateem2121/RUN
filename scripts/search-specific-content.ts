// @ts-nocheck
// Search for specific content types the user mentioned
import { storage } from "../server/storage.js";

const db = (storage as any).db;

async function searchSpecificContent() {
  const foundContent = {
    about: [],
    manufacturing: [],
    contact: [],
    sustainability: [],
  };

  const aboutKeywords = [
    "about",
    "aboutUs",
    "company",
    "companyInfo",
    "companyProfile",
    "ourStory",
    "history",
    "mission",
    "vision",
    "values",
    "team",
    "leadership",
    "founders",
    "management",
  ];

  for (const keyword of aboutKeywords) {
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${keyword}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          foundContent.about.push(item);
          if (item.content) {
          }
          if (item.description) {
          }
        }
      } catch (_e) {}
    }

    // Also check batch data
    try {
      const batchResult = await db.get(keyword);
      if (batchResult?.ok && batchResult?.value) {
        const batch = JSON.parse(batchResult.value);
        if (Array.isArray(batch)) {
          foundContent.about.push(...batch);
        }
      }
    } catch (_e) {}
  }

  const manufacturingKeywords = [
    "manufacturing",
    "manufacturingProcess",
    "production",
    "facility",
    "equipment",
    "capabilities",
    "processes",
    "factory",
    "operations",
    "qualityControl",
    "qualityAssurance",
    "testing",
    "standards",
  ];

  for (const keyword of manufacturingKeywords) {
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${keyword}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          foundContent.manufacturing.push(item);
          if (item.content) {
          }
          if (item.description) {
          }
        }
      } catch (_e) {}
    }
  }

  const contactKeywords = [
    "contact",
    "contactInfo",
    "contactUs",
    "locations",
    "offices",
    "address",
    "phone",
    "email",
    "sales",
    "support",
    "inquiry",
  ];

  for (const keyword of contactKeywords) {
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${keyword}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          foundContent.contact.push(item);
          if (item.address) {
          }
          if (item.phone) {
          }
          if (item.email) {
          }
          if (item.content) {
          }
        }
      } catch (_e) {}
    }
  }

  const sustainabilityKeywords = [
    "sustainability",
    "sustainabilityPage",
    "environmental",
    "eco",
    "green",
    "climate",
    "carbon",
    "renewable",
    "recycling",
    "organic",
    "sustainabilityInitiatives",
    "environmentalPolicy",
    "greenPractices",
  ];

  for (const keyword of sustainabilityKeywords) {
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${keyword}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          foundContent.sustainability.push(item);
          if (item.content) {
          }
          if (item.description) {
          }
          if (item.category) {
          }
        }
      } catch (_e) {}
    }
  }

  const _total =
    foundContent.about.length +
    foundContent.manufacturing.length +
    foundContent.contact.length +
    foundContent.sustainability.length;

  return foundContent;
}

searchSpecificContent().catch(console.error);
