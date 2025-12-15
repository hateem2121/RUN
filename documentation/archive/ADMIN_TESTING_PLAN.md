# Admin CRUD Testing Plan - Systematic Validation Guide

**Testing Order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 (Integration) → 10 (Performance)

**Database:** Uses NEON PostgreSQL via `src/db/index.ts` and Drizzle ORM

---

## 1. /admin/fibers - Foundation Testing

**Route:** `/admin/fibers`
**Component:** `client/src/components/admin/fiber-management.tsx`
**Schema Table:** `fibers`

### Test Checklist

**Create Operation:**
- [ ] Navigate to `/admin/fibers`
- [ ] Click "Create New Fiber" button
- [ ] Fill required field: `name` (e.g., "Organic Cotton Test")
- [ ] Select `type` from dropdown: natural/synthetic/blended/regenerated
- [ ] Add `properties` using property list builder (e.g., "Breathable", "Moisture-wicking")
- [ ] Set `sustainabilityScore` (1-5 scale)
- [ ] Add `environmentalImpact` description
- [ ] Click Submit
- [ ] **Verify:** Success toast appears
- [ ] **Verify:** New fiber appears in list

**Duplicate Name Prevention:**
- [ ] Try creating another fiber with exact same name
- [ ] **Verify:** Error message shows "A fiber with this name already exists"
- [ ] **Verify:** Form does not submit

**Property Management:**
- [ ] Create fiber with multiple properties ("Soft", "Durable", "Anti-microbial")
- [ ] **Verify:** Properties display as tags
- [ ] Remove one property
- [ ] **Verify:** Property removed from database

**Read Operation:**
- [ ] View fiber in grid/list/detailed view modes
- [ ] **Verify:** All fields display correctly
- [ ] **Verify:** Properties shown as comma-separated or badges
- [ ] Check sustainability score visualization (star rating)

**Update Operation:**
- [ ] Click Edit on existing fiber
- [ ] Modify `name` to unique value
- [ ] Change `type` to different option
- [ ] Add new properties
- [ ] Update `sustainabilityScore`
- [ ] Click Save
- [ ] **Verify:** Success toast
- [ ] **Verify:** Changes persist after page refresh

**Delete Operation:**
- [ ] Click Delete on test fiber
- [ ] **Verify:** Confirmation dialog appears
- [ ] Confirm deletion
- [ ] **Verify:** Fiber removed from list
- [ ] **Verify:** Success toast

**Bulk Operations:**
- [ ] Select multiple fibers using checkboxes
- [ ] Bulk activate/deactivate
- [ ] **Verify:** All selected fibers updated
- [ ] Bulk delete 2+ fibers
- [ ] **Verify:** All deleted successfully

### SQL Verification Queries

```sql
-- Check fiber creation
SELECT id, name, type, sustainability_score, is_active, created_at
FROM fibers
WHERE name = 'Organic Cotton Test'
ORDER BY created_at DESC;

-- Verify properties structure (should be JSONB object)
SELECT id, name, properties
FROM fibers
WHERE properties IS NOT NULL
LIMIT 5;

-- Check for duplicate names
SELECT name, COUNT(*) as count
FROM fibers
GROUP BY name
HAVING COUNT(*) > 1;

-- Verify soft delete (deleted_at should be set, not hard deleted)
SELECT id, name, deleted_at
FROM fibers
WHERE deleted_at IS NOT NULL;

-- Check sustainability score range (should be 1-5 or NULL)
SELECT id, name, sustainability_score
FROM fibers
WHERE sustainability_score NOT BETWEEN 1 AND 5;
```

### Schema Issues Found
- ✓ No issues - `properties` uses JSONB as expected
- ✓ `type` is NOT NULL per schema
- ✓ `deleted_at` supports soft delete

---

## 2. /admin/fabrics - Fiber Relationship Testing

**Route:** `/admin/fabrics`
**Component:** `client/src/components/admin/fabric-management-enhanced-v2.tsx`
**Schema Table:** `fabrics`

### Test Checklist

**Create Operation - Basic:**
- [ ] Navigate to `/admin/fabrics`
- [ ] Click "Create New Fabric"
- [ ] Fill `name` (e.g., "Performance Mesh 2024")
- [ ] Add `description`
- [ ] Enter `weight` (e.g., "180" for 180 GSM)
- [ ] Select `weave` or `weaveType`
- [ ] Add `finishTreatment` (e.g., "Water-repellent")
- [ ] Click Submit
- [ ] **Verify:** Fabric created successfully

**Fiber Composition - Multi-Fiber Relationship:**
- [ ] Create fabric with composition section
- [ ] Add first fiber: Select existing fiber from dropdown (e.g., "Polyester - 65%")
- [ ] Add second fiber: Select different fiber (e.g., "Elastane - 5%")
- [ ] **Verify:** Total percentage = 100% validation works
- [ ] Save fabric
- [ ] **Verify:** Composition stored correctly

**Media Integration - Visual Swatch:**
- [ ] Click "Select Visual Swatch" button
- [ ] Media library dialog opens
- [ ] Select an image from `/admin/media`
- [ ] **Verify:** `visualSwatchId` populated
- [ ] **Verify:** Swatch thumbnail displays in form
- [ ] Remove swatch
- [ ] **Verify:** `visualSwatchId` set to NULL

**Certifications Array (JSONB):**
- [ ] In "Sustainability & Lifecycle" section
- [ ] Add multiple certificate IDs from dropdown
- [ ] **Verify:** Array displays as badges
- [ ] Save and reload
- [ ] **Verify:** Certificate associations persist

**Weave Types Array:**
- [ ] Add multiple weave types: ["Plain", "Twill", "Jersey"]
- [ ] **Verify:** Stored as JSONB array
- [ ] **Verify:** Displays correctly after save

**Performance Features:**
- [ ] Add features: ["Moisture-wicking", "UV Protection", "Anti-odor"]
- [ ] **Verify:** JSONB array storage
- [ ] Edit and remove one feature
- [ ] **Verify:** Update persists

**Read Operation:**
- [ ] View fabric in grid view
- [ ] **Verify:** Displays fiber composition breakdown
- [ ] **Verify:** Swatch image thumbnail shows
- [ ] Switch to detailed view
- [ ] **Verify:** All JSONB fields render correctly

**Update Operation:**
- [ ] Edit existing fabric
- [ ] Change `weight` value
- [ ] Modify fiber composition percentages
- [ ] Update `sustainabilityScore`
- [ ] Click Save
- [ ] **Verify:** All changes persist

**Delete Operation:**
- [ ] Delete test fabric
- [ ] **Verify:** Soft delete (deleted_at set)
- [ ] **Verify:** No hard deletion occurred

### SQL Verification Queries

```sql
-- Check fabric creation with all fields
SELECT 
    id, name, weight, weave, weave_type, finish_treatment,
    composition, sustainability_score, visual_swatch_id,
    is_active, created_at
FROM fabrics
WHERE name = 'Performance Mesh 2024';

-- Verify fiber composition structure
SELECT 
    id, name, composition,
    jsonb_typeof(composition) as composition_type
FROM fabrics
WHERE composition IS NOT NULL;

-- Check visual swatch foreign key (should reference media_assets)
SELECT 
    f.id, f.name, f.visual_swatch_id,
    m.filename, m.url
FROM fabrics f
LEFT JOIN media_assets m ON f.visual_swatch_id = m.id
WHERE f.visual_swatch_id IS NOT NULL;

-- Verify certifications array structure
SELECT 
    id, name, certifications,
    jsonb_array_length(certifications) as cert_count
FROM fabrics
WHERE certifications IS NOT NULL AND jsonb_typeof(certifications) = 'array';

-- Check weave_types array
SELECT 
    id, name, weave_types,
    jsonb_array_length(weave_types) as weave_count
FROM fabrics
WHERE weave_types IS NOT NULL;

-- Verify no orphaned visual swatch references
SELECT f.id, f.name, f.visual_swatch_id
FROM fabrics f
WHERE f.visual_swatch_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM media_assets m 
    WHERE m.id = f.visual_swatch_id
);

-- Check properties JSONB structure
SELECT 
    id, name, properties,
    jsonb_pretty(properties) as properties_formatted
FROM fabrics
WHERE properties IS NOT NULL
LIMIT 3;
```

### Schema Issues Found
- ⚠️ **Composition Field:** Schema shows `composition: text()` but form expects JSONB structure for fiber breakdown. Verify actual storage.
- ✓ `visual_swatch_id` correctly references `media_assets(id)` with ON DELETE SET NULL
- ✓ `certifications`, `weave_types` use JSONB arrays

---

## 3. /admin/certificates - Media Relationship Testing

**Route:** `/admin/certificates`
**Component:** `client/src/components/admin/certificate-management.tsx`
**Schema Table:** `certificates`

### Test Checklist

**Create Operation:**
- [ ] Navigate to `/admin/certificates`
- [ ] Click "Create Certificate"
- [ ] Fill `name` (e.g., "OEKO-TEX Standard 100")
- [ ] Select `type`: sustainability/compliance/quality/safety/environmental
- [ ] Enter `issuingOrganization` (e.g., "OEKO-TEX Association")
- [ ] Add `description`
- [ ] Optional: Enter `certificateNumber`
- [ ] Optional: Set `issueDate` and `expiryDate`
- [ ] Click Submit
- [ ] **Verify:** Certificate created

**Media Selection - Document:**
- [ ] Edit certificate
- [ ] Click "Select Document" button
- [ ] Media library opens filtered to documents/PDFs
- [ ] Select a PDF document
- [ ] **Verify:** `documentId` populated
- [ ] **Verify:** Document link displays
- [ ] Test "View Certificate" external link
- [ ] Remove document
- [ ] **Verify:** `documentId` set to NULL

