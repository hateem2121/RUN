# RUN Apparel B2B - Operational Scripts (v4.0.3)

This directory contains the operational, deployment, and verification scripts for the RUN Apparel B2B Platform.

## 🛠️ Scripting Tech Stack
- **Testing/Verification**: Playwright, Vitest, Custom TS Scripts
- **Language**: Node.js & TypeScript
- **Linting**: Biome 2.3.10

## 📝 Key Scripts
- `verify-tech-integrity.ts`: The absolute gateway for B.L.A.S.T. compliance. Ensures zero tech debt.
- `verify-neon.ts`: Database connection validator.
- `verify-routes.ts`: Validates that `client/` routes match `shared/` constants.

## ⚠️ Important Note
Please refer to the [Root README](../README.md) for full project documentation. These scripts are typically invoked via `npm run` from the root workspace.
