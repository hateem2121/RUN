# Database Schema Reference

> **Generated on:** 2026-02-03
> **Source:** `shared/schema/`

---

## Module: catalog.ts

### Table: certificates

| Column | Drizzle Type | Constraints |
| :--- | :--- | :--- |
| `id` | `serial` | PRIMARY KEY |
| `name` | `varchar` | NOT NULL |
| `type` | `varchar` | - |
| `issuingOrganization` | `varchar` | - |
| `description` | `text` | - |
| `certificateNumber` | `varchar` | - |
| `issueDate` | `timestamp` | - |
| `expiryDate` | `timestamp` | - |
| `imageId` | `integer` | - |
| `documentId` | `integer` | - |
| `issuingBody` | `varchar` | - |
| `documentUrl` | `varchar` | - |
| `imageUrl` | `varchar` | - |
| `status` | `varchar` | - |
| `showOnSustainabilityPage` | `boolean` | - |
| `isActive` | `boolean` | - |
| `deletedAt` | `timestamp` | - |

### Table: size_charts

| Column | Drizzle Type | Constraints |
| :--- | :--- | :--- |
| `id` | `serial` | PRIMARY KEY |
| `name` | `varchar` | NOT NULL |
| `description` | `text` | - |
| `category` | `varchar` | - |
| `gender` | `varchar` | - |
| `type` | `varchar` | - |
| `region` | `varchar` | - |
| `measurements` | `jsonb` | - |
| `sizeRange` | `jsonb` | - |
| `unit` | `varchar` | - |
| `fitNotes` | `text` | - |
| `imageId` | `integer` | - |
| `isActive` | `boolean` | - |
| `deletedAt` | `timestamp` | - |

### Table: accessories

| Column | Drizzle Type | Constraints |
| :--- | :--- | :--- |
| `id` | `serial` | PRIMARY KEY |
| `name` | `varchar` | NOT NULL |
| `description` | `text` | - |
| `category` | `varchar` | - |
| `type` | `varchar` | - |
| `material` | `varchar` | - |
| `color` | `varchar` | - |
| `size` | `varchar` | - |
| `sku` | `varchar` | - |
| `price` | `decimal` | - |
| `imageId` | `integer` | - |
| `specifications` | `jsonb` | - |
| `isActive` | `boolean` | - |
| `deletedAt` | `timestamp` | - |

## Module: categories.ts

### Table: categories

| Column | Drizzle Type | Constraints |
| :--- | :--- | :--- |
| `id` | `serial` | PRIMARY KEY |
| `name` | `varchar` | NOT NULL |
| `slug` | `varchar` | NOT NULL |
| `description` | `text` | - |
| `parentId` | `integer` | - |
| `primaryImageId` | `integer` | - |

## Module: materials.ts

### Table: fabrics

| Column | Drizzle Type | Constraints |
| :--- | :--- | :--- |
| `id` | `serial` | PRIMARY KEY |
| `name` | `varchar` | NOT NULL |
| `description` | `text` | - |
| `fabricType` | `varchar` | - |
| `sport` | `text` | - |
| `marketSegment` | `text` | - |
| `seasonality` | `text` | - |
| `weight` | `varchar` | - |
| `weave` | `varchar` | - |
| `weaveType` | `varchar` | - |
| `weaveTypes` | `jsonb` | - |
| `stretch` | `varchar` | - |
| `finishTreatment` | `varchar` | - |
| `properties` | `jsonb` | - |
| `careInstructions` | `text` | - |
| `sustainabilityScore` | `integer` | - |
| `certifications` | `jsonb` | - |
| `visualSwatchId` | `integer` | - |
| `keyApplications` | `jsonb` | - |
| `isActive` | `boolean` | - |
| `deletedAt` | `timestamp` | - |

### Table: fibers

| Column | Drizzle Type | Constraints |
| :--- | :--- | :--- |
| `id` | `serial` | PRIMARY KEY |
| `name` | `varchar` | NOT NULL |
| `type` | `varchar` | NOT NULL |
| `description` | `text` | - |
| `sustainabilityScore` | `integer` | - |
| `environmentalImpact` | `text` | - |
| `properties` | `jsonb` | - |
| `isActive` | `boolean` | - |
| `deletedAt` | `timestamp` | - |

## Module: media.ts

### Table: folders

| Column | Drizzle Type | Constraints |
| :--- | :--- | :--- |
| `id` | `serial` | PRIMARY KEY |
| `name` | `varchar` | NOT NULL |
| `description` | `text` | - |
| `parentId` | `integer` | - |
| `path` | `varchar` | - |
| `level` | `integer` | - |
| `isActive` | `boolean` | - |
| `sortOrder` | `integer` | - |
| `deletedAt` | `timestamp` | - |
| `id` | `serial` | PRIMARY KEY |
| `filename` | `varchar` | NOT NULL |
| `originalName` | `varchar` | - |
| `fileSize` | `integer` | - |
| `size` | `integer` | - |
| `mimeType` | `varchar` | NOT NULL |
| `type` | `varchar` | NOT NULL |
| `url` | `text` | NOT NULL |
| `thumbnailUrl` | `text` | - |
| `thumbnailFilename` | `varchar` | - |
| `thumbnailStoragePath` | `text` | - |
| `imageVariants` | `jsonb` | - |
| `storagePath` | `text` | NOT NULL |
| `bucketName` | `varchar` | NOT NULL |
| `folderId` | `integer` | - |
| `tags` | `jsonb` | - |
| `altText` | `text` | - |
| `caption` | `text` | - |
| `metadata` | `jsonb` | NOT NULL |
| `isActive` | `boolean` | - |
| `deletedAt` | `timestamp` | - |

## Module: products.ts

### Table: products

| Column | Drizzle Type | Constraints |
| :--- | :--- | :--- |
| `id` | `serial` | PRIMARY KEY |
| `name` | `varchar` | NOT NULL |
| `slug` | `varchar` | NOT NULL, UNIQUE |
| `description` | `text` | - |
| `shortDescription` | `text` | - |
| `categoryId` | `integer` | - |
| `primaryImageId` | `integer` | - |
| `primaryVideoId` | `integer` | - |
| `modelFileId` | `integer` | - |
| `sku` | `varchar` | NOT NULL |
| `minimumOrderQuantity` | `integer` | - |
| `leadTime` | `varchar` | - |
| `specifications` | `jsonb` | - |
| `technicalSpecs` | `jsonb` | - |
| `fiberComposition` | `jsonb` | - |
| `tags` | `jsonb` | - |
| `careInstructions` | `jsonb` | - |
| `imageIds` | `jsonb` | - |
| `videos` | `jsonb` | - |
| `urlPath` | `varchar` | - |
| `customWeight` | `varchar` | - |
| `customFit` | `varchar` | - |
| `customizationOptions` | `jsonb` | - |
| `fabricId` | `integer` | - |
| `sizeChartId` | `integer` | - |
| `certificateIds` | `jsonb` | - |
| `accessoryIds` | `jsonb` | - |
| `relatedProductIds` | `jsonb` | - |
| `metaTitle` | `varchar` | - |
| `metaDescription` | `text` | - |
| `metadata` | `jsonb` | - |
| `isActive` | `boolean` | - |
| `isFeatured` | `boolean` | - |
| `deletedAt` | `timestamp` | - |

## Module: users.ts

### Table: sessions

| Column | Drizzle Type | Constraints |
| :--- | :--- | :--- |
| `sid` | `varchar` | PRIMARY KEY |
| `sess` | `jsonb` | NOT NULL |
| `expire` | `timestamp` | NOT NULL |