**Media Selection - Image/Badge:**
- [ ] Click "Select Image" button
- [ ] Select certification badge image
- [ ] **Verify:** `imageId` populated
- [ ] **Verify:** Badge thumbnail displays
- [ ] Save certificate
- [ ] **Verify:** Both media references persist

**Type Categorization:**
- [ ] Create certificates of each type:
  - Sustainability (e.g., "Global Organic Textile Standard")
  - Compliance (e.g., "ISO 9001")
  - Quality (e.g., "SA8000")
  - Safety (e.g., "CPSIA Certified")
  - Environmental (e.g., "Carbon Neutral Certified")
- [ ] **Verify:** Type filter works in list view
- [ ] **Verify:** Correct icons display per type

**Expiry Date Validation:**
- [ ] Create certificate with `expiryDate` in past
- [ ] **Verify:** Status indicator shows "Expired"
- [ ] Create certificate with future expiry
- [ ] **Verify:** Shows "Active" status

**Read Operation:**
- [ ] View certificate grid/list
- [ ] **Verify:** Badge images render
- [ ] Click "View Details"
- [ ] **Verify:** Document link clickable
- [ ] **Verify:** All dates formatted correctly

**Update Operation:**
- [ ] Edit certificate
- [ ] Change `issuingOrganization`
- [ ] Update `expiryDate`
- [ ] Replace document with different file
- [ ] Save
- [ ] **Verify:** Old document reference removed
- [ ] **Verify:** New document displays

**Delete Operation:**
- [ ] Delete test certificate
- [ ] **Verify:** Soft delete (deleted_at)
- [ ] **Verify:** Media assets NOT deleted (cascade safety)

**Show on Sustainability Page:**
- [ ] Toggle `showOnSustainabilityPage` checkbox
- [ ] Save certificate
- [ ] **Verify:** Field updates correctly

### SQL Verification Queries

```sql
-- Check certificate with all fields
SELECT 
    id, name, type, issuing_organization, certificate_number,
    issue_date, expiry_date, document_id, image_id,
    show_on_sustainability_page, is_active, status
FROM certificates
WHERE name LIKE '%OEKO-TEX%';

-- Verify document foreign key relationship
SELECT 
    c.id, c.name, c.document_id,
    m.filename, m.mime_type, m.url
FROM certificates c
LEFT JOIN media_assets m ON c.document_id = m.id
WHERE c.document_id IS NOT NULL;

-- Verify image foreign key relationship
SELECT 
    c.id, c.name, c.image_id,
    m.filename, m.type, m.url
FROM certificates c
LEFT JOIN media_assets m ON c.image_id = m.id
WHERE c.image_id IS NOT NULL;

-- Check for orphaned media references
SELECT c.id, c.name, c.document_id, 'document' as media_type
FROM certificates c
WHERE c.document_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = c.document_id)
UNION ALL
SELECT c.id, c.name, c.image_id, 'image' as media_type
FROM certificates c
WHERE c.image_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = c.image_id);

-- Check expiry date validation
SELECT 
    id, name, expiry_date, status,
    CASE 
        WHEN expiry_date < CURRENT_DATE THEN 'Expired'
        WHEN expiry_date IS NULL THEN 'No Expiry'
        ELSE 'Active'
    END as computed_status
FROM certificates
WHERE expiry_date IS NOT NULL;

-- Verify type distribution
SELECT type, COUNT(*) as count
FROM certificates
WHERE deleted_at IS NULL
GROUP BY type
ORDER BY count DESC;

-- Check certificates shown on sustainability page
SELECT id, name, type, show_on_sustainability_page
FROM certificates
WHERE show_on_sustainability_page = true
AND is_active = true;
```

### Schema Issues Found
- ✓ Both `documentId` and `imageId` reference `media_assets(id)` with ON DELETE SET NULL
- ✓ `showOnSustainabilityPage` indexed for fast filtering
- ⚠️ **Dual URL fields:** Schema has both `documentId` (FK) and `documentUrl` (varchar). Verify form uses FK not URL string.

---

## 4. /admin/size-charts - JSONB Measurements Testing

**Route:** `/admin/size-charts`
**Component:** `client/src/components/admin/size-chart-management-enhanced.tsx`
**Schema Table:** `size_charts`

### Test Checklist

**Create Operation - Template Based:**
- [ ] Navigate to `/admin/size-charts`
- [ ] Click "Create Size Chart"
- [ ] Enter `name` (e.g., "US Apparel Sizing")
- [ ] Select `region`: US/EU/UK/CN/JP/INTL
- [ ] Select `type`/`category`: apparel/footwear/accessories/headwear
- [ ] Click "Load Template" button
- [ ] **Verify:** Pre-populated measurement grid appears
- [ ] **Verify:** Standard sizes loaded (e.g., XS, S, M, L, XL for apparel)

**Measurements JSONB Structure:**
- [ ] Fill measurements for "S" size:
  - Chest: 92 cm
  - Waist: 76 cm
  - Hips: 98 cm
  - Shoulder: 42 cm
  - Sleeve: 61 cm
  - Length: 68 cm
- [ ] Add measurements for "M", "L" sizes
- [ ] Click Submit
- [ ] **Verify:** Chart created with nested JSONB structure

**Manual Measurement Entry:**
- [ ] Create new chart without template
- [ ] Manually add measurement size "XS"
- [ ] Add measurement key "Chest" with value "88"
- [ ] Click "Add Measurement"
- [ ] **Verify:** Appears in table
- [ ] Add another key for same size
- [ ] **Verify:** Both keys show for "XS" size

**Unit System Toggle:**
- [ ] Toggle unit system from Metric to Imperial
- [ ] **Verify:** Display converts cm to inches (divide by 2.54)
- [ ] **Verify:** Database still stores original metric values
- [ ] Switch back to Metric
- [ ] **Verify:** Original values restored

**Read Operation - Preview:**
- [ ] Click "Preview" on size chart
- [ ] **Verify:** Measurement table renders correctly
- [ ] **Verify:** All sizes and measurements display
- [ ] **Verify:** Regional flag icon shows (🇺🇸 for US, 🇪🇺 for EU)

**Update Operation:**
- [ ] Edit existing chart
- [ ] Modify measurement value for "M" size Chest to "96"
- [ ] Add new measurement key "Inseam"
- [ ] Remove measurement "Sleeve" from one size
- [ ] Save
- [ ] **Verify:** Changes persist
- [ ] **Verify:** JSONB structure remains valid

**Delete Operation:**
- [ ] Delete measurement key from size
- [ ] **Verify:** Key removed from JSONB
- [ ] Delete entire size entry
- [ ] **Verify:** Size removed from measurements object
- [ ] Delete entire chart
- [ ] **Verify:** Soft delete (deleted_at)

**Validation - Completeness Check:**
- [ ] Create chart with missing measurements
- [ ] **Verify:** Progress indicator shows incomplete percentage
- [ ] Fill all measurements
- [ ] **Verify:** Completeness reaches 100%

**Fit Notes Field:**
- [ ] Add `fitNotes`: "Runs small, order one size up"
- [ ] Save and reload
- [ ] **Verify:** Fit notes display in preview

### SQL Verification Queries

```sql
-- Check size chart creation with full structure
SELECT 
    id, name, region, type, category,
    measurements, fit_notes, is_active, created_at
FROM size_charts
WHERE name = 'US Apparel Sizing';

-- Verify measurements JSONB structure (nested object)
SELECT 
    id, name,
    jsonb_pretty(measurements) as measurements_formatted,
    jsonb_typeof(measurements) as measurements_type
FROM size_charts
WHERE measurements IS NOT NULL
LIMIT 2;

-- Extract specific measurement from JSONB
SELECT 
    id, name, region,
    measurements->'M'->>'Chest' as m_size_chest,
    measurements->'L'->>'Waist' as l_size_waist
FROM size_charts
WHERE measurements ? 'M' OR measurements ? 'L';

-- Count sizes per chart
SELECT 
    id, name,
    jsonb_object_keys(measurements) as size_label
FROM size_charts
WHERE measurements IS NOT NULL;

-- Verify sizeRange array
SELECT 
    id, name, size_range,
    jsonb_array_length(size_range) as size_count
FROM size_charts
WHERE size_range IS NOT NULL;

-- Check measurement completeness
WITH measurement_stats AS (
    SELECT 
        id, name,
        (SELECT COUNT(*) FROM jsonb_object_keys(measurements)) as size_count,
        (SELECT jsonb_array_length(jsonb_agg(value)) 
         FROM jsonb_each(measurements), 
              jsonb_each(value)) as total_measurements
    FROM size_charts
    WHERE measurements IS NOT NULL
)
SELECT * FROM measurement_stats;

-- Verify no invalid JSONB structures
SELECT id, name, measurements
FROM size_charts
WHERE measurements IS NOT NULL
AND jsonb_typeof(measurements) != 'object';
```

### Schema Issues Found
- ✓ `measurements` correctly uses JSONB for flexible nested structure
- ✓ `sizeRange` JSONB array for size list
- ⚠️ **Unit field:** Schema has `unit` varchar default 'cm' but form doesn't save unit preference to DB (display-only conversion)

---

## 5. /admin/accessories - SKU & Specifications Testing

**Route:** `/admin/accessories`
**Component:** `client/src/components/admin/accessory-management-enhanced.tsx`
**Schema Table:** `accessories`

### Test Checklist

