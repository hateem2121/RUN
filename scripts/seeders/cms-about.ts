/**
 * CMS ABOUT PAGE SEEDER
 * Seeds all about-page-related CMS tables
 */

import { eq } from "drizzle-orm";
import { db } from "../../server/db.js";
import {
	aboutHero,
	aboutMapLocations,
	aboutSections,
	aboutStatistics,
	aboutTeamMessages,
	aboutTimelineEntries,
	mediaAssets,
} from "../../shared/schema.js";
import { type SeedResult, seedWithTransaction } from "../utils/seed-helpers.js";

/**
 * Seed about hero section
 */
export async function seedAboutHero(): Promise<SeedResult> {
	return seedWithTransaction("aboutHero", async () => {
		const heroImages = await db
			.select()
			.from(mediaAssets)
			.where(eq(mediaAssets.filename, "hero-about.jpg"));
		const heroImageId = heroImages[0]?.id || null;

		const heroData = {
			title: "Our Story",
			subtitle: "Crafting Quality Sportswear Since 2010",
			description:
				"From a small workshop to a global B2B manufacturing powerhouse, our journey has been defined by innovation, quality, and unwavering commitment to our clients.",
			headline: "About RUN Apparel",
			subheadline: "Excellence in Every Stitch",
			imageId: heroImageId,
			backgroundMediaId: heroImageId,
			isActive: true,
		};

		return await db.insert(aboutHero).values(heroData).returning();
	});
}

/**
 * Seed about sections
 */
export async function seedAboutSections(): Promise<SeedResult> {
	return seedWithTransaction("aboutSections", async () => {
		const sectionsData = [
			{
				title: "Our Mission",
				content:
					"To empower brands worldwide with premium, sustainable sportswear through innovative manufacturing and exceptional service.",
				sectionType: "text",
				position: 1,
				isActive: true,
				sortOrder: 1,
			},
			{
				title: "Our Vision",
				content:
					"To be the global leader in B2B sportswear manufacturing, setting industry standards for quality, sustainability, and innovation.",
				sectionType: "text",
				position: 2,
				isActive: true,
				sortOrder: 2,
			},
			{
				title: "Our Values",
				content:
					"Quality First • Sustainable Practices • Innovation • Customer Partnership • Social Responsibility",
				sectionType: "list",
				position: 3,
				isActive: true,
				sortOrder: 3,
			},
			{
				title: "Why Choose Us",
				content:
					"15+ years of manufacturing excellence, 1000+ satisfied clients, ISO-certified facilities, and commitment to environmental sustainability.",
				sectionType: "features",
				position: 4,
				isActive: true,
				sortOrder: 4,
			},
			{
				title: "Our Expertise",
				content:
					"Specializing in athletic wear, team uniforms, corporate apparel, and custom sportswear with cutting-edge fabric technology.",
				sectionType: "expertise",
				position: 5,
				isActive: true,
				sortOrder: 5,
			},
			{
				title: "Global Reach",
				content:
					"Serving clients across 40+ countries with manufacturing facilities in Asia and distribution centers worldwide.",
				sectionType: "global",
				position: 6,
				isActive: true,
				sortOrder: 6,
			},
		];

		return await db.insert(aboutSections).values(sectionsData).returning();
	});
}

/**
 * Seed about statistics
 */
