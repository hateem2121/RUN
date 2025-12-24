export const GOLDEN_ROUTES = [
	{ path: "/", name: "homepage", waitForSelector: "main" },
	{ path: "/products", name: "products-index", waitForSelector: "main" },
	{ path: "/categories", name: "categories-index", waitForSelector: "main" },
	{ path: "/about", name: "about-page", waitForSelector: "main" },
	{ path: "/contact", name: "contact-page", waitForSelector: "form" },
	{ path: "/services", name: "services-page", waitForSelector: "main" },
	{ path: "/technology", name: "technology-page", waitForSelector: "main" },
	{
		path: "/sustainability",
		name: "sustainability-page",
		waitForSelector: "main",
	},
	{
		path: "/manufacturing",
		name: "manufacturing-page",
		waitForSelector: "main",
	},
	{ path: "/resources", name: "resources-index", waitForSelector: "main" },
];
