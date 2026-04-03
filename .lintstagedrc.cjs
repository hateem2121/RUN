// biome.json excludes .claude/ (via "!.claude" in includes) and does not support
// markdown. When biome receives ONLY excluded/unknown files, it exits code 1 with
// "No files were processed". This filter prevents that by stripping those paths
// before passing to biome. Remaining paths are quoted to handle spaces.
const biomeCheck = (files) => {
  const toCheck = files.filter((f) => !f.includes("/.claude/") && !f.endsWith(".md"));
  if (toCheck.length === 0) return [];
  const quoted = toCheck.map((f) => `"${f}"`).join(" ");
  return [`biome check --write --files-ignore-unknown=true ${quoted}`];
};

module.exports = {
  "*.{ts,tsx}": biomeCheck,
  "*.{js,json,md}": biomeCheck,
};
