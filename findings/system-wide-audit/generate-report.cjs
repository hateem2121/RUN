const fs = require("node:fs");
const path = require("node:path");

const dir = "/Users/hateemjamshaid/Sites/RUN/findings/system-wide-audit";
const files = [
  "phase-1-protocol-check.md",
  "phase-2-hard-rules.md",
  "phase-3-security.md",
  "phase-4-architecture.md",
  "phase-5-observability.md",
  "phase-6-frontend.md",
  "phase-7-testing.md",
  "phase-8-infrastructure.md",
  "phase-9-debt-registry.md",
];

let report = `# RUN Remix v4.0.3 — Master Forensic Audit Report\n\n`;
report += `> **Audit Execution Date**: ${new Date().toISOString().split("T")[0]}\n`;
report += `> **Scope**: System-wide, Zero-Tolerance Forensic Audit\n\n`;

report += `## Executive Summary\n\n`;
report += `This document serves as the single authoritative master audit report containing the aggregated findings of the system-wide zero-tolerance forensic scan across 9 phases. It evaluates Hard Rules (H01-H35), Security Invariants, Architecture Constraints, Observability, Frontend Quality, Testing Coverage, Infrastructure, and the Technical Debt Registry.\n\n`;

report += `### High-Priority Vulnerabilities (P0 & P1)\n`;
report += `Based on the subagent scans, several **Critical (P0)** and **Major (P1)** architectural and security violations were identified. A dedicated remediation sprint must be scheduled to address these invariant breaches:\n\n`;
report += `- **[SEC-01] Critical**: Global DOMPurify sanitization recursively strips all tags from \`req.body\`, breaking TipTap rich text rendering. Missing manual Zod validations across 8 CMS services.\n`;
report += `- **[SEC-02] Major**: CSRF middleware bypass found for POST requests to \`api/inquiries\` and \`/contact\`.\n`;
report += `- **[SEC-04] Critical**: \`ALLOW_MEMORY_SESSION=true\` logic flag exists, violating the strictly-Redis session storage rule.\n`;
report += `- **[SEC-10] Major**: 5 API endpoints (including hard deletes) bypass Zod schemas completely.\n`;
report += `- **[ARCH-02] Major**: Admin counterparts missing for \`/services\` and \`/blog\` public routes in \`route-manifest.ts\`.\n`;
report += `- **[ARCH-03] Major**: Forbidden \`useEffect\` server state sync loops wrapping \`fetch()\` requests identified.\n`;
report += `- **[ARCH-05] Critical**: Thin controller rule violated. Database connection imported directly in \`server/routes/metrics.ts\`.\n`;
report += `- **[ARCH-06] Major**: Broken monorepo boundary. \`server/\` imports from \`shared/\` via relative paths instead of the required \`@run-remix/shared\` package alias.\n`;
report += `- **[ARCH-07] Critical**: Cloud worker security bypass inside \`worker.ts\`. Missing \`return\` after responding with 403 falls through to \`next()\`, leaving worker endpoints entirely unprotected.\n`;
report += `- **[FE-06] Critical**: SSR-unsafe raw canvas instantiation in \`client/app/components/products/UnifiedMediaTheater.tsx\` (unguarded window access).\n\n`;

report += `## Table of Contents\n\n`;
files.forEach((f, i) => {
  if (fs.existsSync(path.join(dir, f))) {
    const title = f
      .replace(".md", "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    report += `${i + 1}. [${title}](#${f.replace(".md", "")})\n`;
  }
});

report += `\n---\n\n`;

files.forEach((f) => {
  const filePath = path.join(dir, f);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    report += `\n<a id="${f.replace(".md", "")}"></a>\n`;
    report += content;
    report += `\n\n---\n\n`;
  } else {
    console.warn(`File missing: ${f}`);
  }
});

fs.writeFileSync("/Users/hateemjamshaid/Sites/RUN/MASTER_AUDIT_REPORT.md", report);
console.log("MASTER_AUDIT_REPORT.md generated successfully.");
