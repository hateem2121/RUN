// @ts-nocheck
import { storage } from "../server/storage.js";

async function populateAllSampleData() {
  const createdItems = [];
  try {
    const products = await storage.getProducts();
    if (products.length === 0) {
      const sampleProducts = [
        {
          name: "Performance Running Jacket",
          sku: "PRJ-001",
          description:
            "Lightweight running jacket with reflective details and moisture-wicking technology",
          categoryId: 1,
          isActive: true,
          specifications: {
            fabric: "Polyester blend with DWR coating",
            weight: "145g",
            features: ["Reflective strips", "Zippered pockets", "Adjustable hood"],
            sizes: ["XS", "S", "M", "L", "XL", "XXL"],
          },
          metaTitle: "Performance Running Jacket | RUN APPAREL",
          metaDescription:
            "Professional running jacket with advanced moisture management and reflective safety features",
        },
        {
          name: "Moisture-Wicking Athletic Tee",
          sku: "MAT-002",
          description:
            "High-performance athletic t-shirt with seamless construction and quick-dry technology",
          categoryId: 1,
          isActive: true,
          specifications: {
            fabric: "Recycled polyester with bamboo fiber blend",
            weight: "120g",
            features: ["Quick-dry technology", "Seamless construction", "Anti-odor treatment"],
            sizes: ["XS", "S", "M", "L", "XL", "XXL"],
          },
          metaTitle: "Moisture-Wicking Athletic Tee | RUN APPAREL",
          metaDescription:
            "High-performance athletic t-shirt with sustainable materials and advanced moisture management",
        },
        {
          name: "Professional Team Polo",
          sku: "PTP-003",
          description:
            "Professional polo shirt suitable for team uniforms with customization options",
          categoryId: 1,
          isActive: true,
          specifications: {
            fabric: "Cotton-polyester blend with pique construction",
            weight: "180g",
            features: ["Reinforced collar", "Side vents", "Customizable logo placement"],
            sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
          },
          metaTitle: "Professional Team Polo | RUN APPAREL",
          metaDescription:
            "Professional polo shirt perfect for team uniforms with custom branding options",
        },
        {
          name: "Compression Training Shorts",
          sku: "CTS-004",
          description:
            "High-compression training shorts with ergonomic design and moisture management",
          categoryId: 1,
          isActive: true,
          specifications: {
            fabric: "Spandex-nylon blend with compression technology",
            weight: "95g",
            features: ["Compression fit", "Flatlock seams", "Moisture-wicking waistband"],
            sizes: ["XS", "S", "M", "L", "XL", "XXL"],
          },
          metaTitle: "Compression Training Shorts | RUN APPAREL",
          metaDescription:
            "High-performance compression shorts with advanced fit technology and moisture management",
        },
        {
          name: "Sustainable Yoga Leggings",
          sku: "SYL-005",
          description:
            "Eco-friendly yoga leggings made from recycled materials with four-way stretch",
          categoryId: 1,
          isActive: true,
          specifications: {
            fabric: "Recycled polyester with TENCEL™ Lyocell blend",
            weight: "210g",
            features: ["Four-way stretch", "High waistband", "Gusseted crotch", "Eco-friendly"],
            sizes: ["XS", "S", "M", "L", "XL", "XXL"],
          },
          metaTitle: "Sustainable Yoga Leggings | RUN APPAREL",
          metaDescription:
            "Eco-friendly yoga leggings made from recycled materials with superior stretch and comfort",
        },
      ];

      for (const product of sampleProducts) {
        const created = await storage.createProduct(product);
        createdItems.push(`Products: ${created.name}`);
      }
    }
  } catch (error) {}
  try {
    const fabrics = await storage.getFabrics();
    if (fabrics.length === 0) {
      const sampleFabrics = [
        {
          name: "DriFit Pro Performance",
          description: "Advanced moisture-wicking fabric with quick-dry technology",
          composition: [
            { fiberId: 1, percentage: 85 }, // Polyester
            { fiberId: 4, percentage: 15 }, // Spandex
          ],
          weight: 145,
          construction: "Knitted",
          finish: "Moisture-wicking with anti-microbial treatment",
          isActive: true,
          keyApplications: ["Athletic wear", "Training apparel", "Running gear"],
          performanceFeatures: ["Quick-dry", "Moisture-wicking", "Anti-odor", "UV protection"],
          careInstructions: "Machine wash cold, tumble dry low, no fabric softener",
        },
        {
          name: "EcoBlend Sustainable",
          description: "Environmentally conscious fabric blend with recycled content",
          composition: [
            { fiberId: 2, percentage: 70 }, // Recycled Polyester
            { fiberId: 8, percentage: 30 }, // TENCEL™ Lyocell
          ],
          weight: 160,
          construction: "Jersey knit",
          finish: "Soft hand feel with natural drape",
          isActive: true,
          keyApplications: ["Casual wear", "Yoga apparel", "Lifestyle clothing"],
          performanceFeatures: ["Sustainable", "Soft hand", "Breathable", "Biodegradable fibers"],
          careInstructions: "Machine wash cold, hang dry recommended",
        },
        {
          name: "Technical Compression",
          description: "High-performance compression fabric for athletic applications",
          composition: [
            { fiberId: 3, percentage: 72 }, // Nylon
            { fiberId: 4, percentage: 28 }, // Spandex
          ],
          weight: 220,
          construction: "Circular knit",
          finish: "Compression with moisture management",
          isActive: true,
          keyApplications: ["Compression wear", "Athletic tights", "Sports bras"],
          performanceFeatures: [
            "High compression",
            "Four-way stretch",
            "Shape retention",
            "Moisture-wicking",
          ],
          careInstructions: "Machine wash cold, lay flat to dry",
        },
        {
          name: "Natural Performance Cotton",
          description: "Premium cotton blend for comfortable everyday wear",
          composition: [
            { fiberId: 5, percentage: 80 }, // Cotton
            { fiberId: 1, percentage: 20 }, // Polyester
          ],
          weight: 180,
          construction: "Pique knit",
          finish: "Pre-shrunk with soil release",
          isActive: true,
          keyApplications: ["Polo shirts", "Team uniforms", "Casual wear"],
          performanceFeatures: ["Breathable", "Comfortable", "Durable", "Easy care"],
          careInstructions: "Machine wash warm, tumble dry medium",
        },
      ];

      for (const fabric of sampleFabrics) {
        const created = await storage.createFabric(fabric);
        createdItems.push(`Fabrics: ${created.name}`);
      }
    }
  } catch (error) {}
  try {
    const navItems = await storage.getNavigationItems();
    if (navItems.length === 0) {
      const sampleNavItems = [
        {
          name: "Home",
          path: "/",
          isActive: true,
          order: 1,
        },
        {
          name: "Products",
          path: "/products",
          isActive: true,
          order: 2,
        },
        {
          name: "Categories",
          path: "/categories",
          isActive: true,
          order: 3,
        },
        {
          name: "About",
          path: "/about",
          isActive: true,
          order: 4,
        },
        {
          name: "Manufacturing",
          path: "/manufacturing",
          isActive: true,
          order: 5,
        },
        {
          name: "Sustainability",
          path: "/sustainability",
          isActive: true,
          order: 6,
        },
        {
          name: "Contact",
          path: "/contact",
          isActive: true,
          order: 7,
        },
      ];

      for (const item of sampleNavItems) {
        const created = await storage.createNavigationItem(item);
        createdItems.push(`Navigation: ${created.name}`);
      }
    }
  } catch (error) {}
  try {
    const footerSections = await storage.getFooterSections();
    if (footerSections.length === 0) {
      const sampleFooterSections = [
        {
          name: "Products",
          order: 1,
          isActive: true,
        },
        {
          name: "Company",
          order: 2,
          isActive: true,
        },
        {
          name: "Support",
          order: 3,
          isActive: true,
        },
        {
          name: "Legal",
          order: 4,
          isActive: true,
        },
      ];

      for (const section of sampleFooterSections) {
        const created = await storage.createFooterSection(section);
        createdItems.push(`Footer Section: ${created.name}`);
      }

      // Create footer links for each section
      const footerLinks = [
        // Products section (sectionId: 1)
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
          name: "Compression Wear",
          path: "/products/compression-wear",
          sectionId: 1,
          order: 3,
          isActive: true,
        },
        {
          name: "Sustainable Line",
          path: "/products/sustainable",
          sectionId: 1,
          order: 4,
          isActive: true,
        },

        // Company section (sectionId: 2)
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
          name: "Sustainability",
          path: "/sustainability",
          sectionId: 2,
          order: 3,
          isActive: true,
        },
        {
          name: "Careers",
          path: "/careers",
          sectionId: 2,
          order: 4,
          isActive: true,
        },

        // Support section (sectionId: 3)
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
        {
          name: "Custom Orders",
          path: "/custom-orders",
          sectionId: 3,
          order: 3,
          isActive: true,
        },
        { name: "FAQ", path: "/faq", sectionId: 3, order: 4, isActive: true },

        // Legal section (sectionId: 4)
        {
          name: "Privacy Policy",
          path: "/privacy",
          sectionId: 4,
          order: 1,
          isActive: true,
        },
        {
          name: "Terms of Service",
          path: "/terms",
          sectionId: 4,
          order: 2,
          isActive: true,
        },
        {
          name: "Quality Standards",
          path: "/quality",
          sectionId: 4,
          order: 3,
          isActive: true,
        },
        {
          name: "Certifications",
          path: "/certifications",
          sectionId: 4,
          order: 4,
          isActive: true,
        },
      ];

      for (const link of footerLinks) {
        const created = await storage.createFooterLink(link);
        createdItems.push(`Footer Link: ${created.name}`);
      }
    }
  } catch (error) {}
  try {
    // Homepage Hero
    const hero = await storage.getHomepageHero();
    if (!hero || Object.keys(hero).length === 0) {
      const heroData = {
        title: "Premium B2B Sportswear Manufacturing",
        subtitle: "Quality athletic apparel for teams, brands, and organizations worldwide",
        description:
          "Partner with RUN APPAREL for premium sportswear manufacturing. We specialize in high-performance athletic wear, team uniforms, and sustainable activewear with cutting-edge materials and technologies.",
        isActive: true,
      };

      const createdHero = await storage.createHomepageHero(heroData);
      createdItems.push(`Homepage Hero: ${createdHero.title}`);
    }

    // Homepage Slogans
    const slogans = await storage.getHomepageSlogans();
    if (slogans.length === 0) {
      const sampleSlogans = [
        {
          text: "Performance Engineered",
          description:
            "Advanced materials and construction techniques for superior athletic performance",
          order: 1,
          isActive: true,
        },
        {
          text: "Sustainably Crafted",
          description:
            "Eco-friendly manufacturing processes with recycled and sustainable materials",
          order: 2,
          isActive: true,
        },
        {
          text: "Globally Delivered",
          description:
            "Worldwide shipping and distribution for teams and organizations of all sizes",
          order: 3,
          isActive: true,
        },
      ];

      for (const slogan of sampleSlogans) {
        const created = await storage.createHomepageSlogan(slogan);
        createdItems.push(`Homepage Slogan: ${created.text}`);
      }
    }

    // Homepage Process Cards
    const processCards = await storage.getHomepageProcessCards();
    if (processCards.length === 0) {
      const sampleProcessCards = [
        {
          title: "Design & Development",
          description:
            "Our expert design team works with you to create custom sportswear that meets your specific requirements and brand standards.",
          order: 1,
          isActive: true,
        },
        {
          title: "Material Selection",
          description:
            "Choose from our extensive library of high-performance fabrics, sustainable materials, and cutting-edge fiber technologies.",
          order: 2,
          isActive: true,
        },
        {
          title: "Precision Manufacturing",
          description:
            "State-of-the-art production facilities ensure consistent quality and precision in every garment we manufacture.",
          order: 3,
          isActive: true,
        },
        {
          title: "Quality Assurance",
          description:
            "Rigorous testing and quality control processes guarantee that every product meets our high standards and your expectations.",
          order: 4,
          isActive: true,
        },
      ];

      for (const card of sampleProcessCards) {
        const created = await storage.createHomepageProcessCard(card);
        createdItems.push(`Process Card: ${created.title}`);
      }
    }

    // Homepage Sections
    const sections = await storage.getHomepageSections();
    if (sections.length === 0) {
      const sampleSections = [
        {
          title: "Advanced Manufacturing Capabilities",
          content:
            "Our state-of-the-art facilities utilize the latest technology in textile manufacturing, ensuring precision, quality, and efficiency in every product we create.",
          order: 1,
          isActive: true,
        },
        {
          title: "Sustainable Production Practices",
          content:
            "We are committed to environmental responsibility through sustainable manufacturing processes, eco-friendly materials, and waste reduction initiatives.",
          order: 2,
          isActive: true,
        },
        {
          title: "Custom Solutions for Every Need",
          content:
            "From small team orders to large corporate contracts, we provide flexible manufacturing solutions tailored to your specific requirements and timelines.",
          order: 3,
          isActive: true,
        },
      ];

      for (const section of sampleSections) {
        const created = await storage.createHomepageSection(section);
        createdItems.push(`Homepage Section: ${created.title}`);
      }
    }
  } catch (error) {}
  createdItems.forEach((item) => {});
  const entities = [
    { name: "Products", method: "getProducts" },
    { name: "Fabrics", method: "getFabrics" },
    { name: "Navigation Items", method: "getNavigationItems" },
    { name: "Footer Sections", method: "getFooterSections" },
    { name: "Footer Links", method: "getFooterLinks" },
    { name: "Homepage Slogans", method: "getHomepageSlogans" },
    { name: "Homepage Process Cards", method: "getHomepageProcessCards" },
    { name: "Homepage Sections", method: "getHomepageSections" },
  ];

  for (const entity of entities) {
    try {
      const data = await (storage as any)[entity.method]();
    } catch (error) {}
  }

  // Test hero and sustainability (single objects)
  try {
    const hero = await storage.getHomepageHero();
  } catch (error) {}
}

// Run the population
populateAllSampleData().catch(console.error);
