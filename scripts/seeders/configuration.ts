/**
 * CONFIGURATION SEEDER
 * Seeds navigation, footer, contact, and UI configuration tables
 */

import { db } from "../../server/db.js";
import {
	contactPageConfigurations,
	footerConfiguration,
	logoAnimationSettings,
	navigationGlassmorphismSettings,
	navigationItems,
} from "../../shared/schema.js";
import { type SeedResult, seedWithTransaction } from "../utils/seed-helpers.js";
// import { sql } from 'drizzle-orm';

/**
 * Seed navigation items
 */
export async function seedNavigationItems(): Promise<SeedResult> {
	return seedWithTransaction("navigationItems", async () => {
		const navData = [
			{
				label: "Home",
				name: "Home",
				url: "/",
				href: "/",
				path: "/",
				iconName: "IconHome",
				fallbackIcon: "IconHome",
				parentId: null,
				level: 0,
				showOnDesktop: true,
				showOnMobile: true,
				isExternal: false,
				isActive: true,
				sortOrder: 1,
			},
			{
				label: "Products",
				name: "Products",
				url: "/products",
				href: "/products",
				path: "/products",
				iconName: "IconPackage",
				fallbackIcon: "IconPackage",
				parentId: null,
				level: 0,
				showOnDesktop: true,
				showOnMobile: true,
				isExternal: false,
				isActive: true,
				sortOrder: 2,
			},
			{
				label: "About",
				name: "About",
				url: "/about",
				href: "/about",
				path: "/about",
				iconName: "IconInfoCircle",
				fallbackIcon: "IconInfoCircle",
				parentId: null,
				level: 0,
				showOnDesktop: true,
				showOnMobile: true,
				isExternal: false,
				isActive: true,
				sortOrder: 3,
			},
			{
				label: "Manufacturing",
				name: "Manufacturing",
				url: "/manufacturing",
				href: "/manufacturing",
				path: "/manufacturing",
				iconName: "IconBuildingFactory",
				fallbackIcon: "IconBuildingFactory",
				parentId: null,
				level: 0,
				showOnDesktop: true,
				showOnMobile: true,
				isExternal: false,
				isActive: true,
				sortOrder: 4,
			},
			{
				label: "Sustainability",
				name: "Sustainability",
				url: "/sustainability",
				href: "/sustainability",
				path: "/sustainability",
				iconName: "IconLeaf",
				fallbackIcon: "IconLeaf",
				parentId: null,
				level: 0,
				showOnDesktop: true,
				showOnMobile: true,
				isExternal: false,
				isActive: true,
				sortOrder: 5,
			},
			{
				label: "Technology",
				name: "Technology",
				url: "/technology",
				href: "/technology",
				path: "/technology",
				iconName: "IconCpu",
				fallbackIcon: "IconCpu",
				parentId: null,
				level: 0,
				showOnDesktop: true,
				showOnMobile: true,
				isExternal: false,
				isActive: true,
				sortOrder: 6,
			},
			{
				label: "Contact",
				name: "Contact",
				url: "/contact",
				href: "/contact",
				path: "/contact",
				iconName: "IconMail",
				fallbackIcon: "IconMail",
				parentId: null,
				level: 0,
				showOnDesktop: true,
				showOnMobile: true,
				isExternal: false,
				isActive: true,
				sortOrder: 7,
			},
		];

		return await db.insert(navigationItems).values(navData).returning();
	});
}

/**
 * Seed footer configuration
 */
