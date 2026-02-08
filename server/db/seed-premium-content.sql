-- Premium Content Seed for RUN APPAREL
-- Target: Replace "Placeholder" content with industry-standard B2B copy and premium assets

-- 1. Update Navigation Items with specific icons and labels
UPDATE navigation_items 
SET fallback_icon = 'IconShirt' 
WHERE label ILIKE '%Product%' OR label ILIKE '%Apparel%';

UPDATE navigation_items 
SET fallback_icon = 'IconLeaf' 
WHERE label ILIKE '%Sustainability%' OR label ILIKE '%Green%' OR label ILIKE '%Ethical%';

UPDATE navigation_items 
SET fallback_icon = 'IconCpu' 
WHERE label ILIKE '%Technology%' OR label ILIKE '%Innovation%' OR label ILIKE '%R&D%';

UPDATE navigation_items 
SET fallback_icon = 'IconInfoCircle' 
WHERE label ILIKE '%About%' OR label ILIKE '%History%';

UPDATE navigation_items 
SET fallback_icon = 'IconMessage' 
WHERE label ILIKE '%Contact%' OR label ILIKE '%Support%';

-- 2. Update Homepage Hero for Premium Feel
UPDATE homepage_hero
SET title = 'Next-Generation Sportswear Manufacturing',
    subtitle = 'Engineering high-performance athletic apparel with precision, sustainability, and ethical excellence since 1889.',
    cta_text = 'EXPLORE OUR CAPABILITIES'
WHERE is_active = true;

-- 3. Update About Hero for Premium Feel
UPDATE about_hero
SET title = 'A Legacy of Excellence in Apparel Engineering',
    subtitle = 'From heritage craftsmanship to modern innovation, we define the future of B2B sportswear.',
    description = 'Based in Faisalabad, RUN APPAREL (PVT) LTD operates one of the most advanced vertical manufacturing facilities in the region, serving global performance brands with speed and scale.'
WHERE is_active = true;

-- 4. Clean up Product Placeholders
UPDATE products
SET name = 'Elite Performance Aero-Jersey',
    description = 'A high-compression performance jersey engineered for maximum breathability and moisture-wicking capability.',
    short_description = 'Professional grade performance jersey'
WHERE name ILIKE '%Placeholder%' OR name = 'Product 1';

UPDATE products
SET name = 'Pro-Stretch Compression Leggings',
    description = 'Seamless multi-panel leggings designed for high-intensity training with strategic ventilation zones.',
    short_description = 'Technical compression leggings'
WHERE name ILIKE '%Placeholder%' OR name = 'Product 2';

UPDATE products
SET name = 'Urban Tech-Fleece Hoodie',
    description = 'A premium thermal layer combining street aesthetics with athletic functionality.',
    short_description = 'Hybrid thermal hoodie'
WHERE name ILIKE '%Placeholder%' OR name = 'Product 3';
