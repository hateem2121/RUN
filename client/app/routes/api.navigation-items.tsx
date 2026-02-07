// Mock navigation data matching the shared schema
const MOCK_NAVIGATION_ITEMS = [
  {
    id: 1,
    label: "Home",
    title: "Home",
    url: "/",
    href: "/",
    iconType: "fallback",
    fallbackIcon: "IconHome",
    showOnDesktop: true,
    showOnMobile: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 2,
    label: "Products",
    title: "Products",
    url: "/products",
    href: "/products",
    iconType: "fallback",
    fallbackIcon: "IconShoppingBag",
    showOnDesktop: true,
    showOnMobile: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 3,
    label: "Technology",
    title: "Technology",
    url: "/technology",
    href: "/technology",
    iconType: "fallback",
    fallbackIcon: "IconCpu",
    showOnDesktop: true,
    showOnMobile: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 4,
    label: "Contact",
    title: "Contact",
    url: "/contact",
    href: "/contact",
    iconType: "fallback",
    fallbackIcon: "IconMail",
    showOnDesktop: true,
    showOnMobile: true,
    isActive: true,
    sortOrder: 4,
  },
];

export async function loader() {
  return MOCK_NAVIGATION_ITEMS;
}