**Create Operation:**
- [ ] Navigate to `/admin/accessories`
- [ ] Click "Create New Accessory"
- [ ] Fill `name` (e.g., "YKK Zipper #5")
- [ ] Enter `category` (e.g., "Hardware", "Finishing", "Customization")
- [ ] Add `type` (e.g., "Zipper", "Button", "Label")
- [ ] Enter `description`
- [ ] Fill `sku` (e.g., "ZPR-YKK-005")
- [ ] Enter `price`: 0.85
- [ ] Enter `material`: "Nylon"
- [ ] Enter `color`: "Black"
- [ ] Enter `size`: "5 inch"
- [ ] Click Submit
- [ ] **Verify:** Accessory created

**SKU Uniqueness:**
- [ ] Try creating another accessory with same SKU
- [ ] **Verify:** Error or warning about duplicate SKU
- [ ] Change SKU to unique value
- [ ] **Verify:** Creates successfully

**Specifications JSONB Array:**
- [ ] In specifications section
- [ ] Add spec: "Available in 15 colors with heat transfer application at 320°F"
- [ ] Click "Add" button
- [ ] Add second spec: "Durability rating: 10,000 cycles minimum"
- [ ] Add third spec: "Lead time: 5-7 business days"
- [ ] **Verify:** All three specs display as list
- [ ] Save accessory
- [ ] **Verify:** Specifications stored as JSONB

**Media Integration:**
- [ ] Click "Select Image" button
- [ ] Choose product image from media library
- [ ] **Verify:** `imageId` populated
- [ ] **Verify:** Image thumbnail displays
- [ ] Remove image
- [ ] **Verify:** `imageId` set to NULL

**Category Icons & Colors:**
- [ ] Create accessories in different categories:
  - Hardware (wrench icon, blue)
  - Customization (palette icon, purple)
  - Finishing (scissors icon, green)
  - Trim (layers icon, orange)
  - Packaging (package icon, gray)
- [ ] **Verify:** Each displays with correct icon and color badge

**Read Operation:**
- [ ] View accessory grid
- [ ] **Verify:** SKU displays
- [ ] **Verify:** Price formatted as currency
- [ ] **Verify:** Image thumbnail shows
- [ ] Open detailed view
- [ ] **Verify:** All specifications render as bullet list

**Update Operation:**
- [ ] Edit accessory
- [ ] Change `price` to 0.95
- [ ] Update `material` to "Polyester"
- [ ] Modify specifications (remove one, add one)
- [ ] Save
- [ ] **Verify:** All changes persist
- [ ] **Verify:** Specifications array updated correctly

**Delete Operation:**
- [ ] Delete test accessory
- [ ] **Verify:** Soft delete (deleted_at)
- [ ] **Verify:** Media asset NOT deleted (cascade safety)

**Price Validation:**
- [ ] Enter negative price
- [ ] **Verify:** Validation error or auto-correct to 0
- [ ] Enter very large decimal (e.g., 99999.999)
- [ ] **Verify:** Matches precision (10, 2) - max 99999999.99

### SQL Verification Queries

```sql
-- Check accessory with all fields
SELECT 
    id, name, category, type, sku, price,
    material, color, size, specifications,
    image_id, is_active, created_at
FROM accessories
WHERE sku = 'ZPR-YKK-005';

-- Verify SKU uniqueness
SELECT sku, COUNT(*) as count
FROM accessories
WHERE deleted_at IS NULL
GROUP BY sku
HAVING COUNT(*) > 1;

-- Verify specifications JSONB structure
SELECT 
    id, name, specifications,
    jsonb_typeof(specifications) as spec_type,
    jsonb_array_length(specifications) as spec_count
FROM accessories
WHERE specifications IS NOT NULL;

-- Check price precision (should be decimal(10,2))
SELECT 
    id, name, price,
    pg_typeof(price) as price_type
FROM accessories
WHERE price IS NOT NULL;

-- Verify image foreign key
SELECT 
    a.id, a.name, a.image_id,
    m.filename, m.url
FROM accessories a
LEFT JOIN media_assets m ON a.image_id = m.id
WHERE a.image_id IS NOT NULL;

-- Check for orphaned image references
SELECT id, name, image_id
FROM accessories
WHERE image_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM media_assets WHERE id = image_id
);

-- Category distribution
SELECT category, COUNT(*) as count
FROM accessories
WHERE deleted_at IS NULL
GROUP BY category
ORDER BY count DESC;

-- Check SKU index performance
EXPLAIN ANALYZE
SELECT * FROM accessories
WHERE sku = 'ZPR-YKK-005';
-- Should use index 'accessories_sku_idx'
```

### Schema Issues Found
- ✓ `sku` has index for fast lookups
- ✓ `price` uses decimal(10, 2) for currency precision
- ⚠️ **Specifications:** Form expects JSONB array but schema shows `specifications: jsonb().$type<Record<string, any>>()` (object). Verify actual usage - form treats it as array of strings.
- ✓ `imageId` correctly references media_assets with ON DELETE SET NULL

---

## 6. /admin/categories - Hierarchical & Featured Content Testing

**Route:** `/admin/categories`
**Component:** `client/src/components/admin/category-management-simplified.tsx`
**Schema Table:** `categories`

### Test Checklist

**Create Operation - Top Level:**
- [ ] Navigate to `/admin/categories`
- [ ] Click "Create Category"
- [ ] Fill `name` (e.g., "Performance Wear")
- [ ] Generate `slug` (auto-generated from name or manual: "performance-wear")
- [ ] Add `description`
- [ ] Leave `parentId` as NULL for top-level category
- [ ] Set `sortOrder`: 1
- [ ] Toggle `isActive`: true
- [ ] Click Submit
- [ ] **Verify:** Category created at root level

**Slug Uniqueness:**
- [ ] Try creating category with duplicate slug
- [ ] **Verify:** Error shows "Slug already exists"
- [ ] Change slug to unique value
- [ ] **Verify:** Creates successfully

**Hierarchical Relationship - Parent/Child:**
- [ ] Create child category
- [ ] Fill `name`: "Running Shorts"
- [ ] Slug: "running-shorts"
- [ ] Select `parentId`: "Performance Wear" from dropdown
- [ ] **Verify:** `level` auto-calculated as 1
- [ ] **Verify:** `fullPath` generated as "/performance-wear/running-shorts"
- [ ] Save
- [ ] Create grandchild category under "Running Shorts"
- [ ] **Verify:** `level` = 2, `fullPath` has 3 segments

**Self-Referencing Foreign Key Safety:**
- [ ] Try to set category's parent to itself
- [ ] **Verify:** Validation prevents circular reference
- [ ] Try to set parent to own descendant (creates loop)
- [ ] **Verify:** Error or prevention mechanism

**Primary Image Media Selection:**
- [ ] Edit category
- [ ] Click "Select Primary Image"
- [ ] Choose category banner image
- [ ] **Verify:** `primaryImageId` populated
- [ ] **Verify:** Image preview displays
- [ ] Save category
- [ ] **Verify:** Image persists after reload

**Alternative Image URL:**
- [ ] Enter direct `imageUrl` (e.g., "https://cdn.example.com/category.jpg")
- [ ] **Verify:** Either `primaryImageId` OR `imageUrl` used, not both
- [ ] **Verify:** Display logic prefers `primaryImageId` over `imageUrl`

**Featured Content JSONB (Bento Cards):**
- [ ] Navigate to "Featured Content" section
- [ ] Configure `card1`:
  - `cardType`: "svg-mask" / "expandable" / "flip" / "fluid-glass"
  - `title`: "Featured Product"
  - `description`: "High-performance gear"
  - `maskSvgUrl`: Select media asset ID from library
  - `contentMediaUrl`: Select different media asset
- [ ] Configure `card2`, `card3`, `card4` similarly
- [ ] Save category
- [ ] **Verify:** JSONB stored with nested structure

**Featured on Homepage:**
- [ ] Toggle `featuredOnHomepage`: true
- [ ] Set `gridPosition`: 1
- [ ] Set `displayOrder`: 10
- [ ] Save
- [ ] **Verify:** Category appears in homepage query

**Read Operation:**
- [ ] View category tree structure
- [ ] **Verify:** Hierarchy displays with indentation
- [ ] **Verify:** Parent > Child relationship clear
- [ ] Click on category
- [ ] **Verify:** Featured content preview renders

**Update Operation:**
- [ ] Edit category
- [ ] Change `parentId` to different parent
- [ ] **Verify:** `fullPath` and `level` recalculated
- [ ] Update `featuredContent` JSON
- [ ] Save
- [ ] **Verify:** All changes persist

**Delete Operation - Cascade Safety:**
- [ ] Try to delete parent category with children
- [ ] **Verify:** Soft delete sets `deletedAt`
- [ ] **Verify:** Children's `parentId` set to NULL (ON DELETE SET NULL per schema)
- [ ] **Verify:** Deletion does NOT cascade to media assets

**SEO Fields:**
- [ ] Fill `metaTitle`: "Performance Wear | Premium Athletic Apparel"
- [ ] Fill `metaDescription`: "Discover our range of high-performance sportswear..."
- [ ] **Verify:** Fields saved correctly

### SQL Verification Queries

