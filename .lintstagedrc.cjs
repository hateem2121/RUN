// biome.json excludes .claude/ and does not support markdown. Patterns are scoped
// to source directories only so that .claude/ files — which have nested .gitignore
// rules (.factory/ etc.) — never enter lint-staged's match set. This prevents:
//   - git add failures on gitignore'd paths during lint-staged re-staging
//   - concurrent biome SIGKILL when .claude/ files trigger a second biome instance
// The catch-all "*.{ts,tsx,js,json}" is intentionally absent; only named source
// dirs are matched so root-level tooling configs (.claude/, biome.json, etc.) are
// handled by the explicit verify/typecheck steps in the pre-commit hook.
const biomeCheck = (files) => {
  if (files.length === 0) return [];
  const quoted = files.map((f) => `"${f}"`).join(" ");
  return [`biome check --write --files-ignore-unknown=true ${quoted}`];
};

module.exports = {
  "{client,server,shared,scripts,e2e}/**/*.{ts,tsx,js,json}": biomeCheck,
};
