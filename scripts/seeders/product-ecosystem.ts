/**
 * PRODUCT ECOSYSTEM SEEDER
 * Seeds categories, products, fabrics, fibers, and their relationships
 */

import { db } from '../../server/db.js';
import {
    accessories, 
    categories,
    certificates,
    fabricCompositions,
    fabrics,
    fibers,
    products,
    sizeCharts
} from '../../shared/schema.js';
import { type SeedResult, seedWithTransaction } from '../utils/seed-helpers.js';

/**
 * Seed product categories
 */
export async function seedCategories(): Promise<SeedResult> {
    return seedWithTransaction('categories', async () => {
        const categoryData = [
            {
                name: 'Athletic Wear',
                slug: 'athletic-wear',
                description: 'High-performance athletic and sportswear',
                isActive: true,
                featuredOnHomepage: true,
                sortOrder: 1
            },
            {
                name: 'Team Uniforms',
                slug: 'team-uniforms',
                description: 'Custom team uniforms for sports and organizations',
                isActive: true,
                featuredOnHomepage: true,
                sortOrder: 2
            },
            {
                name: 'Corporate Apparel',
                slug: 'corporate-apparel',
                description: 'Professional corporate and workwear',
                isActive: true,
                featuredOnHomepage: true,
                sortOrder: 3
            },
            {
                name: 'Custom Design',
                slug: 'custom-design',
                description: 'Fully customizable apparel solutions',
                isActive: true,
                featuredOnHomepage: false,
                sortOrder: 4
            }
        ];

        return await db.insert(categories).values(categoryData).returning();
    });
}

/**
 * Seed fibers (base materials)
 */
export async function seedFibers(): Promise<SeedResult> {
    return seedWithTransaction('fibers', async () => {
        const fiberData = [
            {
                name: 'Organic Cotton',
                type: 'natural',
                description: 'GOTS certified organic cotton fiber',
                sustainabilityScore: 95,
                properties: { breathable: true, soft: true, durable: true },
                isActive: true
            },
            {
                name: 'Recycled Polyester',
                type: 'synthetic',
                description: 'Polyester made from recycled plastic bottles',
                sustainabilityScore: 85,
                properties: { durable: true, quick_dry: true, wrinkle_resistant: true },
                isActive: true
            },
            {
                name: 'Bamboo',
                type: 'natural',
                description: 'Sustainable bamboo fiber',
                sustainabilityScore: 90,
                properties: { antibacterial: true, soft: true, breathable: true },
                isActive: true
            },
            {
                name: 'Merino Wool',
                type: 'natural',
                description: 'Premium merino wool fiber',
                sustainabilityScore: 80,
                properties: { warm: true, breathable: true, odor_resistant: true },
                isActive: true
            },
            {
                name: 'Elastane',
                type: 'synthetic',
                description: 'Stretch fiber for flexibility',
                sustainabilityScore: 60,
                properties: { stretch: true, recovery: true },
                isActive: true
            }
        ];

        return await db.insert(fibers).values(fiberData).returning();
    });
}

/**
 * Seed fabrics
 */
export async function seedFabrics(): Promise<SeedResult> {
    return seedWithTransaction('fabrics', async () => {
        const fabricData = [
            {
                name: 'Performance Mesh',
                description: 'Lightweight breathable mesh fabric',
                weight: '120',
                weightUnit: 'gsm',
                sustainabilityScore: 85,
                careInstructions: 'Machine wash cold, tumble dry low',
                isActive: true
            },
            {
                name: 'Eco-Blend Jersey',
                description: 'Organic cotton and recycled polyester blend',
                weight: '180',
                weightUnit: 'gsm',
                sustainabilityScore: 92,
                careInstructions: 'Machine wash cold, hang dry',
                isActive: true
            },
            {
                name: 'Technical Stretch',
                description: 'High-performance 4-way stretch fabric',
                weight: '220',
                weightUnit: 'gsm',
                sustainabilityScore: 75,
                careInstructions: 'Machine wash warm, tumble dry low',
                isActive: true
            },
            {
                name: 'Moisture-Wicking Pro',
                description: 'Advanced moisture management fabric',
                weight: '150',
                weightUnit: 'gsm',
                sustainabilityScore: 80,
                careInstructions: 'Machine wash cold, line dry',
                isActive: true
            }
        ];

        return await db.insert(fabrics).values(fabricData).returning();
    });
}

/**
 * Seed fabric compositions
 */