```sql
-- Check category with full hierarchy
SELECT 
    id, name, slug, parent_id, level, full_path,
    primary_image_id, image_url, featured_on_homepage,
    grid_position, is_active, created_at
FROM categories
WHERE slug = 'performance-wear';

-- Verify hierarchical structure (parent-child relationships)
WITH RECURSIVE category_tree AS (
    -- Base case: top-level categories
    SELECT id, name, parent_id, level, full_path, 
           ARRAY[id] as path_ids
    FROM categories
    WHERE parent_id IS NULL AND deleted_at IS NULL
    
    UNION ALL
    
    -- Recursive case: children
    SELECT c.id, c.name, c.parent_id, c.level, c.full_path,
           ct.path_ids || c.id
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
    WHERE c.deleted_at IS NULL
)
SELECT id, name, parent_id, level, full_path, path_ids
FROM category_tree
ORDER BY path_ids;

-- Check for circular references (self-referencing loops)
SELECT id, name, parent_id
FROM categories
WHERE id = parent_id;

-- Verify slug uniqueness
SELECT slug, COUNT(*) as count
FROM categories
WHERE deleted_at IS NULL
GROUP BY slug
HAVING COUNT(*) > 1;

-- Check featured content JSONB structure
SELECT 
    id, name,
    jsonb_pretty(featured_content) as featured_content_formatted,
    featured_content->'card1'->>'cardType' as card1_type,
    featured_content->'card1'->>'maskSvgUrl' as card1_svg_url
FROM categories
WHERE featured_content IS NOT NULL;

-- Verify primary image foreign key
SELECT 
    c.id, c.name, c.primary_image_id,
    m.filename, m.url
FROM categories c
LEFT JOIN media_assets m ON c.primary_image_id = m.id
WHERE c.primary_image_id IS NOT NULL;

-- Check for orphaned primary image references
SELECT id, name, primary_image_id
FROM categories
WHERE primary_image_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM media_assets WHERE id = primary_image_id
);

-- Verify category levels match parent hierarchy
SELECT 
    c.id, c.name, c.level, c.parent_id,
    p.level as parent_level,
    CASE 
        WHEN c.parent_id IS NULL THEN c.level = 0
        ELSE c.level = p.level + 1
    END as level_correct
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.deleted_at IS NULL;

-- Check featured homepage categories
SELECT id, name, featured_on_homepage, grid_position, display_order
FROM categories
WHERE featured_on_homepage = true
AND is_active = true
ORDER BY display_order, grid_position;

-- Test fullPath index performance
EXPLAIN ANALYZE
SELECT * FROM categories
WHERE full_path LIKE '/performance-wear%';
-- Should use 'categories_full_path_idx'
```

### Schema Issues Found
- ✓ Self-referencing FK configured with ON DELETE SET NULL (children become orphans, not deleted)
- ✓ `fullPath` indexed for fast hierarchical queries
- ⚠️ **Dual image fields:** Both `primaryImageId` (FK) and `imageUrl` (varchar) exist. Verify form logic doesn't create conflicts.
- ✓ `featuredContent` JSONB supports complex nested objects for Bento cards
- ⚠️ **Level calculation:** No database trigger to auto-update `level` when parent changes. Must be handled in application logic.

---

## 7. /admin/products - Comprehensive Relationship Testing

**Route:** `/admin/products`
**Component:** `client/src/components/admin/product-management-unified/ProductManagementUnified.tsx`
**Schema Table:** `products`

### Test Checklist

**Create Operation - Basic Required Fields:**
- [ ] Navigate to `/admin/products`
- [ ] Click "Create Product"
- [ ] Fill `name` (e.g., "Pro Training Tee")
- [ ] Generate `slug` (e.g., "pro-training-tee")
- [ ] **REQUIRED:** Select `categoryId` from dropdown (NOT NULL constraint)
- [ ] Fill `sku` (e.g., "PTT-BLK-001")
- [ ] Enter `price`: 29.99 (REQUIRED, NOT NULL)
- [ ] Add `shortDescription` and `description`
- [ ] Click Submit
- [ ] **Verify:** Product created successfully

**Category Relationship - RESTRICT Constraint:**
- [ ] Product created with valid category
- [ ] Try to delete the category used by product
- [ ] **Verify:** Delete FAILS with FK constraint error (ON DELETE RESTRICT)
- [ ] **Verify:** Error message shows category has dependent products

**SKU Uniqueness:**
- [ ] Try creating product with duplicate SKU
- [ ] **Verify:** Error or validation prevents duplicate
- [ ] Change SKU to unique value
- [ ] **Verify:** Creates successfully

**Fabric Relationship (Optional FK):**
- [ ] Edit product
- [ ] Select `fabricId` from fabrics dropdown
- [ ] **Verify:** Fabric association saved
- [ ] Clear fabric selection
- [ ] **Verify:** `fabricId` set to NULL (optional relationship)

**Size Chart Relationship:**
- [ ] Select `sizeChartId` from dropdown
- [ ] **Verify:** Size chart linked
- [ ] Save and reload
- [ ] **Verify:** Size chart displays in product details

**Certificates Array (JSONB):**
- [ ] In "Certifications" section
- [ ] Select multiple certificates from multi-select dropdown
- [ ] **Verify:** `certificateIds` array: [1, 3, 5]
- [ ] Save product
- [ ] **Verify:** Array persists as JSONB

**Accessories Array (JSONB):**
- [ ] In "Accessories & Customization" section
- [ ] Select multiple accessories
- [ ] **Verify:** `accessoryIds` array populated
- [ ] Remove one accessory
- [ ] **Verify:** Array updated correctly

**Media Assets - Multiple Types:**
- [ ] **Primary Image:**
  - Select `primaryImageId` from media library
  - **Verify:** Main product image displays
- [ ] **Image IDs Array:**
  - Add multiple product images
  - **Verify:** `imageIds` JSONB array: [10, 11, 12]
- [ ] **Primary Video:**
  - Select `primaryVideoId` (video type media)
  - **Verify:** Video reference saved
- [ ] **3D Model:**
  - Select `modelFileId` (3D model file)
  - **Verify:** Model file linked

**Specifications & Features JSONB:**
- [ ] Add `specifications`:
  ```json
  {
    "Material": "95% Polyester, 5% Elastane",
    "Weight": "145 GSM",
    "Fit": "Regular"
  }
  ```
- [ ] Add `features` array: ["Moisture-wicking", "UV Protection", "Anti-odor"]
- [ ] Add `materials` array: ["Recycled Polyester", "Elastane"]
- [ ] **Verify:** All JSONB fields save correctly

**Fiber Composition JSONB:**
- [ ] Add `fiberComposition`:
  ```json
  {
    "Polyester": "95%",
    "Elastane": "5%"
  }
  ```
- [ ] **Verify:** Displays as breakdown chart

**Colors & Sizes Arrays:**
- [ ] Add `colors` array: ["Black", "Navy", "Gray"]
- [ ] Add `sizes` array: ["S", "M", "L", "XL"]
- [ ] **Verify:** Arrays stored as JSONB

**MOQ & Lead Time:**
- [ ] Set `minimumOrderQuantity`: 50
- [ ] Alternatively set `minOrderQuantity`: 50 (lowercase field)
- [ ] Set `leadTime`: "2-3 weeks"
- [ ] **Verify:** Both fields saved

**SEO & Status:**
- [ ] Fill `metaTitle`, `metaDescription`
- [ ] Toggle `isActive`: true
- [ ] Toggle `isFeatured`: true
- [ ] **Verify:** Product appears in featured products query

**Read Operation:**
- [ ] View product in grid
- [ ] **Verify:** Primary image thumbnail shows
- [ ] **Verify:** Price displays
- [ ] **Verify:** Category path shows (breadcrumb)
- [ ] Open product details panel
- [ ] **Verify:** All relationships display (fabric, size chart, certificates, accessories)
- [ ] **Verify:** Media gallery renders

**Update Operation - Relationship Changes:**
- [ ] Edit product
- [ ] Change `categoryId` to different category
- [ ] **Verify:** `categoryPath` updates automatically
- [ ] Change `fabricId`
- [ ] Add more certificates to array
- [ ] Remove one accessory from array
- [ ] Save
- [ ] **Verify:** All relationship changes persist

**Delete Operation - Cascade Safety:**
- [ ] Delete test product
- [ ] **Verify:** Soft delete (deleted_at)
- [ ] **Verify:** Media assets NOT deleted
- [ ] **Verify:** Linked fabric, size chart, certificates, accessories NOT affected

**Related Products Array:**
- [ ] Add `relatedProductIds`: [5, 8, 12]
- [ ] **Verify:** Related products display
- [ ] Test circular relationships (Product A → B → A)
- [ ] **Verify:** No infinite loops in display logic

### SQL Verification Queries

