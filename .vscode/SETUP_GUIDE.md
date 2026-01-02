# 🛠️ STEP-BY-STEP SETUP GUIDE

## Prerequisites

Before starting, ensure you have:
1. **Node.js 20+** installed
2. **PostgreSQL** installed and running
3. **VS Code** installed

---

## Step 1: Clone & Install

```bash
# Clone
git clone <repo-url>
cd RUN-Remix

# Install
npm install
```

---

## Step 2: Environment Setup

1. Copy `.env.example` to `.env`
2. Update `DATABASE_URL` with your local Postgres credentials

```bash
cp .env.example .env
```

---

## Step 3: IDE Configuration (CRITICAL)

### Workspace Settings

The `.vscode/settings.json` file is already configured with:
- **Default Formatter**: `biomejs.biome`
- **Format on Save**: Enabled
- **Auto-imports**: Enabled

### `biome.json` (The Authority)

We use Biome for all linting and formatting. It replaces ESLint and Prettier.

- **Auto-fix**: Enabled on save via `.vscode/settings.json`.
- **Formatting**: Handles CSS, JSON, and JS/TS.
- **Linting**: High performance rules.

---

## Step 4: Test Database Extension

1. Open the **PostgreSQL** view in the sidebar
2. Click **"+"** to add a connection
3. Paste your `DATABASE_URL`
4. Test the connection

---

## Step 5: Start Developing

```bash
# Push schema
npm run db:push

# Start dev server
npm run dev
```

---

## 🎯 Verification Checklist

- [ ] `npm install` finished without high-severity errors
- [ ] VS Code shows "All extensions installed"
- [ ] `npm run dev` starts both client and server
- [ ] PostgreSQL extension shows your tables

---

_Guide last updated: December 2025_
