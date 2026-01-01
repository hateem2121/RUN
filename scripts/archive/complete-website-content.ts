// @ts-nocheck
import { storage } from "../server/storage.js";

async function completeWebsiteContent() {
  const createdItems = [];

  // Complete Footer Content
  try {
    const footerSections = await storage.getFooterSections();
    if (footerSections.length === 0) {
      const sections = [
        { name: "Products", order: 1, isActive: true },
        { name: "Company", order: 2, isActive: true },
        { name: "Support", order: 3, isActive: true },
      ];

      for (const section of sections) {
        const created = await storage.createFooterSection(section);
        createdItems.push(`Footer Section: ${created.name}`);
      }

      // Create footer links
      const footerLinks = [
        {
          name: "Athletic Wear",
          path: "/products/athletic-wear",
          sectionId: 1,
          order: 1,
          isActive: true,
        },
        {
          name: "Team Uniforms",
          path: "/products/team-uniforms",
          sectionId: 1,
          order: 2,
          isActive: true,
        },
        {
          name: "About Us",
          path: "/about",
          sectionId: 2,
          order: 1,
          isActive: true,
        },
        {
          name: "Manufacturing",
          path: "/manufacturing",
          sectionId: 2,
          order: 2,
          isActive: true,
        },
        {
          name: "Contact Us",
          path: "/contact",
          sectionId: 3,
          order: 1,
          isActive: true,
        },
        {
          name: "Size Guide",
          path: "/size-guide",
          sectionId: 3,
          order: 2,
          isActive: true,
        },
      ];

      for (const link of footerLinks) {
        const created = await storage.createFooterLink(link);
        createdItems.push(`Footer Link: ${created.name}`);
      }
    }
  } catch (_error) {}

  // Complete Homepage Content
  try {
    const hero = await storage.getHomepageHero();
    if (!hero || Object.keys(hero).length === 0) {
      const heroData = {
        title: "Premium B2B Sportswear Manufacturing",
        subtitle: "Quality athletic apparel for teams and organizations worldwide",
        description:
          "Partner with RUN APPAREL for premium sportswear manufacturing with cutting-edge materials and technologies.",
        isActive: true,
      };

      const createdHero = await storage.createHomepageHero(heroData);
      createdItems.push(`Homepage Hero: ${createdHero.title}`);
    }

    const slogans = await storage.getHomepageSlogans();
    if (slogans.length === 0) {
      const sampleSlogans = [
        {
          text: "Performance Engineered",
          description: "Advanced materials for superior athletic performance",
          order: 1,
          isActive: true,
        },
        {
          text: "Sustainably Crafted",
          description: "Eco-friendly manufacturing with recycled materials",
          order: 2,
          isActive: true,
        },
        {
          text: "Globally Delivered",
          description: "Worldwide shipping for organizations of all sizes",
          order: 3,
          isActive: true,
        },
      ];

      for (const slogan of sampleSlogans) {
        const created = await storage.createHomepageSlogan(slogan);
        createdItems.push(`Homepage Slogan: ${created.text}`);
      }
    }

    const processCards = await storage.getHomepageProcessCards();
    if (processCards.length === 0) {
      const cards = [
        {
          title: "Design & Development",
          description: "Custom sportswear design that meets your specific requirements",
          order: 1,
          isActive: true,
        },
        {
          title: "Material Selection",
          description: "Choose from extensive library of high-performance fabrics",
          order: 2,
          isActive: true,
        },
        {
          title: "Precision Manufacturing",
          description: "State-of-the-art facilities ensure consistent quality",
          order: 3,
          isActive: true,
        },
      ];

      for (const card of cards) {
        const created = await storage.createHomepageProcessCard(card);
        createdItems.push(`Process Card: ${created.title}`);
      }
    }

    const sections = await storage.getHomepageSections();
    if (sections.length === 0) {
      const sampleSections = [
        {
          title: "Advanced Manufacturing",
          content: "State-of-the-art facilities utilize the latest technology",
          order: 1,
          isActive: true,
        },
        {
          title: "Sustainable Practices",
          content: "Committed to environmental responsibility and eco-friendly materials",
          order: 2,
          isActive: true,
        },
      ];

      for (const section of sampleSections) {
        const created = await storage.createHomepageSection(section);
        createdItems.push(`Homepage Section: ${created.title}`);
      }
    }
  } catch (_error) {}
  createdItems.forEach((_item) => {});
}

// Run the completion
completeWebsiteContent().catch(console.error);
