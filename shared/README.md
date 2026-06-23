# RUN Apparel B2B - Shared Types & Schemas (v4.0.3)

This directory contains the single-source-of-truth schemas, types, and constants shared between the `client` and `server` workspaces in the RUN Apparel B2B Platform.

## 🛠️ Shared Tech Stack
- **Language**: TypeScript 6
- **Database Schemas**: Drizzle ORM 0.45.1
- **Validation**: Zod v4 & `drizzle-zod`

## 🏗️ Architecture Rules
1. **No Frontend/Backend Dependencies:** This workspace must NEVER import from `client/` or `server/`.
2. **ESM Standard:** Shared files use standard `.js` and `.ts` extensions, and compile cleanly for both Vite (Client) and Node 24 (Server).
3. **Route Constants:** All route strings (`API_ROUTES`, `ROUTES`) are stored here to prevent drift.

## ⚠️ Important Note
Please refer to the [Root README](../README.md) for full project documentation and installation instructions.
