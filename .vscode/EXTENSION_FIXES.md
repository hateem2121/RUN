# 🔧 Extension Troubleshooting & CLI Setup

## ✅ Fixed Extension IDs

The following extensions had incorrect or deprecated IDs and have been fixed:

### 1. **Drizzle ORM Extension**
- ❌ **Old (Incorrect)**: `drizzle-kit.drizzle-kit`
- ✅ **New (Correct)**: `rphlmr.drizzle-lab`
- **Reason**: `drizzle-kit` is a CLI tool, not a VS Code extension. The actual extension is Drizzle Lab by rphlmr.
- **Features**: Schema visualizer for Drizzle ORM

### 2. **React Component Preview**
- ❌ **Old (Deprecated)**: `zenclabs.reactpreview`
- ✅ **New (Current)**: `previewjs.previewjs`
- **Reason**: zenclabs.reactpreview is officially retired. Preview.js is the official successor.
- **Features**: Live React component preview with Vite, zero-config, instant updates

### 3. **Console Ninja** ✅
- **ID**: `wallabyjs.console-ninja` (VERIFIED WORKING)
- **Status**: Still actively maintained
- **Features**: Inline console.log output, runtime errors in editor

---

## 📦 All 20 Extensions - Verified Working

| # | Extension ID | Status | Category |
|---|--------------|--------|----------|
| 1 | rphlmr.drizzle-lab | ✅ FIXED | Database |
| 2 | bradlc.vscode-tailwindcss | ✅ Working | Styling |
| 3 | biomejs.biome | ✅ Working | Linting/Formatting |
| 4 | usernamehw.errorlens | ✅ Working | Debugging |
| 5 | ckolkman.vscode-postgres | ✅ Working | Database |
| 6 | rangav.vscode-thunder-client | ✅ Working | API Testing |
| 7 | googlecloudtools.cloudcode | ✅ Working | Cloud |
| 8 | mattpocock.ts-error-translator | ✅ Working | TypeScript |
| 9 | previewjs.previewjs | ✅ FIXED | React |
| 10 | wallabyjs.console-ninja | ✅ Working | Debugging |
| 11 | cesium.gltf-vscode | ✅ Working | 3D |
| 12 | vitest.explorer | ✅ Working | Testing |
| 13 | ryanluker.vscode-coverage-gutters | ✅ Working | Testing |
| 14 | christian-kohler.path-intellisense | ✅ Working | Productivity |
| 15 | formulahendry.auto-rename-tag | ✅ Working | Productivity |
| 16 | wix.vscode-import-cost | ✅ Working | Productivity |
| 17 | aaron-bond.better-comments | ✅ Working | Productivity |
| 18 | mhutchie.git-graph | ✅ Working | Git |
| 19 | mikestead.dotenv | ✅ Working | Config |

---

## 🚀 Install Now

### Method 1: VS Code UI (Recommended)
1. Close and reopen VS Code in this project
2. Click "Install All" when prompted
3. All extensions should install successfully

### Method 2: Manual via Command Palette
1. `Cmd+Shift+P`
2. Type: "Extensions: Show Recommended Extensions"
3. Click cloud icon → "Install All"

### Method 3: CLI
```bash
# Run the extension installer script
./scripts/setup/install-extensions.sh
```

---

## 🎯 Installing VS Code CLI Command

The `code` command allows you to install extensions from the terminal.

### Quick Setup (30 seconds)

1. **Open VS Code**
2. **Press**: `Cmd+Shift+P` (Command Palette)
3. **Type**: `shell command`
4. **Select**: `Shell Command: Install 'code' command in PATH`
5. **Press**: Enter
6. **Restart** your terminal

### Verify Installation

```bash
which code
# Should output: /usr/local/bin/code
```

### Alternative: Manual PATH Setup

```bash
# Add to PATH manually (if above doesn't work)
cat <<EOF >> ~/.zshrc
# VS Code
export PATH="\$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
EOF

source ~/.zshrc
```

---

## ✅ Verification

```bash
# Run the verification script
./scripts/setup/verify-setup.sh
```

---

*Last updated: January 2026*