```sql
-- Check product with all relationships
SELECT 
    p.id, p.name, p.sku, p.slug, p.price,
    p.category_id, p.fabric_id, p.size_chart_id,
    p.primary_image_id, p.primary_video_id, p.model_file_id,
    p.certificate_ids, p.accessory_ids, p.image_ids,
    p.minimum_order_quantity, p.lead_time,
    p.is_active, p.is_featured, p.created_at
FROM products p
WHERE p.sku = 'PTT-BLK-001';

-- Verify category RESTRICT constraint
-- This should FAIL if product exists
-- DELETE FROM categories WHERE id = <category_id_with_products>;

-- Check all foreign key relationships
SELECT 
    p.id, p.name,
    c.name as category_name,
    f.name as fabric_name,
    sc.name as size_chart_name,
    mi.filename as primary_image_filename,
    mv.filename as primary_video_filename,
    mm.filename as model_filename
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN fabrics f ON p.fabric_id = f.id
LEFT JOIN size_charts sc ON p.size_chart_id = sc.id
LEFT JOIN media_assets mi ON p.primary_image_id = mi.id
LEFT JOIN media_assets mv ON p.primary_video_id = mv.id
LEFT JOIN media_assets mm ON p.model_file_id = mm.id
WHERE p.deleted_at IS NULL
LIMIT 5;

-- Verify certificate IDs array (all IDs should exist in certificates table)
SELECT 
    p.id, p.name, p.certificate_ids,
    (SELECT array_agg(id) FROM certificates WHERE id = ANY(
        SELECT jsonb_array_elements_text(p.certificate_ids)::int
    )) as valid_cert_ids
FROM products p
WHERE p.certificate_ids IS NOT NULL;

-- Check for orphaned certificate references
SELECT 
    p.id, p.name,
    cert_id
FROM products p,
     jsonb_array_elements_text(p.certificate_ids) cert_id
WHERE NOT EXISTS (
    SELECT 1 FROM certificates WHERE id = cert_id::int
);

-- Verify accessory IDs array
SELECT 
    p.id, p.name,
    acc_id
FROM products p,
     jsonb_array_elements_text(p.accessory_ids) acc_id
WHERE NOT EXISTS (
    SELECT 1 FROM accessories WHERE id = acc_id::int
);

-- Check specifications JSONB structure
SELECT 
    id, name,
    jsonb_pretty(specifications) as specs,
    specifications->>'Material' as material,
    specifications->>'Weight' as weight
FROM products
WHERE specifications IS NOT NULL
LIMIT 3;

-- Verify features and materials arrays
SELECT 
    id, name, features, materials,
    jsonb_array_length(features) as feature_count,
    jsonb_array_length(materials) as material_count
FROM products
WHERE features IS NOT NULL OR materials IS NOT NULL;

-- Check fiber composition JSONB
SELECT 
    id, name,
    jsonb_pretty(fiber_composition) as fiber_breakdown
FROM products
WHERE fiber_composition IS NOT NULL;

-- Verify colors and sizes arrays
SELECT 
    id, name, colors, sizes,
    jsonb_array_length(colors) as color_count,
    jsonb_array_length(sizes) as size_count
FROM products
WHERE colors IS NOT NULL AND sizes IS NOT NULL;

-- Check SKU uniqueness and index
SELECT sku, COUNT(*) as count
FROM products
WHERE deleted_at IS NULL
GROUP BY sku
HAVING COUNT(*) > 1;

EXPLAIN ANALYZE
SELECT * FROM products WHERE sku = 'PTT-BLK-001';
-- Should use 'products_sku_idx'

-- Verify category path matches category relationship
SELECT 
    p.id, p.name, p.category_id, p.category_path,
    c.full_path as actual_category_path
FROM products p
INNER JOIN categories c ON p.category_id = c.id
WHERE p.category_path != c.full_path;

-- Check hot query index performance (homepage/listing query)
EXPLAIN ANALYZE
SELECT * FROM products
WHERE deleted_at IS NULL
AND is_active = true
ORDER BY created_at DESC
LIMIT 12;
-- Should use 'products_hot_query_idx'

-- Verify fabric foreign key
SELECT 
    p.id, p.name, p.fabric_id,
    f.name as fabric_name
FROM products p
LEFT JOIN fabrics f ON p.fabric_id = f.id
WHERE p.fabric_id IS NOT NULL;

-- Check for orphaned fabric references
SELECT id, name, fabric_id
FROM products
WHERE fabric_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM fabrics WHERE id = fabric_id
);

-- Verify related products array (check for circular refs)
WITH RECURSIVE product_relations AS (
    SELECT id, name, related_product_ids, 1 as depth,
           ARRAY[id] as path
    FROM products
    WHERE id = 1 -- Starting product
    
    UNION ALL
    
    SELECT p.id, p.name, p.related_product_ids, pr.depth + 1,
           pr.path || p.id
    FROM products p
    INNER JOIN product_relations pr ON p.id = ANY(
        SELECT jsonb_array_elements_text(pr.related_product_ids)::int
    )
    WHERE NOT (p.id = ANY(pr.path)) AND pr.depth < 5
)
SELECT * FROM product_relations;
```

### Schema Issues Found
- ✓ `categoryId` has NOT NULL constraint and ON DELETE RESTRICT (prevents orphaned products)
- ✓ All optional FKs (fabricId, sizeChartId, media IDs) use ON DELETE SET NULL
- ⚠️ **Dual MOQ fields:** Both `minimumOrderQuantity` (camelCase) and `minOrderQuantity` (lowercase) exist. Application should use one consistently.
- ⚠️ **Certificate/Accessory arrays:** JSONB arrays store IDs as numbers. No database-level FK constraints on array elements (handled in application).
- ✓ `imageIds` JSONB array allows multiple product images
- ⚠️ **Category Path:** `categoryPath` varchar field should auto-update when category hierarchy changes (no DB trigger, relies on app logic)

---

## 8. Cross-Cutting Verification & Optimization Queries

### Database Integrity Checks

```sql
-- 1. Check all foreign key constraint violations across tables
SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'f'
AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY table_name, constraint_name;

-- 2. Find all orphaned media references (any FK pointing to non-existent media)
SELECT 'fabrics' as table_name, id, name, visual_swatch_id as media_id
FROM fabrics
WHERE visual_swatch_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = visual_swatch_id)

UNION ALL

SELECT 'certificates', id, name, image_id
FROM certificates
WHERE image_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = image_id)

UNION ALL

SELECT 'certificates', id, name, document_id
FROM certificates
WHERE document_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = document_id)

UNION ALL

SELECT 'accessories', id, name, image_id
FROM accessories
WHERE image_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = image_id)

UNION ALL

SELECT 'categories', id, name, primary_image_id
FROM categories
WHERE primary_image_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = primary_image_id)

UNION ALL

SELECT 'products', id, name, primary_image_id
FROM products
WHERE primary_image_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = primary_image_id);

-- 3. Check JSONB field validity across all tables
SELECT 'fabrics' as table_name, id, 'certifications' as field,
       jsonb_typeof(certifications) as type
FROM fabrics
WHERE certifications IS NOT NULL AND jsonb_typeof(certifications) != 'array'

UNION ALL

SELECT 'products', id, 'certificate_ids',
       jsonb_typeof(certificate_ids)
FROM products
WHERE certificate_ids IS NOT NULL AND jsonb_typeof(certificate_ids) != 'array'

UNION ALL

SELECT 'products', id, 'accessory_ids',
       jsonb_typeof(accessory_ids)
FROM products
WHERE accessory_ids IS NOT NULL AND jsonb_typeof(accessory_ids) != 'array'

UNION ALL

SELECT 'size_charts', id, 'measurements',
       jsonb_typeof(measurements)
FROM size_charts
WHERE measurements IS NOT NULL AND jsonb_typeof(measurements) != 'object';

-- 4. Verify soft delete consistency (deleted_at should cascade logically)
SELECT 
    'Products with deleted categories' as issue,
    p.id, p.name, p.category_id
FROM products p
INNER JOIN categories c ON p.category_id = c.id
WHERE c.deleted_at IS NOT NULL AND p.deleted_at IS NULL

UNION ALL

SELECT 
    'Products with deleted fabrics',
    p.id, p.name, p.fabric_id::varchar
FROM products p
INNER JOIN fabrics f ON p.fabric_id = f.id
WHERE f.deleted_at IS NOT NULL AND p.deleted_at IS NULL;

-- 5. Check index usage and performance
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%pkey'
ORDER BY idx_scan DESC;

-- 6. Find unused indexes (potential for removal)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
AND indexname NOT LIKE '%pkey';

-- 7. Check table sizes and bloat
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### NEON Connection Optimization

```sql
-- Keep connection time under 5 minutes by batching these checks:

-- Batch 1: All relationship integrity (run together)
WITH orphaned_refs AS (
    SELECT 'fabric_visual_swatch' as ref_type, COUNT(*) as count
    FROM fabrics WHERE visual_swatch_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = visual_swatch_id)
    UNION ALL
    SELECT 'product_category', COUNT(*)
    FROM products WHERE category_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM categories WHERE id = category_id)
    UNION ALL
    SELECT 'product_fabric', COUNT(*)
    FROM products WHERE fabric_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM fabrics WHERE id = fabric_id)
)
SELECT * FROM orphaned_refs WHERE count > 0;

-- Batch 2: JSONB structure validation (run together)
SELECT 
    'Invalid JSONB structures' as check_type,
    COUNT(*) as issues
FROM (
    SELECT 1 FROM products WHERE certificate_ids IS NOT NULL AND jsonb_typeof(certificate_ids) != 'array'
    UNION ALL
    SELECT 1 FROM products WHERE accessory_ids IS NOT NULL AND jsonb_typeof(accessory_ids) != 'array'
    UNION ALL
    SELECT 1 FROM size_charts WHERE measurements IS NOT NULL AND jsonb_typeof(measurements) != 'object'
) issues;

-- Batch 3: Uniqueness violations (run together)
SELECT 'Duplicate SKUs in products' as issue, COUNT(*) as count
FROM (
    SELECT sku FROM products WHERE deleted_at IS NULL
    GROUP BY sku HAVING COUNT(*) > 1
) dups
UNION ALL
SELECT 'Duplicate slugs in categories', COUNT(*)
FROM (
    SELECT slug FROM categories WHERE deleted_at IS NULL
    GROUP BY slug HAVING COUNT(*) > 1
) dups;
```

### KV Store Caching Strategy (Optional Enhancement)

For frequently accessed reference data, consider caching in KV Store:

```javascript
// Pseudo-code for caching strategy
const cache = {
  key: 'admin:reference_data',
  ttl: 300, // 5 minutes
  data: {
    categories: [], // All active categories for dropdowns
    fibers: [],     // All fibers for fabric composition
    certificates: [], // All certificates for multi-select
    accessories: []   // All accessories for product linking
  }
}

