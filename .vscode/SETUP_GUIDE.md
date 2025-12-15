# Quick Start: Installing Recommended Extensions

## Step 1: Install Extensions

1. **Open VS Code** in your RUN-Remix project
2. You should see a notification: "**This workspace has extension recommendations**"
3. Click **"Install All"** or **"Show Recommendations"**

Alternatively, manually install:

- Open Command Palette (`Cmd+Shift+P`)
- Type: `Extensions: Show Recommended Extensions`
- Click the cloud icon to install all at once

## Step 2: Verify Installation

After installing, restart VS Code to ensure all extensions are activated.

### Essential Extensions to Verify:

- ✅ **Error Lens** - You should see inline errors immediately
- ✅ **TailwindCSS IntelliSense** - Type `className="` and you should see autocomplete
- ✅ **Prettier** - Save a file and it should auto-format
- ✅ **ESLint** - Linting errors should show in problems panel

## Step 3: Configure ESLint & Prettier (Optional)

If you don't have these already, create:

### `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

### `.eslintrc.json` (if needed)

```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  }
}
```

## Step 4: Test Database Extension

### PostgreSQL Extension Setup:

1. Click on the PostgreSQL icon in the sidebar
2. Add your Neon database connection string
3. Format: `postgresql://[user]:[password]@[host]/[database]`

Get connection string from `.env` file (`DATABASE_URL`)

## Step 5: Test API with Thunder Client

1. Open Thunder Client from Activity Bar
2. Create a new request
3. Test your local API: `http://localhost:5001/api/health`

## Step 6: Configure Google Cloud Code (Optional)

If deploying to GCP:

1. Install `gcloud` CLI if not already installed
2. Open Command Palette: `Cloud Code: Sign In`
3. Authenticate with your Google account
4. Select your GCP project

## MCP Servers (Advanced - For AI Assistants)

If you're using an AI coding assistant that supports MCP:

### PostgreSQL MCP

```bash
npx -y @modelcontextprotocol/server-postgres "your-database-url"
```

### Git MCP

```bash
npx -y @modelcontextprotocol/server-git
```

## Troubleshooting

### Extension Not Working?

- Reload window: `Cmd+Shift+P` → "Developer: Reload Window"
- Check if extension is enabled: Extensions panel → Search extension → Enable

### Formatter Not Auto-Running?

- Check `.vscode/settings.json` has `"editor.formatOnSave": true`
- Right-click in editor → "Format Document With..." → Select Prettier

### TailwindCSS Not Autocompleting?

- Ensure `tailwind.config.js` exists
- Reload window
- Check TailwindCSS extension is running (bottom right status bar)

---

## Next Steps

1. Run your dev server: `npm run dev`
2. Open a React component
3. Try editing - you should see:
   - Inline TypeScript errors (Error Lens)
   - TailwindCSS autocomplete
   - Auto-formatting on save
   - ESLint suggestions

Enjoy your enhanced development experience! 🚀
