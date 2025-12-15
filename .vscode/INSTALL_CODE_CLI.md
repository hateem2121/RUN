# 🎯 How to Install VS Code CLI Command

The `code` command allows you to install extensions from the terminal.

## Quick Setup (30 seconds)

1. **Open VS Code**
2. **Press**: `Cmd+Shift+P` (Command Palette)
3. **Type**: `shell command`
4. **Select**: `Shell Command: Install 'code' command in PATH`
5. **Press**: Enter
6. **Restart** your terminal

## Verify Installation

```bash
# Check if installed
which code

# Should output something like:
# /usr/local/bin/code
```

## Alternative: One-Command Setup

```bash
# Add to PATH manually (if above doesn't work)
cat << EOF >> ~/.zshrc
# VS Code
export PATH="\$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
EOF

# Reload shell
source ~/.zshrc
```

## After Setup

Run the extension installer:
```bash
./.vscode/install-extensions.sh
```

---

## If You Can't Install Code CLI

**Option 1: VS Code UI (Recommended)**
1. Open this project in VS Code
2. Look for notification: "This workspace has extension recommendations"
3. Click **"Install All"**
4. Done! ✨

**Option 2: Manual Installation**
1. Open VS Code
2. Press `Cmd+Shift+P`
3. Type: `Extensions: Show Recommended Extensions`
4. Click the cloud download icon at the top right
5. VS Code will install all 20 extensions automatically

**Option 3: One by One**
1. Open Extensions panel (`Cmd+Shift+X`)
2. Search for each extension ID from `.vscode/extensions.json`
3. Click Install

---

Choose the method that works best for you! All achieve the same result. 🚀