// Invalidate cache on CRUD operations:
// - Create/Update/Delete fiber → invalidate 'fibers' key
// - Create/Update/Delete category → invalidate 'categories' key
```

---

## Summary of Schema Issues Discovered

### Critical Issues ⚠️
1. **Products.categoryId RESTRICT Constraint**
   - **Issue:** Cannot delete categories with products
   - **Impact:** Admin must reassign products before category deletion
   - **Fix:** Add UI warning when attempting to delete category with products

2. **Dual Field Redundancy**
   - **certificates:** Both `documentId` (FK) and `documentUrl` (varchar)
   - **categories:** Both `primaryImageId` (FK) and `imageUrl` (varchar)
   - **products:** Both `minimumOrderQuantity` and `minOrderQuantity`
   - **Impact:** Potential data inconsistency
   - **Fix:** Use FK fields exclusively, deprecate varchar URL fields

### Medium Priority Issues ⚙️
3. **No Array Element FK Constraints**
   - **Tables:** products.certificateIds, products.accessoryIds
   - **Issue:** JSONB arrays store IDs without DB-level FK validation
   - **Impact:** Orphaned references possible if certificates/accessories deleted
   - **Fix:** Application-level validation before save

4. **Composition Field Type Mismatch**
   - **Schema:** fabrics.composition defined as `text()`
   - **Form:** Expects JSONB structure for fiber breakdown
   - **Fix:** Verify actual DB column type, update schema definition

5. **Specifications Field Type Mismatch**
   - **Schema:** accessories.specifications as `jsonb().$type<Record<string, any>>`
   - **Form:** Uses as array of strings
   - **Fix:** Align schema type or form logic

### Low Priority Issues 📝
6. **No Auto-Update Triggers**
   - **categories.level:** Not auto-updated when parent changes
   - **products.categoryPath:** Not auto-updated when category.fullPath changes
   - **Impact:** Manual application logic required
   - **Fix:** Add DB triggers or ensure app consistency

7. **Unit Field Display-Only**
   - **size_charts.unit:** Default 'cm' but not used for storage
   - **Impact:** Unit conversion is display-only (client-side)
   - **Fix:** Document behavior or store preferred unit

### Optimizations ✓
- All critical indexes present (SKU, slug, active flags, hot queries)
- Soft delete implemented consistently via `deleted_at`
- ON DELETE SET NULL prevents cascade failures for optional FKs
- JSONB fields properly indexed where queried

---
Create a comprehensive, detailed task list to proceed with our plan ADMIN_TESTING_PLAN.md 
## Testing Completion Criteria

**Each page test is complete when:**
- [ ] All CRUD operations verified (Create, Read, Update, Delete)
- [ ] Form field validation tested
- [ ] Foreign key relationships confirmed working
- [ ] Media selection/removal functional
- [ ] JSONB structures validate correctly
- [ ] SQL queries return expected data
- [ ] No console errors during operations
- [ ] All changes persist after page refresh
- [ ] Soft delete working (deleted_at set, not hard delete)

**Overall testing complete when:**
- [ ] All 7 admin pages tested in order
- [ ] All SQL verification queries executed
- [ ] Schema issues documented
- [ ] No orphaned records found
- [ ] All relationship constraints working
- [ ] Media library integration verified across all pages

---

## Quick Test Execution Guide

**Recommended Testing Session Flow:**

1. **Session 1 (30 min):** Fibers + Fabrics
   - Test fibers basic CRUD
   - Test fabrics with fiber relationships
   - Run relationship SQL queries

2. **Session 2 (25 min):** Certificates + Size Charts
   - Test media document/image selection
   - Test JSONB measurements structure
   - Verify media FK constraints

3. **Session 3 (25 min):** Accessories + Categories
   - Test SKU uniqueness
   - Test hierarchical parent/child
   - Test featured content JSONB

4. **Session 4 (40 min):** Products (comprehensive)
   - Test all FK relationships
   - Test certificate/accessory arrays
   - Test media gallery
   - Test category RESTRICT constraint

5. **Session 5 (20 min):** Cross-cutting verification
   - Run all orphaned reference queries
   - Check JSONB validity
   - Verify index usage
   - Document findings

**Total Estimated Time:** ~2.5 hours for complete testing

---

## 9. Edge Case & Error Recovery Testing

This section covers critical edge cases, concurrent editing scenarios, and error recovery paths that aren't covered in the basic CRUD tests above.

### 9.1 Soft Delete & Cascade Behavior

**Test: Fabric with Deleted Fiber Reference**
- [ ] Create fiber "TestFiber01"
- [ ] Create fabric using "TestFiber01" in composition
- [ ] Soft delete "TestFiber01" (sets deleted_at)
- [ ] View fabric composition
- [ ] **Verify:** Fiber name shows with "(Deleted)" indicator OR fiber removed from composition
- [ ] **Verify:** Fabric still functional
- [ ] Try to assign deleted fiber to new fabric
- [ ] **Verify:** Deleted fibers don't appear in dropdown

**SQL Verification:**
```sql
-- Check products using deleted fabrics/certificates
SELECT 
    p.id, p.name, p.fabric_id, f.deleted_at as fabric_deleted,
    p.certificate_ids,
    (SELECT array_agg(c.id) FROM certificates c 
     WHERE c.id = ANY(SELECT jsonb_array_elements_text(p.certificate_ids)::int)
     AND c.deleted_at IS NOT NULL) as deleted_cert_ids
FROM products p
LEFT JOIN fabrics f ON p.fabric_id = f.id
WHERE f.deleted_at IS NOT NULL OR p.certificate_ids IS NOT NULL;
```

**Test: Media Asset Deletion Safety**
- [ ] Create certificate with document and image
- [ ] Delete media asset from /admin/media
- [ ] **Verify:** Certificate's documentId/imageId set to NULL (ON DELETE SET NULL)
- [ ] Edit certificate
- [ ] **Verify:** Form shows "No document selected" (graceful handling)
- [ ] Save certificate without re-selecting media
- [ ] **Verify:** Save succeeds with NULL media references

**SQL Verification:**
```sql
-- Check ON DELETE SET NULL worked correctly
SELECT 
    'certificates_document' as type, COUNT(*) as orphaned_count
FROM certificates
WHERE document_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = document_id)
UNION ALL
SELECT 'fabrics_swatch', COUNT(*)
FROM fabrics
WHERE visual_swatch_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM media_assets WHERE id = visual_swatch_id);
```

### 9.2 Category RESTRICT Constraint Testing

**Test: Category Deletion with Active Products**
- [ ] Create category "TestCategory"
- [ ] Create product assigned to "TestCategory"
- [ ] Attempt to delete "TestCategory"
- [ ] **Verify:** Error toast shows "Cannot delete category with active products"
- [ ] **Verify:** Category NOT deleted
- [ ] Reassign product to different category
- [ ] Delete "TestCategory" again
- [ ] **Verify:** Deletion succeeds

**SQL Verification:**
```sql
-- Verify category RESTRICT constraint prevents deletion
-- Run in transaction to test without actual deletion
BEGIN;
DELETE FROM categories WHERE id = <category_id_with_products>;
-- Should fail with FK constraint error
ROLLBACK;

-- Check which categories have products
SELECT 
    c.id, c.name, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name
ORDER BY product_count DESC;
```

### 9.3 Concurrent Editing & Race Conditions

**Test: Simultaneous Edit Conflict**
- [ ] Open fiber edit form in two browser tabs
- [ ] Tab 1: Edit name to "ConcurrentTest1", save
- [ ] Tab 2: Edit name to "ConcurrentTest2" (without refresh), save
- [ ] **Verify:** Last save wins (Tab 2 overwrites Tab 1)
- [ ] **Expected Issue:** No optimistic locking - last write wins
- [ ] Refresh both tabs
- [ ] **Verify:** Both show "ConcurrentTest2"

**Test: Bulk Delete During Edit**
- [ ] Start editing accessory "ACC-001"
- [ ] In separate tab, bulk delete "ACC-001" with others
- [ ] Return to edit tab, make changes, click save
- [ ] **Verify:** Error shows "Accessory not found" or "Already deleted"
- [ ] **Verify:** Changes not saved

### 9.4 JSONB Array Edge Cases

**Test: Empty Certificate Array**
- [ ] Create product with certificates array
- [ ] Remove all certificates (empty array)
- [ ] Save product
- [ ] **Verify:** `certificateIds` stored as `[]` or NULL
- [ ] Reload product
- [ ] **Verify:** No errors rendering empty array

**SQL Verification:**
```sql
-- Check empty vs NULL array handling
SELECT 
    id, name, certificate_ids,
    CASE 
        WHEN certificate_ids IS NULL THEN 'NULL'
        WHEN jsonb_array_length(certificate_ids) = 0 THEN 'Empty Array'
        ELSE 'Has Certificates'
    END as array_status
FROM products
WHERE deleted_at IS NULL;
```

**Test: Invalid Certificate ID in Array**
- [ ] Manually insert invalid ID into product.certificate_ids array via SQL:
```sql
UPDATE products 
SET certificate_ids = '[1, 9999, 3]'::jsonb 
WHERE id = <test_product_id>;
```
- [ ] View product in admin
- [ ] **Verify:** Form handles missing certificate gracefully (skip or show warning)
- [ ] Edit and save product
- [ ] **Verify:** Invalid IDs removed or validation prevents save

### 9.5 Hierarchical Category Edge Cases

**Test: Category Parent Loop Prevention**
- [ ] Create category "Parent"
- [ ] Create child "Child" under "Parent"
- [ ] Try to set "Parent"'s parent to "Child" (creates loop)
- [ ] **Verify:** Validation prevents circular reference
- [ ] **Verify:** Error message clear

**Test: Deep Nesting (5+ Levels)**
- [ ] Create category hierarchy: L1 → L2 → L3 → L4 → L5 → L6
- [ ] **Verify:** All levels display correctly
- [ ] **Verify:** fullPath shows all segments
- [ ] Move L6 to L1 (flatten hierarchy)
- [ ] **Verify:** fullPath and level recalculated

**SQL Verification:**
```sql
-- Find maximum category depth
WITH RECURSIVE category_depth AS (
    SELECT id, name, parent_id, 0 as depth, full_path
    FROM categories
    WHERE parent_id IS NULL AND deleted_at IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, cd.depth + 1, c.full_path
    FROM categories c
    INNER JOIN category_depth cd ON c.parent_id = cd.id
    WHERE c.deleted_at IS NULL
)
SELECT MAX(depth) as max_depth, AVG(depth) as avg_depth
FROM category_depth;