export async function seedFabricCompositions(): Promise<SeedResult> {
    return seedWithTransaction('fabricCompositions', async () => {
        // Get existing fabrics and fibers
        const allFabrics = await db.select().from(fabrics);
        const allFibers = await db.select().from(fibers);

        if (allFabrics.length === 0 || allFibers.length === 0) {
            return [];
        }

        const cotton = allFibers.find(f => f.name === 'Organic Cotton');
        const polyester = allFibers.find(f => f.name === 'Recycled Polyester');
        const elastane = allFibers.find(f => f.name === 'Elastane');

        const ecoBlend = allFabrics.find(f => f.name === 'Eco-Blend Jersey');
        const techStretch = allFabrics.find(f => f.name === 'Technical Stretch');

        const compositions = [];

        if (ecoBlend && cotton && polyester) {
            compositions.push(
                { fabricId: ecoBlend.id, fiberId: cotton.id, percentage: '60' },
                { fabricId: ecoBlend.id, fiberId: polyester.id, percentage: '40' }
            );
        }

        if (techStretch && polyester && elastane) {
            compositions.push(
                { fabricId: techStretch.id, fiberId: polyester.id, percentage: '88' },
                { fabricId: techStretch.id, fiberId: elastane.id, percentage: '12' }
            );
        }

        const perfMesh = allFabrics.find(f => f.name === 'Performance Mesh');
        const moistWick = allFabrics.find(f => f.name === 'Moisture-Wicking Pro');
        const bamboo = allFibers.find(f => f.name === 'Bamboo');

        if (perfMesh && polyester) {
            compositions.push(
                { fabricId: perfMesh.id, fiberId: polyester.id, percentage: '100' }
            );
        }

        if (moistWick && polyester && bamboo) {
            compositions.push(
                { fabricId: moistWick.id, fiberId: polyester.id, percentage: '70' },
                { fabricId: moistWick.id, fiberId: bamboo.id, percentage: '30' }
            );
        }

        if (compositions.length > 0) {
            return await db.insert(fabricCompositions).values(compositions).returning();
        }

        return [];
    });
}

/**
 * Seed products
 */
export async function seedProducts(): Promise<SeedResult> {
    return seedWithTransaction('products', async () => {
        const allCategories = await db.select().from(categories);
        const allFabrics = await db.select().from(fabrics);

        const athleticCategory = allCategories.find(c => c.slug === 'athletic-wear');
        const uniformsCategory = allCategories.find(c => c.slug === 'team-uniforms');
        const corporateCategory = allCategories.find(c => c.slug === 'corporate-apparel');

        const performanceFabric = allFabrics.find(f => f.name === 'Performance Mesh');
        const ecoFabric = allFabrics.find(f => f.name === 'Eco-Blend Jersey');

        const productData = [
            {
                name: 'Pro Performance T-Shirt',
                slug: 'pro-performance-tshirt',
                sku: 'PPT-001',
                description: 'Professional grade performance t-shirt with moisture-wicking technology',
                shortDescription: 'High-performance athletic t-shirt',
                categoryId: athleticCategory?.id || 1,
                primaryFabricId: performanceFabric?.id || null,
                basePrice: '12.99',
                minOrderQuantity: 50,
                isActive: true,
                isFeatured: true,
                tags: ['athletic', 'performance', 'moisture-wicking'],
                features: ['Moisture-wicking', 'Quick-dry', 'Breathable', 'Anti-odor'],
                sortOrder: 1
            },
            {
                name: 'Eco-Friendly Team Jersey',
                slug: 'eco-friendly-team-jersey',
                sku: 'ETJ-001',
                description: 'Sustainable team jersey made from organic cotton and recycled polyester',
                shortDescription: 'Eco-friendly team uniform jersey',
                categoryId: uniformsCategory?.id || 1,
                primaryFabricId: ecoFabric?.id || null,
                basePrice: '18.99',
                minOrderQuantity: 25,
                isActive: true,
                isFeatured: true,
                tags: ['sustainable', 'team', 'eco-friendly'],
                features: ['Sustainable materials', 'Customizable', 'Durable', 'Comfortable'],
                sortOrder: 2
            },
            {
                name: 'Corporate Polo Shirt',
                slug: 'corporate-polo-shirt',
                sku: 'CPS-001',
                description: 'Professional polo shirt perfect for corporate branding',
                shortDescription: 'Classic corporate polo',
                categoryId: corporateCategory?.id || 1,
                primaryFabricId: ecoFabric?.id || null,
                basePrice: '15.99',
                minOrderQuantity: 100,
                isActive: true,
                isFeatured: false,
                tags: ['corporate', 'professional', 'polo'],
                features: ['Professional look', 'Logo-ready', 'Wrinkle-resistant', 'Easy care'],
                sortOrder: 3
            },
            {
                name: 'Athletic Shorts Pro',
                slug: 'athletic-shorts-pro',
                sku: 'ASP-001',
                description: 'High-performance athletic shorts with stretch fabric',
                shortDescription: 'Professional athletic shorts',
                categoryId: athleticCategory?.id || 1,
                basePrice: '14.99',
                minOrderQuantity: 50,
                isActive: true,
                isFeatured: true,
                tags: ['athletic', 'shorts', 'performance'],
                features: ['4-way stretch', 'Moisture-wicking', 'Lightweight', 'Secure pockets'],
                sortOrder: 4
            },
            {
                name: 'Team Training Set',
                slug: 'team-training-set',
                sku: 'TTS-001',
                description: 'Complete training set including top and shorts',
                shortDescription: 'All-in-one training set',
                categoryId: uniformsCategory?.id || 1,
                basePrice: '29.99',
                minOrderQuantity: 20,
                isActive: true,
                isFeatured: true,
                tags: ['team', 'training', 'set'],
                features: ['Complete set', 'Matching design', 'Performance fabrics', 'Custom colors'],
                sortOrder: 5
            }
        ];

        return await db.insert(products).values(productData).returning();
    });
}

