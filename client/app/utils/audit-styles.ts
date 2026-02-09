// client/src/utils/audit-styles.ts

export function auditStyles() {
  const diagnostics = {
    tailwindImported: Array.from(document.styleSheets).some((ss) => {
      try {
        // Broaden detection: Look for --tw- variables or specific tailwind string in href
        const checkRules = (rules: CSSRuleList): boolean => {
          return Array.from(rules).some((r) => {
            if (r instanceof CSSStyleRule && r.cssText.includes("--tw-")) {
              return true;
            }
            // Tailwind v4: Check inside @layer blocks
            if ("layerName" in r && "cssRules" in r) {
              return checkRules((r as unknown as { cssRules: CSSRuleList }).cssRules);
            }
            return false;
          });
        };
        const hasTailwindVars = checkRules(ss.cssRules);
        return hasTailwindVars || !!ss.href?.includes("tailwind");
      } catch {
        // Fallback for cross-origin or restricted stylesheets
        return !!ss.href?.includes("tailwind");
      }
    }),

    stylesheetCount: document.styleSheets.length,

    inlineStyleTags: document.querySelectorAll("style").length,

    cssVariablesDefined: Array.from(document.styleSheets)
      .flatMap((ss) => {
        try {
          return Array.from(ss.cssRules)
            .filter((r) => r instanceof CSSStyleRule && r.selectorText === ":root")
            .flatMap((r) => {
              const rule = r as CSSStyleRule;
              const cssText = rule.style.cssText;
              return cssText.match(/--[\w-]+/g) || [];
            });
        } catch {
          return [];
        }
      })
      .filter((v, i, arr) => arr.indexOf(v) === i),

    oklchColorsFound: Array.from(document.styleSheets).flatMap((ss) => {
      try {
        return Array.from(ss.cssRules)
          .map((r) => r.cssText)
          .filter((r) => r.includes("oklch("));
      } catch {
        return [];
      }
    }).length,
  };

  // Check for Specificity Issues (Reset vs Utilities)
  const button = document.createElement("button");
  button.className = "bg-primary px-4 py-2 rounded";
  button.style.display = "none";
  document.body.appendChild(button);
  window.getComputedStyle(button);
  document.body.removeChild(button);
  return diagnostics;
}

if (import.meta.env.DEV) {
  window.addEventListener("load", () => {
    setTimeout(auditStyles, 1500);
  });
}
