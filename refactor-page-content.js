import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const serverDir = path.join(projectRoot, "server");

const _repositoryMap = {
  Homepage: "homepageRepository",
  About: "aboutRepository",
  Sustainability: "sustainabilityRepository",
  Manufacturing: "manufacturingRepository",
  Technology: "technologyRepository",
};

// Also 'UnifiedSustainability' -> sustainabilityRepository
// 'LogoAnimationSettings' -> homepageRepository

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;

  // 1. Replace pageContentRepository.getHomepage... with homepageRepository.getHomepage...
  content = content.replace(
    /pageContentRepository\.([a-zA-Z]+)(Homepage|ProcessCard|LogoAnimationSettings|FeaturedProductSettings)(.*?)/g,
    "homepageRepository.$1$2$3",
  );
  content = content.replace(
    /pageContentRepository\.([a-zA-Z]+)(About)(.*?)/g,
    "aboutRepository.$1$2$3",
  );
  content = content.replace(
    /pageContentRepository\.([a-zA-Z]+)(Sustainability)(.*?)/g,
    "sustainabilityRepository.$1$2$3",
  );
  content = content.replace(
    /pageContentRepository\.([a-zA-Z]+)(Manufacturing)(.*?)/g,
    "manufacturingRepository.$1$2$3",
  );
  content = content.replace(
    /pageContentRepository\.([a-zA-Z]+)(Technology)(.*?)/g,
    "technologyRepository.$1$2$3",
  );

  // Fix some edge cases:
  content = content.replace(
    /pageContentRepository\.(migrateLegacySustainabilityData)\(/g,
    "sustainabilityRepository.$1(",
  );

  if (content !== originalContent) {
    // 2. We need to fix imports if we replaced something.
    // If the file imported pageContentRepository from "../lib/db/repositories/index.js"
    // we need to add the new repositories to the import statement.
    const importRegex =
      /import\s+\{\s*([^}]*?pageContentRepository[^}]*?)\s*\}\s+from\s+["'](\.\.\/)*lib\/db\/repositories\/index\.js["'];/g;

    const importsNeeded = new Set();
    if (content.includes("homepageRepository")) importsNeeded.add("homepageRepository");
    if (content.includes("aboutRepository")) importsNeeded.add("aboutRepository");
    if (content.includes("sustainabilityRepository")) importsNeeded.add("sustainabilityRepository");
    if (content.includes("manufacturingRepository")) importsNeeded.add("manufacturingRepository");
    if (content.includes("technologyRepository")) importsNeeded.add("technologyRepository");

    if (importsNeeded.size > 0) {
      content = content.replace(importRegex, (match, p1) => {
        const imports = p1
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
        const newImports = new Set(imports);
        for (const i of importsNeeded) {
          newImports.add(i);
        }
        // Remove pageContentRepository if it's no longer used
        if (!content.match(/pageContentRepository\./)) {
          newImports.delete("pageContentRepository");
        }
        return match.replace(p1, Array.from(newImports).join(", "));
      });
    }

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith(".ts")) {
      processFile(filePath);
    }
  }
}

walkDir(serverDir);
console.log("Done");