-- Find potential circular references
SELECT c1.id, c1.name, c1.parent_id, c2.name as parent_name, c2.parent_id as grandparent_id
FROM categories c1
LEFT JOIN categories c2 ON c1.parent_id = c2.id
WHERE c1.id = c2.parent_id OR c1.id IN (
    SELECT parent_id FROM categories WHERE id = c1.parent_id
);
```

### 9.6 Duplicate Prevention Edge Cases

**Test: Case-Insensitive Duplicate Names**
- [ ] Create fiber "Organic Cotton"
- [ ] Try to create "ORGANIC COTTON"
- [ ] **Verify:** Duplicate check is case-insensitive
- [ ] Try "organic cotton"
- [ ] **Verify:** Also blocked

**Test: Leading/Trailing Whitespace**
- [ ] Create accessory with name " ZipperTest " (spaces)
- [ ] **Verify:** Name trimmed to "ZipperTest" OR saved with spaces
- [ ] Try to create "ZipperTest" (no spaces)
- [ ] **Verify:** Duplicate detection works regardless of whitespace

### 9.7 Media Selection Edge Cases

**Test: Selecting Wrong Media Type**
- [ ] On certificates page, click "Select Document"
- [ ] From media library, select image instead of PDF
- [ ] **Verify:** Either filtered to show only documents OR warning shown
- [ ] Save certificate
- [ ] **Verify:** Document field accepts image (no validation) OR rejects with error

**Test: Deleted Media Still Referenced**
- [ ] Assign media asset to product
- [ ] Delete media asset from database (bypass UI):
```sql
DELETE FROM media_assets WHERE id = <media_id>;
```
- [ ] View product with orphaned media reference
- [ ] **Verify:** Graceful fallback (placeholder image or "Missing media")
- [ ] Edit and save product
- [ ] **Verify:** Orphaned reference cleaned up

### 9.8 Transaction Rollback Scenarios

**Test: Failed Product Creation (Partial Data)**
- [ ] Create product with all fields
- [ ] Before save, disconnect internet (simulate network failure)
- [ ] Click Save
- [ ] **Verify:** Error toast shows
- [ ] **Verify:** No partial data in database
- [ ] Reconnect and retry
- [ ] **Verify:** Full product created

**SQL Verification:**
```sql
-- Check for incomplete products (missing required fields after creation)
SELECT id, name, sku, price, category_id, created_at
FROM products
WHERE deleted_at IS NULL
AND (sku IS NULL OR price IS NULL OR category_id IS NULL);
```

---

## 10. Integration Flow Testing

These tests validate complete end-to-end workflows across multiple admin pages, ensuring relationships work correctly in real-world scenarios.

### Integration Flow 1: Complete Product Setup

**Scenario:** New product line from scratch

- [ ] **Step 1 - Create Fibers:**
  - Navigate to /admin/fibers
  - Create "Recycled Polyester" (type: synthetic, sustainability: 5)
  - Create "Organic Cotton" (type: natural, sustainability: 5)
  - **Verify:** Both fibers active

- [ ] **Step 2 - Create Fabric:**
  - Navigate to /admin/fabrics
  - Create "EcoBlend Performance"
  - Add composition: 70% Recycled Polyester, 30% Organic Cotton
  - Select visual swatch from media library
  - **Verify:** Fiber relationship displays correctly

- [ ] **Step 3 - Create Certificates:**
  - Navigate to /admin/certificates
  - Create "GOTS Certified" (type: sustainability)
  - Upload certificate document PDF
  - Create "Bluesign Approved" (type: environmental)
  - **Verify:** Both certificates active

- [ ] **Step 4 - Create Size Chart:**
  - Navigate to /admin/size-charts
  - Create "Unisex Athletic Sizing" (region: US, type: apparel)
  - Fill measurements for S, M, L, XL
  - **Verify:** Chart complete

- [ ] **Step 5 - Create Accessories:**
  - Navigate to /admin/accessories
  - Create "Reflective Piping" (category: trim, SKU: ACC-REF-001)
  - Create "Moisture-Wicking Label" (category: customization, SKU: ACC-LBL-002)
  - **Verify:** Both accessories with unique SKUs

- [ ] **Step 6 - Create Category:**
  - Navigate to /admin/categories
  - Create "Sustainable Performance Wear" (slug: sustainable-performance)
  - Set featured on homepage: true
  - **Verify:** Category created

- [ ] **Step 7 - Create Product:**
  - Navigate to /admin/products
  - Create "EcoRun Training Shirt"
  - SKU: ECRT-001, Price: 49.99
  - Assign category: "Sustainable Performance Wear"
  - Assign fabric: "EcoBlend Performance"
  - Assign size chart: "Unisex Athletic Sizing"
  - Select certificates: ["GOTS Certified", "Bluesign Approved"]
  - Select accessories: ["Reflective Piping", "Moisture-Wicking Label"]
  - Upload product images, video, 3D model
  - **Verify:** Product created with ALL relationships

- [ ] **Step 8 - Verify Complete Relationships:**
  - View product in admin
  - **Verify:** Fiber breakdown shows (via fabric)
  - **Verify:** Certificate badges display
  - **Verify:** Size chart preview available
  - **Verify:** Accessories listed
  - **Verify:** Media gallery functional

**SQL Integration Verification:**
```sql
-- Comprehensive relationship check for created product
SELECT 
    p.id, p.name as product_name, p.sku,
    c.name as category_name,
    f.name as fabric_name,
    sc.name as size_chart_name,
    p.certificate_ids,
    p.accessory_ids,
    (SELECT COUNT(*) FROM jsonb_array_elements(p.image_ids)) as image_count,
    p.primary_video_id IS NOT NULL as has_video,
    p.model_file_id IS NOT NULL as has_3d_model
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN fabrics f ON p.fabric_id = f.id
LEFT JOIN size_charts sc ON p.size_chart_id = sc.id
WHERE p.sku = 'ECRT-001';

-- Verify fabric composition traces back to fibers
SELECT 
    f.id, f.name as fabric_name,
    f.composition,
    fi.name as fiber_name,
    fi.sustainability_score
FROM fabrics f
CROSS JOIN LATERAL jsonb_each_text(f.composition::jsonb) comp(fiber_name, percentage)
LEFT JOIN fibers fi ON fi.name = comp.fiber_name
WHERE f.name = 'EcoBlend Performance';
```

### Integration Flow 2: Product Category Migration

**Scenario:** Reorganize products into new category structure

- [ ] **Setup:**
  - Create old category "General Apparel"
  - Create 3 products in "General Apparel"
  - Create new parent category "Premium Line"
  - Create child category "Premium Performance" under "Premium Line"

- [ ] **Migration:**
  - Edit first product
  - Change category from "General Apparel" to "Premium Performance"
  - **Verify:** categoryPath updates to "/premium-line/premium-performance"
  - Bulk select remaining 2 products
  - Bulk update category (if available)
  - **Verify:** All 3 products now under "Premium Performance"

- [ ] **Cleanup:**
  - Try to delete old "General Apparel" category
  - **Verify:** Deletion succeeds (no products using it)
  - **Verify:** Products still accessible under new category

**SQL Integration Verification:**
```sql
-- Verify category migration completed
SELECT 
    p.id, p.name, p.category_path,
    c.full_path as actual_category_path,
    p.category_path = c.full_path as path_match
FROM products p
INNER JOIN categories c ON p.category_id = c.id
WHERE c.full_path LIKE '%premium-performance%';

-- Check no products remain in old category
SELECT COUNT(*) as orphaned_products
FROM products
WHERE category_id IN (
    SELECT id FROM categories WHERE name = 'General Apparel'
) AND deleted_at IS NULL;
```

### Integration Flow 3: Fabric Update Propagation

**Scenario:** Update fabric and verify product reflects changes

- [ ] **Setup:**
  - Create fabric "TechMesh v1" with swatch image A
  - Create product "TechShirt" using "TechMesh v1"

- [ ] **Update Fabric:**
  - Edit "TechMesh v1"
  - Change visual swatch to image B
  - Update sustainability score from 3 to 5
  - Add new certification
  - Save

- [ ] **Verify Propagation:**
  - Navigate to product "TechShirt"
  - **Verify:** New swatch image B displays
  - **Verify:** Updated sustainability score shows
  - **Verify:** New certification appears in product details
  - **Verify:** No cache staleness (refresh if needed)

**SQL Integration Verification:**
```sql
-- Check fabric changes reflected in product context
SELECT 
    p.id, p.name as product_name,
    f.name as fabric_name, f.sustainability_score,
    m.filename as swatch_filename, m.url as swatch_url,
    f.certifications
