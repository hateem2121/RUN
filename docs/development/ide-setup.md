# IDE Setup Guide

**Status:** Verified | **Last Updated:** January 2026

This guide covers VS Code setup, extensions, and AI assistant (MCP) configuration for RUN-Remix.

---

## Quick Start

1. Open this project in VS Code
2. Click **"Install All"** when the extensions notification appears
3. Reload window: `Cmd+Shift+P` → "Developer: Reload Window"

**Time required**: ~2 minutes

---

## Extension Installation

### Method 1: VS Code UI (Recommended)

1. Open project folder in VS Code
2. Look for notification: "This workspace has extension recommendations"
3. Click **"Install All"**
4. Restart VS Code

### Method 2: Command Palette

1. `Cmd+Shift+P`
2. Type: `Extensions: Show Recommended Extensions`
3. Click cloud icon → "Install All"

### Method 3: CLI

```bash
# First install 'code' command: Cmd+Shift+P → "Shell Command: Install 'code' command in PATH"
./scripts/setup/install-extensions.sh
```

---

## Recommended Extensions (20 Total)

### Essential Development

| Extension | ID | Purpose |
|-----------|-----|---------|
| Biome | `biomejs.biome` | Linting & formatting |
| TailwindCSS IntelliSense | `bradlc.vscode-tailwindcss` | CSS autocomplete |
| Error Lens | `usernamehw.errorlens` | Inline error display |

### Database & Backend

| Extension | ID | Purpose |
|-----------|-----|---------|
| PostgreSQL | `ckolkman.vscode-postgres` | DB management |
| Thunder Client | `rangav.vscode-thunder-client` | API testing |
| Drizzle Lab | `rphlmr.drizzle-lab` | Schema visualization |

### TypeScript & React

| Extension | ID | Purpose |
|-----------|-----|---------|
| TS Error Translator | `mattpocock.ts-error-translator` | Better TS errors |
| Preview.js | `previewjs.previewjs` | React preview |
| Console Ninja | `wallabyjs.console-ninja` | Enhanced debugging |

### Testing & DevOps

| Extension | ID | Purpose |
|-----------|-----|---------|
| Vitest Explorer | `vitest.explorer` | Test runner |
| Coverage Gutters | `ryanluker.vscode-coverage-gutters` | Coverage display |
| Cloud Code | `googlecloudtools.cloudcode` | GCP tools |
| GLTF Tools | `cesium.gltf-vscode` | 3D model support |

### Productivity

| Extension | ID | Purpose |
|-----------|-----|---------|
| Path Intellisense | `christian-kohler.path-intellisense` | Path autocomplete |
| Auto Rename Tag | `formulahendry.auto-rename-tag` | JSX tag sync |
| Import Cost | `wix.vscode-import-cost` | Bundle size |
| Better Comments | `aaron-bond.better-comments` | Color-coded comments |
| Git Graph | `mhutchie.git-graph` | Git visualization |
| DotENV | `mikestead.dotenv` | .env syntax |

---

## Verification Checklist

After installation, verify:

- [ ] Biome handles formatting & linting
- [ ] Error Lens shows inline TypeScript errors
- [ ] TailwindCSS autocomplete works in JSX
- [ ] Files auto-format on save
- [ ] PostgreSQL panel appears in sidebar
- [ ] Vitest tests appear in Testing panel

Run verification script:

```bash
./scripts/setup/verify-setup.sh
```

---

## Troubleshooting

### Extension ID Fixes

The following extensions had deprecated IDs:

| Old ID | New ID | Notes |
|--------|--------|-------|
| `drizzle-kit.drizzle-kit` | `rphlmr.drizzle-lab` | drizzle-kit is CLI, not extension |
| `zenclabs.reactpreview` | `previewjs.previewjs` | zenclabs officially retired |

### CLI Setup

If `code` command isn't found:

1. Open VS Code
2. `Cmd+Shift+P` → "Shell Command: Install 'code' command in PATH"
3. Restart terminal

Alternative:

```bash
echo 'export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"' >> ~/.zshrc
source ~/.zshrc
```

---

## MCP Server Setup (AI Assistants)

MCP (Model Context Protocol) connects AI assistants to external tools and databases.

### Essential MCP Servers for This Project

```bash
npm install -g @modelcontextprotocol/server-postgres \
               @modelcontextprotocol/server-filesystem \
               @modelcontextprotocol/server-git
```

### Configuration

For Claude Desktop, edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "postgres": {
      "command": "mcp-server-postgres",
      "args": ["$DATABASE_URL"]
    },
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["/path/to/RUN-Remix"]
    },
    "git": {
      "command": "mcp-server-git",
      "args": ["/path/to/RUN-Remix"]
    }
  }
}
```

### Additional MCP Servers

| Server | Purpose |
|--------|---------|
| `@modelcontextprotocol/server-github` | GitHub API (issues, PRs) |
| `@modelcontextprotocol/server-neon` | Neon branch management |
| `@google-cloud/gcloud-mcp` | GCP resource management |

### MCP Resources

- [Official Docs](https://modelcontextprotocol.io)
- [Server List](https://github.com/modelcontextprotocol/servers)

---

## File Structure

```text
.vscode/
├── extensions.json    # Extension recommendations
├── settings.json      # Editor settings
├── launch.json        # Debug configuration
└── tasks.json         # VS Code tasks
```

---

## Editor Settings Applied

- Auto-format on save (Biome)
- Bracket pair colorization
- TailwindCSS class regex for `cva()`, `clsx()`, `cn()`
- Workspace TypeScript version
- Optimized file exclusions
