# Routes Inventory - RUN-Remix B2B Platform

**Generated**: December 23, 2025  
**Source**: [App.tsx](file:///Users/hateemjamshaid/Downloads/RUN-Remix/client/src/App.tsx#L175-L265)

## Route Discovery Methodology

- **Primary Source**: Static route definitions in `App.tsx` Switch component (lines 175-265)
- **Dynamic Routes**: Product detail pages use hierarchical URL patterns with category/subcategory/product slugs
- **Admin Routes**: All render the same `Admin` component with different internal tab selection

---

## Public Routes (No Auth Required)

| Route Pattern       | Example URL                              | Component        | Theme Modes |      Breakpoints      |
| :------------------ | :--------------------------------------- | :--------------- | :---------: | :-------------------: |
| `/`                 | http://localhost:5001/                   | Homepage         | light/dark  | mobile/tablet/desktop |
| `/products`         | http://localhost:5001/products           | ProductShowcase  | light/dark  | mobile/tablet/desktop |
| `/categories`       | http://localhost:5001/categories         | Categories       | light/dark  | mobile/tablet/desktop |
| `/categories/:slug` | http://localhost:5001/categories/jerseys | CategoryRedirect | light/dark  | mobile/tablet/desktop |
| `/about`            | http://localhost:5001/about              | About            | light/dark  | mobile/tablet/desktop |
| `/services`         | http://localhost:5001/services           | Services         | light/dark  | mobile/tablet/desktop |
| `/sustainability`   | http://localhost:5001/sustainability     | Sustainability   | light/dark  | mobile/tablet/desktop |
| `/manufacturing`    | http://localhost:5001/manufacturing      | Manufacturing    | light/dark  | mobile/tablet/desktop |
| `/technology`       | http://localhost:5001/technology         | Technology       | light/dark  | mobile/tablet/desktop |
| `/contact`          | http://localhost:5001/contact            | Contact          | light/dark  | mobile/tablet/desktop |
| `/dashboard`        | http://localhost:5001/dashboard          | Dashboard        | light/dark  | mobile/tablet/desktop |
| `/analytics`        | http://localhost:5001/analytics          | Analytics        | light/dark  | mobile/tablet/desktop |

## Resource Routes (No Auth Required)

| Route Pattern               | Example URL                                    | Component      | Theme Modes |      Breakpoints      |
| :-------------------------- | :--------------------------------------------- | :------------- | :---------: | :-------------------: |
| `/resources`                | http://localhost:5001/resources                | Resources      | light/dark  | mobile/tablet/desktop |
| `/resources/certifications` | http://localhost:5001/resources/certifications | Certifications | light/dark  | mobile/tablet/desktop |
| `/resources/accessories`    | http://localhost:5001/resources/accessories    | Accessories    | light/dark  | mobile/tablet/desktop |
| `/resources/size-charts`    | http://localhost:5001/resources/size-charts    | SizeCharts     | light/dark  | mobile/tablet/desktop |
| `/resources/fabrics`        | http://localhost:5001/resources/fabrics        | Fabrics        | light/dark  | mobile/tablet/desktop |
| `/resources/fibers`         | http://localhost:5001/resources/fibers         | Fibers         | light/dark  | mobile/tablet/desktop |

## Dynamic Product Routes

| Route Pattern                               | Example URL                                                           | Component             | Theme Modes |      Breakpoints      |
| :------------------------------------------ | :-------------------------------------------------------------------- | :-------------------- | :---------: | :-------------------: |
| `/categories/:cat/:subcat/:subsub/:product` | http://localhost:5001/categories/apparel/jerseys/cycling/pro-jersey-1 | EnhancedProductDetail | light/dark  | mobile/tablet/desktop |
| `/categories/:cat/:subcat/:product`         | http://localhost:5001/categories/apparel/jerseys/pro-jersey-1         | EnhancedProductDetail | light/dark  | mobile/tablet/desktop |
| `/categories/:cat/:product`                 | http://localhost:5001/categories/apparel/pro-jersey-1                 | EnhancedProductDetail | light/dark  | mobile/tablet/desktop |

## Admin Routes (Protected - Auth May Be Required)

| Route Pattern                 | Example URL                                      | Component | Theme Modes | Breakpoints |
| :---------------------------- | :----------------------------------------------- | :-------- | :---------: | :---------: |
| `/admin`                      | http://localhost:5001/admin                      | Admin     | light/dark  |   desktop   |
| `/admin/products`             | http://localhost:5001/admin/products             | Admin     | light/dark  |   desktop   |
| `/admin/categories`           | http://localhost:5001/admin/categories           | Admin     | light/dark  |   desktop   |
| `/admin/media`                | http://localhost:5001/admin/media                | Admin     | light/dark  |   desktop   |
| `/admin/fabrics`              | http://localhost:5001/admin/fabrics              | Admin     | light/dark  |   desktop   |
| `/admin/fibers`               | http://localhost:5001/admin/fibers               | Admin     | light/dark  |   desktop   |
| `/admin/certificates`         | http://localhost:5001/admin/certificates         | Admin     | light/dark  |   desktop   |
| `/admin/size-charts`          | http://localhost:5001/admin/size-charts          | Admin     | light/dark  |   desktop   |
| `/admin/accessories`          | http://localhost:5001/admin/accessories          | Admin     | light/dark  |   desktop   |
| `/admin/navigation`           | http://localhost:5001/admin/navigation           | Admin     | light/dark  |   desktop   |
| `/admin/contact`              | http://localhost:5001/admin/contact              | Admin     | light/dark  |   desktop   |
| `/admin/homepage`             | http://localhost:5001/admin/homepage             | Admin     | light/dark  |   desktop   |
| `/admin/about`                | http://localhost:5001/admin/about                | Admin     | light/dark  |   desktop   |
| `/admin/sustainability`       | http://localhost:5001/admin/sustainability       | Admin     | light/dark  |   desktop   |
| `/admin/manufacturing`        | http://localhost:5001/admin/manufacturing        | Admin     | light/dark  |   desktop   |
| `/admin/technology`           | http://localhost:5001/admin/technology           | Admin     | light/dark  |   desktop   |
| `/admin/storage-optimization` | http://localhost:5001/admin/storage-optimization | Admin     | light/dark  |   desktop   |
| `/admin/test-runner`          | http://localhost:5001/admin/test-runner          | Admin     | light/dark  |   desktop   |
| `/admin/inquiries`            | http://localhost:5001/admin/inquiries            | Admin     | light/dark  |   desktop   |
| `/admin/footer`               | http://localhost:5001/admin/footer               | Admin     | light/dark  |   desktop   |

## Utility Routes

| Route Pattern  | Example URL                       | Component      | Theme Modes |      Breakpoints      |
| :------------- | :-------------------------------- | :------------- | :---------: | :-------------------: |
| `/e2e-overlay` | http://localhost:5001/e2e-overlay | E2EOverlayTest |    light    |        desktop        |
| `*` (404)      | http://localhost:5001/nonexistent | NotFound       | light/dark  | mobile/tablet/desktop |

---

## Test Matrix Summary

| Category         | Route Count | Theme Variants | Breakpoint Variants | Total Screenshots |
| :--------------- | :---------: | :------------: | :-----------------: | :---------------: |
| Public           |     12      |       2        |          3          |        72         |
| Resources        |      6      |       2        |          3          |        36         |
| Dynamic Products | 3 (samples) |       2        |          3          |        18         |
| Admin            |     20      |       2        |  1 (desktop only)   |        40         |
| Utility          |      2      |       1        |          1          |         2         |
| **Total**        |   **43**    |       -        |          -          |      **168**      |

---

## Breakpoint Definitions

| Breakpoint | Viewport Width | Device Type |
| :--------- | :------------: | :---------- |
| Mobile     |     375px      | iPhone SE   |
| Tablet     |     768px      | iPad        |
| Desktop    |     1280px     | Laptop      |