export async function seedFooterConfiguration(): Promise<SeedResult> {
	return seedWithTransaction("footerConfiguration", async () => {
		const footerData = {
			contactFormHeading: "GET IN TOUCH WITH RUN APPAREL",
			contactFormEnabled: true,
			navigationColumns: [
				{
					title: "Products",
					links: [
						{ label: "Athletic Wear", href: "/products?category=athletic" },
						{ label: "Team Uniforms", href: "/products?category=uniforms" },
						{
							label: "Corporate Apparel",
							href: "/products?category=corporate",
						},
						{ label: "Custom Design", href: "/products?category=custom" },
					],
				},
				{
					title: "Solutions",
					links: [
						{ label: "Manufacturing", href: "/manufacturing" },
						{ label: "Sustainability", href: "/sustainability" },
						{ label: "Technology", href: "/technology" },
						{ label: "Quality Control", href: "/about#quality" },
					],
				},
				{
					title: "Resources",
					links: [
						{ label: "About Us", href: "/about" },
						{ label: "Process", href: "/manufacturing#process" },
						{ label: "Certifications", href: "/sustainability#certifications" },
						{ label: "Contact", href: "/contact" },
					],
				},
			],
			socialLinks: [
				{
					name: "LinkedIn",
					icon: "IconBrandLinkedin",
					href: "https://linkedin.com/company/run-apparel",
					hoverColor: "#0A66C2",
				},
				{
					name: "Facebook",
					icon: "IconBrandFacebook",
					href: "https://facebook.com/runapparel",
					hoverColor: "#1877F2",
				},
				{
					name: "Instagram",
					icon: "IconBrandInstagram",
					href: "https://instagram.com/runapparel",
					hoverColor: "#E4405F",
				},
			],
			certificateIds: [],
			legalLinks: [
				{ label: "Privacy Policy", href: "/privacy" },
				{ label: "Terms of Service", href: "/terms" },
				{ label: "Cookie Policy", href: "/cookies" },
			],
			companyName: "RUN APPAREL (PVT) LTD",
			companyAddress: "13km Daska Road, Sialkot 51040, Pakistan",
			companyPhone: "+92 336 1777313",
			companyEmail: "team@run-apparel.com",
			copyrightText: "© 2024 RUN APPAREL. All rights reserved.",
			isActive: true,
		};

		return await db.insert(footerConfiguration).values(footerData).returning();
	});
}

/**
 * Seed contact page configuration
 */
export async function seedContactPageConfiguration(): Promise<SeedResult> {
	return seedWithTransaction("contactPageConfigurations", async () => {
		const contactData = {
			title: "Contact Us",
			heroTitle: "Get In Touch",
			description:
				"Have questions about our products or services? Our team is here to help.",
			address: "13km Daska Road, Sialkot 51040, Pakistan",
			phone: "+92 336 1777313",
			email: "team@run-apparel.com",
			workingHours:
				"Monday - Friday: 9:00 AM - 6:00 PM PKT\\nSaturday: 9:00 AM - 2:00 PM PKT",
			mapCoordinates: { lat: 32.4945, lng: 74.5229 },
			socialLinks: {
				linkedin: "https://linkedin.com/company/run-apparel",
				facebook: "https://facebook.com/runapparel",
				instagram: "https://instagram.com/runapparel",
			},
			locationLine1: "13km Daska Road",
			locationLine2: "Sialkot 51040, Pakistan",
			locationButtonText: "GET DIRECTIONS",
			tradingHours: [
				{ label: "Monday - Friday", value: "9:00 AM - 6:00 PM" },
				{ label: "Saturday", value: "9:00 AM - 2:00 PM" },
				{ label: "Sunday", value: "Closed" },
			],
			platformOptions: [
				"Phone Call",
				"WhatsApp",
				"WeChat",
				"Telegram",
				"Email",
				"Other",
			],
			formButtonText: "Get a Response Within 24 Hours",
			formPrivacyText:
				"We value your privacy and will never share your information.",
			successHeading: "Thank you!",
			successMessage:
				"Your message has been received. We'll get back to you within 24 hours.",
			isActive: true,
		};

		return await db
			.insert(contactPageConfigurations)
			.values(contactData)
			.returning();
	});
}

/**
 * Seed logo animation settings
 */
export async function seedLogoAnimationSettings(): Promise<SeedResult> {
	return seedWithTransaction("logoAnimationSettings", async () => {
		const logoData = {
			animationType: "fade-in",
			duration: 1000,
			delay: 200,
			easing: "ease-out",
			isActive: true,
		};

		return await db
			.insert(logoAnimationSettings)
			.values([{ ...logoData, name: "default" }])
			.returning();
	});
}

/**
 * Seed navigation glassmorphism settings
 */
export async function seedNavigationGlassmorphismSettings(): Promise<SeedResult> {
	return seedWithTransaction("navigationGlassmorphismSettings", async () => {
		const glassData = {
			blurAmount: 10,
			opacity: "0.8",
			backgroundColor: "rgba(255, 255, 255, 0.1)",
			borderColor: "rgba(255, 255, 255, 0.2)",
			isActive: true,
		};

		return await db
			.insert(navigationGlassmorphismSettings)
			.values([glassData])
			.returning();
	});
}

// Export all seeders
export const configurationSeeders = {
	seedNavigationItems,
	seedFooterConfiguration,
	seedContactPageConfiguration,
	seedLogoAnimationSettings,
	seedNavigationGlassmorphismSettings,
};