FROM products p
INNER JOIN fabrics f ON p.fabric_id = f.id
LEFT JOIN media_assets m ON f.visual_swatch_id = m.id
WHERE f.name = 'TechMesh v1';
```

### Integration Flow 4: Certificate Expiry Impact

**Scenario:** Certificate expires and product shows warning

- [ ] **Setup:**
  - Create certificate "ISO 9001:2023" with expiry date = tomorrow
  - Create product "QualityProduct" with this certificate

- [ ] **Wait for Expiry:**
  - Manually set certificate expiry to yesterday:
```sql
UPDATE certificates 
SET expiry_date = CURRENT_DATE - 1 
WHERE name = 'ISO 9001:2023';
```
  - Refresh product page

- [ ] **Verify Impact:**
  - View product with expired certificate
  - **Verify:** Certificate shows "Expired" badge or warning
  - **Verify:** Product still displays but with indicator
  - Edit product
  - **Verify:** Expired certificates highlighted in form

---

## 11. Performance Benchmarks & Load Testing

This section defines acceptable performance metrics and load testing scenarios to ensure admin operations scale properly.

### 11.1 Response Time Benchmarks

**Page Load Times (Target: < 3 seconds):**

| Page | Target Load Time | Max Records | Acceptable Range |
|------|-----------------|-------------|------------------|
| /admin/fibers | < 1.5s | 100 fibers | 0.5s - 2s |
| /admin/fabrics | < 2.0s | 200 fabrics | 1s - 3s |
| /admin/certificates | < 1.0s | 50 certs | 0.5s - 1.5s |
| /admin/size-charts | < 1.0s | 30 charts | 0.5s - 1.5s |
| /admin/accessories | < 1.5s | 150 accessories | 0.8s - 2s |
| /admin/categories | < 1.5s | 50 categories | 0.8s - 2s |
| /admin/products | < 3.0s | 500 products | 1.5s - 4s |

**CRUD Operation Times (Target: < 2 seconds):**

| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Create fiber | < 500ms | Simple JSONB properties |
| Create fabric | < 1s | With composition |
| Create product | < 2s | With all relationships |
| Update product | < 1.5s | Partial fields only |
| Delete (soft) | < 300ms | Set deleted_at timestamp |
| Bulk delete (10 items) | < 2s | Sequential soft deletes |
| Bulk update (10 items) | < 3s | Parallel updates preferred |

**Search & Filter Times (Target: < 1 second):**

| Filter Operation | Target Time | Test Data Size |
|------------------|-------------|----------------|
| Text search (fibers) | < 500ms | 100 fibers |
| Multi-filter (products) | < 1s | 500 products |
| Category tree render | < 800ms | 50 categories, 5 levels |
| Certificate type filter | < 300ms | 50 certificates |

### 11.2 Database Query Performance

**Index Usage Verification:**

```sql
-- Test SKU index on products (should use index scan)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM products WHERE sku = 'TEST-SKU-001';
-- Expected: Index Scan using products_sku_idx (cost < 10, time < 1ms)

-- Test hot query index (homepage products)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM products
WHERE deleted_at IS NULL AND is_active = true
ORDER BY created_at DESC
LIMIT 12;
-- Expected: Index Scan using products_hot_query_idx (cost < 50, time < 5ms)

-- Test category fullPath index
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM categories
WHERE full_path LIKE '/performance-wear%';
-- Expected: Index Scan using categories_full_path_idx (cost < 20, time < 2ms)
```

**Complex Query Performance:**

```sql
-- Test product with all relationships (should complete < 50ms)
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    p.*, c.name as category_name, f.name as fabric_name,
    sc.name as size_chart_name
FROM products p
INNER JOIN categories c ON p.category_id = c.id
LEFT JOIN fabrics f ON p.fabric_id = f.id
LEFT JOIN size_charts sc ON p.size_chart_id = sc.id
WHERE p.id = 1;
-- Expected: Nested Loop join (cost < 100, time < 50ms)

-- Test JSONB array expansion performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.name, cert_id
FROM products p,
LATERAL jsonb_array_elements_text(p.certificate_ids) cert_id
WHERE p.deleted_at IS NULL
LIMIT 100;
-- Expected: Function Scan (cost < 200, time < 100ms)
```

### 11.3 Load Testing Scenarios

**Scenario 1: Concurrent Admin Users (5 users)**

Test with 5 simultaneous admin sessions:

- [ ] User 1: Creating 10 new fibers sequentially
- [ ] User 2: Editing existing fabrics (10 edits)
- [ ] User 3: Bulk deleting 20 accessories
- [ ] User 4: Creating new product with full relationships
- [ ] User 5: Browsing products with filters

**Performance Metrics:**
- [ ] **Verify:** No database connection exhaustion
- [ ] **Verify:** NEON connection count < 10 concurrent
- [ ] **Verify:** All operations complete within 2x normal time
- [ ] **Verify:** No data corruption from race conditions

**SQL Monitoring:**
```sql
-- Check active connections during load test
SELECT 
    state, COUNT(*) as connection_count, 
    MAX(NOW() - query_start) as longest_query
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;
-- Expected: < 10 active, longest_query < 30s
```

**Scenario 2: Bulk Data Import**

Simulate initial data load:

- [ ] Create 50 fibers via API (batch)
- [ ] Create 100 fabrics referencing fibers
- [ ] Create 20 certificates with media
- [ ] Create 300 products with relationships

**Performance Metrics:**
- [ ] **Verify:** Fiber batch (50) completes < 5s
- [ ] **Verify:** Fabric batch (100) completes < 15s
- [ ] **Verify:** Product batch (300) completes < 60s
- [ ] **Verify:** No memory leaks in Node process
- [ ] **Verify:** NEON connection pooling working (reuse connections)

**SQL Verification:**
```sql
-- Check for connection pooling efficiency
SELECT 
    numbackends as active_connections,
    xact_commit as transactions_committed,
    xact_rollback as transactions_rolled_back,
    blks_read as blocks_read_from_disk,
    blks_hit as blocks_read_from_cache,
    ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) as cache_hit_ratio
FROM pg_stat_database
WHERE datname = current_database();
-- Expected: cache_hit_ratio > 90%
```

**Scenario 3: Large Product Catalog Performance**

Test with realistic production data:

- [ ] Seed database with:
  - 100 fibers
  - 300 fabrics
  - 50 certificates
  - 1000 products (with all relationships)

- [ ] Performance Tests:
  - [ ] Load /admin/products page
  - [ ] **Verify:** Initial load < 5s
  - [ ] Apply category filter
  - [ ] **Verify:** Filter response < 1s
  - [ ] Search for "performance"
  - [ ] **Verify:** Search results < 2s
  - [ ] Open product edit modal
  - [ ] **Verify:** Form loads < 1.5s

**SQL Seeding Script:**
```sql
-- Create test data for performance benchmarking
-- (Run in development only)

-- Seed 100 fibers
INSERT INTO fibers (name, type, sustainability_score, is_active)
SELECT 
    'Fiber_' || generate_series,
    (ARRAY['natural', 'synthetic', 'blended'])[1 + MOD(generate_series, 3)],
    1 + MOD(generate_series, 5),
    true
FROM generate_series(1, 100);

-- Seed 300 fabrics (referencing random fibers)
INSERT INTO fabrics (name, weight, is_active)
SELECT 
    'Fabric_' || generate_series,
    100 + (generate_series * 5),
    true
FROM generate_series(1, 300);

-- Seed 1000 products (with random categories)
INSERT INTO products (name, sku, price, category_id, is_active)
SELECT 
    'Product_' || generate_series,
    'SKU-' || LPAD(generate_series::text, 6, '0'),
    19.99 + (generate_series * 0.5),
    (SELECT id FROM categories WHERE deleted_at IS NULL ORDER BY random() LIMIT 1),
    true
FROM generate_series(1, 1000);
```

### 11.4 NEON-Specific Optimizations

**Connection Pooling Test:**

- [ ] Configure connection pool: min 2, max 10 connections
- [ ] Run 20 concurrent product creations
- [ ] **Verify:** Connection reuse (not creating 20 new connections)
- [ ] **Verify:** No "too many connections" errors
- [ ] **Verify:** Average connection lifetime > 5 minutes

**SQL Verification:**
```sql
-- Monitor connection pool usage
SELECT 
    application_name,
    state,
    COUNT(*) as connection_count,
    MAX(backend_start) as newest_connection,
    MIN(backend_start) as oldest_connection
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY application_name, state;
```

**Serverless Cold Start Impact:**

- [ ] Wait 5+ minutes of inactivity (NEON auto-suspend)
- [ ] Make first API call to /api/products
- [ ] **Measure:** Cold start latency
- [ ] **Expected:** First request < 3s (includes DB wake-up)
- [ ] Make second request immediately
- [ ] **Verify:** Warm request < 1s

**Query Cost Monitoring:**

```sql
-- Find expensive queries (> 1000 cost)
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- milliseconds
ORDER BY mean_exec_time DESC
LIMIT 10;
-- Note: Requires pg_stat_statements extension
```

### 11.5 Performance Acceptance Criteria

**Pass Criteria for Production Readiness:**

- [ ] All page load times within acceptable range (see table above)
- [ ] All CRUD operations complete within target times
- [ ] Database query explain plans use indexes (no sequential scans on large tables)
- [ ] Bulk operations (10+ items) complete without timeout
- [ ] Concurrent user scenario (5 users) shows no data corruption
- [ ] Cache hit ratio > 90% under load
- [ ] NEON connection count stays < 10 during normal operations
- [ ] Search/filter operations < 1s with realistic data volumes
- [ ] No memory leaks after 100+ operations
- [ ] Cold start (NEON wake-up) < 3s

**Monitoring & Alerts (Post-Launch):**

- [ ] Set up query performance monitoring (log slow queries > 1s)
- [ ] Alert on NEON connection exhaustion (>8 concurrent)
- [ ] Monitor cache hit ratio (alert if < 85%)
- [ ] Track P95 response times for each admin page
- [ ] Log failed bulk operations for investigation

---

**Total Estimated Time:** ~2.5 hours for complete testing

---

**End of Testing Plan**

*Generated: October 19, 2025*
*Database: NEON PostgreSQL via Drizzle ORM*
*Connection: `src/db/index.ts`*
