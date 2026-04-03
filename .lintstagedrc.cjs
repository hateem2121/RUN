module.exports = {
  "*.{ts,tsx}": (files) => {
    const toCheck = files.filter((f) => !f.includes("/.claude/"));
    if (toCheck.length === 0) return [];
    return [
      `biome check --write --files-ignore-unknown=true ${toCheck.join(" ")}`,
    ];
  },
  "*.{js,json,md}": (files) => {
    const toCheck = files.filter((f) => !f.includes("/.claude/"));
    if (toCheck.length === 0) return [];
    return [
      `biome check --write --files-ignore-unknown=true ${toCheck.join(" ")}`,
    ];
  },
};