export async function seedAboutStatistics(): Promise<SeedResult> {
	return seedWithTransaction("aboutStatistics", async () => {
		const statsData = [
			{
				label: "Years of Excellence",
				value: "15+",
				unit: "years",
				description: "Manufacturing premium sportswear",
				icon: "Calendar",
				position: 1,
				isActive: true,
				sortOrder: 1,
			},
			{
				label: "Happy Clients",
				value: "1000+",
				unit: "clients",
				description: "Worldwide partnerships",
				icon: "Users",
				position: 2,
				isActive: true,
				sortOrder: 2,
			},
			{
				label: "Products Manufactured",
				value: "5M+",
				unit: "units",
				description: "Quality garments produced",
				icon: "Package",
				position: 3,
				isActive: true,
				sortOrder: 3,
			},
			{
				label: "Countries Served",
				value: "40+",
				unit: "countries",
				description: "Global distribution network",
				icon: "Globe",
				position: 4,
				isActive: true,
				sortOrder: 4,
			},
			{
				label: "Sustainability Score",
				value: "92%",
				unit: "rating",
				description: "Eco-friendly manufacturing",
				icon: "Leaf",
				position: 5,
				isActive: true,
				sortOrder: 5,
			},
			{
				label: "Production Capacity",
				value: "500K",
				unit: "units/month",
				description: "Monthly output capability",
				icon: "TrendingUp",
				position: 6,
				isActive: true,
				sortOrder: 6,
			},
			{
				label: "Quality Rating",
				value: "98%",
				unit: "satisfaction",
				description: "Client satisfaction rate",
				icon: "Award",
				position: 7,
				isActive: true,
				sortOrder: 7,
			},
			{
				label: "Team Size",
				value: "500+",
				unit: "employees",
				description: "Skilled professionals",
				icon: "Briefcase",
				position: 8,
				isActive: true,
				sortOrder: 8,
			},
		];

		return await db.insert(aboutStatistics).values(statsData).returning();
	});
}

/**
 * Seed about team messages
 */
export async function seedAboutTeamMessages(): Promise<SeedResult> {
	return seedWithTransaction("aboutTeamMessages", async () => {
		const allMedia = await db.select().from(mediaAssets);
		const teamImages = allMedia.filter((m) =>
			m.filename?.startsWith("team-member-"),
		);

		const teamData = [
			{
				name: "Sarah Johnson",
				position: "CEO & Founder",
				title: "Leading with Vision",
				message:
					"Our commitment to quality and sustainability drives everything we do. We believe in creating not just products, but partnerships that last.",
				signature: "Sarah Johnson",
				imageId: teamImages[0]?.id || null,
				isActive: true,
				sortOrder: 1,
			},
			{
				name: "Michael Chen",
				position: "Chief Technology Officer",
				title: "Innovation in Manufacturing",
				message:
					"Technology and tradition blend seamlessly in our facilities. We embrace innovation while respecting the craftsmanship that defines quality.",
				signature: "Michael Chen",
				imageId: teamImages[1]?.id || null,
				isActive: true,
				sortOrder: 2,
			},
			{
				name: "Elena Rodriguez",
				position: "Head of Manufacturing",
				title: "Excellence in Execution",
				message:
					"Every garment that leaves our facility meets the highest standards. Our team takes pride in delivering excellence with every order.",
				signature: "Elena Rodriguez",
				imageId: teamImages[2]?.id || null,
				isActive: true,
				sortOrder: 3,
			},
			{
				name: "David Park",
				position: "Sustainability Officer",
				title: "Green Manufacturing",
				message:
					"Sustainability isn't a buzzword for us—it's a responsibility. We're committed to reducing our environmental impact while maintaining quality.",
				signature: "David Park",
				imageId: teamImages[9]?.id || null,
				isActive: true,
				sortOrder: 4,
			},
		];

		return await db.insert(aboutTeamMessages).values(teamData).returning();
	});
}

/**
 * Seed about timeline entries
 */