/**
 * Seed certificates
 */
export async function seedCertificates(): Promise<SeedResult> {
    return seedWithTransaction('certificates', async () => {
        const certData = [
            {
                name: 'GOTS Certification',
                type: 'sustainability',
                issuingOrganization: 'Global Organic Textile Standard',
                description: 'Global organic textile standard certification for organic cotton processing',
                certificateNumber: 'GOTS-2023-12345',
                issueDate: new Date('2023-01-15'),
                expiryDate: new Date('2026-01-15'),
                status: 'active',
                showOnSustainabilityPage: true,
                isActive: true
            },
            {
                name: 'ISO 9001:2015',
                type: 'quality',
                issuingOrganization: 'International Organization for Standardization',
                description: 'Quality management system certification',
                certificateNumber: 'ISO-9001-2023-67890',
                issueDate: new Date('2023-03-01'),
                expiryDate: new Date('2026-03-01'),
                status: 'active',
                showOnSustainabilityPage: false,
                isActive: true
            },
            {
                name: 'ISO 14001:2015',
                type: 'environmental',
                issuingOrganization: 'International Organization for Standardization',
                description: 'Environmental management system certification',
                certificateNumber: 'ISO-14001-2023-11111',
                issueDate: new Date('2023-03-01'),
                expiryDate: new Date('2026-03-01'),
                status: 'active',
                showOnSustainabilityPage: true,
                isActive: true
            }
        ];

        return await db.insert(certificates).values(certData).returning();
    });
}

/**
 * Seed size charts
 */
export async function seedSizeCharts(): Promise<SeedResult> {
    return seedWithTransaction('sizeCharts', async () => {
        const sizeData = [
            {
                name: 'Standard Adult Sizing',
                chartType: 'adult',
                measurements: {
                    XS: { chest: '34-36', waist: '28-30', hips: '35-37' },
                    S: { chest: '36-38', waist: '30-32', hips: '37-39' },
                    M: { chest: '38-40', waist: '32-34', hips: '39-41' },
                    L: { chest: '40-42', waist: '34-36', hips: '41-43' },
                    XL: { chest: '42-44', waist: '36-38', hips: '43-45' },
                    '2XL': { chest: '44-46', waist: '38-40', hips: '45-47' },
                    '3XL': { chest: '46-48', waist: '40-42', hips: '47-49' }
                },
                unit: 'inches',
                isActive: true
            },
            {
                name: 'Youth Sizing',
                chartType: 'youth',
                measurements: {
                    YXS: { chest: '26-28', waist: '22-24', height: '48-52' },
                    YS: { chest: '28-30', waist: '24-26', height: '52-56' },
                    YM: { chest: '30-32', waist: '26-28', height: '56-60' },
                    YL: { chest: '32-34', waist: '28-30', height: '60-64' }
                },
                unit: 'inches',
                isActive: true
            }
        ];

        return await db.insert(sizeCharts).values(sizeData).returning();
    });
}

/**
 * Seed accessories
 */
export async function seedAccessories(): Promise<SeedResult> {
    return seedWithTransaction('accessories', async () => {
        const accessoryData = [
            {
                name: 'Custom Team Logo',
                type: 'branding',
                description: 'Screen printed or embroidered team logo',
                basePrice: '2.50',
                isActive: true
            },
            {
                name: 'Player Numbers',
                type: 'customization',
                description: 'Heat-applied player numbers (front/back)',
                basePrice: '1.50',
                isActive: true
            },
            {
                name: 'Sponsor Patch',
                type: 'branding',
                description: 'Embroidered sponsor logo patch',
                basePrice: '3.00',
                isActive: true
            }
        ];

        return await db.insert(accessories).values(accessoryData).returning();
    });
}

// Export all seeders
export const productEcosystemSeeders = {
    seedCategories,
    seedFibers,
    seedFabrics,
    seedFabricCompositions,
    seedProducts,
    seedCertificates,
    seedSizeCharts,
    seedAccessories
};
