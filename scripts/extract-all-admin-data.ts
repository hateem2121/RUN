// Extract ALL admin data from all sections
import { storage } from "../server/storage.js";

const db = (storage as any).db;

async function extractAllAdminData() {
  let _accessoryCount = 0;
  for (let i = 1; i <= 20; i++) {
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
  let _sizeChartCount = 0;
  for (let i = 1; i <= 20; i++) {
    try {
      const result = await db.get(`sizeCharts:${i}`);
      if (result?.ok && result?.value) {
        const size = JSON.parse(result.value);
        _sizeChartCount++;
        if (size.category) {
        }
        if (size.description) {
        }
      }
    } catch (_e) {}
  }

  // Homepage hero
  try {
    const heroResult = await db.get("homepageHero:1");
    if (heroResult?.ok && heroResult?.value) {
      const _hero = JSON.parse(heroResult.value);
    }
  } catch (_e) {}

  // Homepage sections
  let _homepageSectionCount = 0;
  for (let i = 1; i <= 10; i++) {
    try {
      const result = await db.get(`homepageSections:${i}`);
      if (result?.ok && result?.value) {
        const section = JSON.parse(result.value);
        _homepageSectionCount++;
        if (section.description) {
        }
      }
    } catch (_e) {}
  }

  // Homepage process cards
  let _processCardCount = 0;
  for (let i = 1; i <= 10; i++) {
    try {
      const result = await db.get(`homepageProcessCards:${i}`);
      if (result?.ok && result?.value) {
        const card = JSON.parse(result.value);
        _processCardCount++;
        if (card.description) {
        }
      }
    } catch (_e) {}
  }
  let _navCount = 0;
  for (let i = 1; i <= 10; i++) {
    try {
      const result = await db.get(`navigationItems:${i}`);
      if (result?.ok && result?.value) {
        const nav = JSON.parse(result.value);
        _navCount++;
        if (nav.description) {
        }
      }
    } catch (_e) {}
  }

  // Footer sections
  let _footerSectionCount = 0;
  for (let i = 1; i <= 5; i++) {
    try {
      const result = await db.get(`footerSections:${i}`);
      if (result?.ok && result?.value) {
        const _section = JSON.parse(result.value);
        _footerSectionCount++;
      }
    } catch (_e) {}
  }

  // Footer links
  let _footerLinkCount = 0;
  for (let i = 1; i <= 20; i++) {
    try {
      const result = await db.get(`footerLinks:${i}`);
      if (result?.ok && result?.value) {
        const _link = JSON.parse(result.value);
        _footerLinkCount++;
      }
    } catch (_e) {}
  }

  const techSections = [
    "technologyHero",
    "technologyInnovations",
    "technologyEquipment",
    "technologyCta",
    "technologyRoadmap",
    "technologyResearch",
  ];

  for (const section of techSections) {
    let _count = 0;
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${section}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          _count++;
          if (item.title) {
          }
          if (item.name) {
          }
          if (item.description) {
          }
        }
      } catch (_e) {}
    }
  }

  const settingKeys = [
    "navigationGlassmorphismSettings",
    "homepageFeaturedProductsSettings",
    "contactSettings",
    "generalSettings",
  ];

  for (const key of settingKeys) {
    try {
      const result = await db.get(`${key}:1`);
      if (result?.ok && result?.value) {
        const _setting = JSON.parse(result.value);
      }
    } catch (_e) {}
  }
}

extractAllAdminData().catch(console.error);
