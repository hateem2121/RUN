// @ts-nocheck
import { storage } from "../server/storage.js";

async function performDatabaseDiagnostic() {
  console.log("=== COMPREHENSIVE DATABASE DIAGNOSTIC ===\n");

  const entities = [
    { name: "Categories", method: "getCategories" },
    { name: "Fibers", method: "getFibers" },
    { name: "Fabrics", method: "getFabrics" },
    { name: "Products", method: "getProducts" },
    { name: "Certificates", method: "getCertificates" },
    { name: "Size Charts", method: "getSizeCharts" },
    { name: "Accessories", method: "getAccessories" },
    { name: "Media Assets", method: "getMediaAssets" },
    { name: "Navigation Items", method: "getNavigationItems" },
    { name: "Footer Sections", method: "getFooterSections" },
    { name: "Footer Links", method: "getFooterLinks" },
    { name: "Homepage Hero", method: "getHomepageHero" },
    { name: "Homepage Slogans", method: "getHomepageSlogans" },
    { name: "Homepage Process Cards", method: "getHomepageProcessCards" },
    { name: "Homepage Sections", method: "getHomepageSections" },
  ];

  let totalIssues = 0;
  let workingEndpoints = 0;

  for (const entity of entities) {
    try {
      console.log(`\n--- ${entity.name} ---`);
      const data = await (storage as any)[entity.method]();

      if (Array.isArray(data)) {
        console.log(`✅ ${entity.name}: ${data.length} items`);
        if (data.length > 0) {
          console.log(
            `   Sample: ${data[0].name || data[0].title || data[0].id || "No identifiable field"}`,
          );
          workingEndpoints++;
        } else {
          console.log(`❌ ${entity.name}: Empty array (no data)`);
          totalIssues++;
        }
      } else if (data && typeof data === "object") {
        console.log(`✅ ${entity.name}: Object with ${Object.keys(data).length} properties`);
        workingEndpoints++;
      } else {
        console.log(`❌ ${entity.name}: No data returned`);
        totalIssues++;
      }
    } catch (error) {
      console.log(`❌ ${entity.name}: ERROR - ${error.message}`);
      totalIssues++;
    }
  }

  console.log(`\n=== DIAGNOSTIC SUMMARY ===`);
  console.log(`Working endpoints: ${workingEndpoints}`);
  console.log(`Endpoints with issues: ${totalIssues}`);
  console.log(`Total endpoints tested: ${entities.length}`);

  if (totalIssues > 0) {
    console.log(`\n🔧 RECOMMENDED ACTIONS:`);
    console.log(`1. Check database connection and initialization`);
    console.log(`2. Verify ReplitStorage implementation for empty endpoints`);
    console.log(`3. Check if data import scripts are needed for empty entities`);
    console.log(`4. Investigate potential database corruption or migration issues`);
  }
}

// Run the diagnostic
performDatabaseDiagnostic().catch(console.error);