export async function seedAboutTimelineEntries(): Promise<SeedResult> {
	return seedWithTransaction("aboutTimelineEntries", async () => {
		const timelineData = [
			{
				year: "2010",
				title: "Company Founded",
				description:
					"Started as a small workshop with a vision for quality sportswear manufacturing",
				position: 1,
				isActive: true,
				sortOrder: 1,
			},
			{
				year: "2012",
				title: "First International Client",
				description:
					"Expanded operations to serve clients beyond domestic markets",
				position: 2,
				isActive: true,
				sortOrder: 2,
			},
			{
				year: "2014",
				title: "ISO Certification",
				description:
					"Achieved ISO 9001 and ISO 14001 certifications for quality and environmental management",
				position: 3,
				isActive: true,
				sortOrder: 3,
			},
			{
				year: "2016",
				title: "Sustainability Initiative",
				description:
					"Launched comprehensive sustainability program with renewable energy and waste reduction",
				position: 4,
				isActive: true,
				sortOrder: 4,
			},
			{
				year: "2018",
				title: "Technology Upgrade",
				description:
					"Invested $5M in state-of-the-art manufacturing equipment and automation",
				position: 5,
				isActive: true,
				sortOrder: 5,
			},
			{
				year: "2020",
				title: "Global Expansion",
				description:
					"Opened new facilities and expanded to 40+ countries worldwide",
				position: 6,
				isActive: true,
				sortOrder: 6,
			},
			{
				year: "2021",
				title: "GOTS Certification",
				description:
					"Achieved Global Organic Textile Standard certification for sustainable practices",
				position: 7,
				isActive: true,
				sortOrder: 7,
			},
			{
				year: "2022",
				title: "Innovation Lab",
				description:
					"Established R&D facility for fabric technology and product development",
				position: 8,
				isActive: true,
				sortOrder: 8,
			},
			{
				year: "2023",
				title: "Carbon Neutral",
				description:
					"Achieved carbon neutral manufacturing through renewable energy and offset programs",
				position: 9,
				isActive: true,
				sortOrder: 9,
			},
			{
				year: "2024",
				title: "1000+ Clients",
				description:
					"Reached milestone of serving over 1000 satisfied clients globally",
				position: 10,
				isActive: true,
				sortOrder: 10,
			},
		];

		return await db
			.insert(aboutTimelineEntries)
			.values(timelineData)
			.returning();
	});
}

/**
 * Seed about map locations
 */
export async function seedAboutMapLocations(): Promise<SeedResult> {
	return seedWithTransaction("aboutMapLocations", async () => {
		const locationsData = [
			{
				name: "Headquarters - Los Angeles",
				latitude: "34.0522",
				longitude: "-118.2437",
				description: "Global headquarters and design center",
				address: "123 Fashion District, Los Angeles, CA 90015",
				locationType: "headquarters",
				type: "HQ",
				city: "Los Angeles",
				country: "United States",
				details: "Main office, design studio, and customer service center",
				isActive: true,
			},
			{
				name: "Manufacturing Facility - Vietnam",
				latitude: "10.8231",
				longitude: "106.6297",
				description: "Primary manufacturing and production facility",
				address: "Industrial Park, Ho Chi Minh City, Vietnam",
				locationType: "manufacturing",
				type: "Factory",
				city: "Ho Chi Minh City",
				country: "Vietnam",
				details: "Main production facility with 300+ employees",
				isActive: true,
			},
			{
				name: "Distribution Center - Netherlands",
				latitude: "52.3676",
				longitude: "4.9041",
				description: "European distribution and logistics hub",
				address: "Port of Amsterdam, Netherlands",
				locationType: "distribution",
				type: "Warehouse",
				city: "Amsterdam",
				country: "Netherlands",
				details: "EU distribution center serving European markets",
				isActive: true,
			},
			{
				name: "R&D Center - South Korea",
				latitude: "37.5665",
				longitude: "126.9780",
				description: "Research and development facility for fabric innovation",
				address: "Seoul Technology Park, South Korea",
				locationType: "research",
				type: "R&D",
				city: "Seoul",
				country: "South Korea",
				details: "Innovation lab for fabric technology and testing",
				isActive: true,
			},
			{
				name: "Sales Office - Dubai",
				latitude: "25.2048",
				longitude: "55.2708",
				description: "Middle East and Africa regional office",
				address: "Dubai Business Bay, UAE",
				locationType: "office",
				type: "Sales",
				city: "Dubai",
				country: "United Arab Emirates",
				details: "Regional sales and client services for MEA region",
				isActive: true,
			},
		];

		return await db.insert(aboutMapLocations).values(locationsData).returning();
	});
}

// Export all seeders
export const aboutSeeders = {
	seedAboutHero,
	seedAboutSections,
	seedAboutStatistics,
	seedAboutTeamMessages,
	seedAboutTimelineEntries,
	seedAboutMapLocations,
};
