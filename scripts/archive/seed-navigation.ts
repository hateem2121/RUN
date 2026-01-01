import { db } from "../server/db.js";
import { navigationItems } from "../shared/schema.js";

async function seedNavigation() {
  const items = [
    {
      label: "Home",
      url: "/",
      type: "link",
      position: 1,
      isActive: true,
      showOnDesktop: true,
      showOnMobile: true,
      iconType: "fallback",
      fallbackIcon: "Home",
    },
    {
      label: "Products",
      url: "/products",
      type: "link",
      position: 2,
      isActive: true,
      showOnDesktop: true,
      showOnMobile: true,
      iconType: "fallback",
      fallbackIcon: "ShoppingBag",
    },
    {
      label: "Categories",
      url: "/categories",
      type: "link",
      position: 3,
      isActive: true,
      showOnDesktop: true,
      showOnMobile: true,
      iconType: "fallback",
      fallbackIcon: "LayoutGrid",
    },
    {
      label: "Manufacturing",
      url: "/manufacturing",
      type: "link",
      position: 4,
      isActive: true,
      showOnDesktop: true,
      showOnMobile: true,
      iconType: "fallback",
      fallbackIcon: "Factory",
    },
    {
      label: "Sustainability",
      url: "/sustainability",
      type: "link",
      position: 5,
      isActive: true,
      showOnDesktop: true,
      showOnMobile: true,
      iconType: "fallback",
      fallbackIcon: "Leaf",
    },
    {
      label: "Technology",
      url: "/technology",
      type: "link",
      position: 6,
      isActive: true,
      showOnDesktop: true,
      showOnMobile: true,
      iconType: "fallback",
      fallbackIcon: "Cpu",
    },
    {
      label: "About",
      url: "/about",
      type: "link",
      position: 7,
      isActive: true,
      showOnDesktop: true,
      showOnMobile: true,
      iconType: "fallback",
      fallbackIcon: "Info",
    },
  ];

  try {
    // Clear existing items to avoid duplicates if re-run
    await db.delete(navigationItems);

    const _inserted = await db.insert(navigationItems).values(items).returning();
    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

seedNavigation();
