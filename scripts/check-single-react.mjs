import { execSync } from "node:child_process";

try {
  // Use npm list to find all occurrences of react
  // --all lists everything, but it can be huge.
  // --depth=Infinity might be needed if deduping failed.
  // npm list react --json returns a tree.

  // A simpler way often used is checking if 'npm list react' returns multiple versions at top level or deduped.
  // But strict check: fetch output of `npm list react --json`

  const output = execSync("npm list react --json", {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  }); // Ignore stderr (peer dep warnings)
  const tree = JSON.parse(output);

  const versions = new Set();

  // If "react" is the dependency we listed
  // root node is the project. dependencies.react is the top level.
  // BUT npm list react returns a tree OF react usage.

  // npm list output structure for `npm list react`:
  // {
  //   "name": "project",
  //   "dependencies": {
  //     "react": { "version": "19.0.0", ... },
  //     "some-lib": { "dependencies": { "react": { "version": "18.2.0" } } }
  //   }
  // }

  // Actually `npm list [package]` prunes the tree to show paths to that package.

  if (tree.dependencies) {
    traverse(tree.dependencies);
  }

  function traverse(deps) {
    for (const name in deps) {
      const node = deps[name];
      // We only care if the node name IS 'react'.
      // 'npm list react' filters the tree to show paths TO react.
      // The leaf nodes are 'react'. Intermediate nodes are dependents.

      if (name === "react") {
        versions.add(node.version);
      }

      if (node.dependencies) {
        traverse(node.dependencies);
      }
    }
  }

  if (versions.size > 1) {
    process.exit(1);
  }

  if (versions.size === 0) {
  } else {
  }
} catch (_error) {
  // If npm list fails (e.g. missing peer deps), we might warn but not fail?
  // Directive says "Fail CI".
  process.exit(1);
}
