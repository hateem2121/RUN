# RUN Remix Wiki Source & Synchronization

This directory contains the version-controlled source files for the official **RUN Remix GitHub Wiki**.

By keeping the Wiki in the main Git repository under `docs/wiki/`, all documentation changes go through the exact same pull request reviews, automated link checking (`npm run check:docs`), and quality gates as our application code.

---

## 🧭 Wiki File Manifest

| File | Wiki Page Title |
|------|-----------------|
| `Home.md` | Home & Factory Grand Tour |
| `01-The-Garment-Journey.md` | 1. The Garment Journey |
| `02-How-The-Website-Works.md` | 2. How the Website Works |
| `03-The-Robot-Helpers.md` | 3. Meet the Robot Helpers |
| `04-Sustainable-Green-Factory.md` | 4. Green Planet Lab |
| `05-How-To-Play-And-Contribute.md` | 5. How to Play & Contribute |
| `06-Troubleshooting-And-FAQ.md` | 6. "Oops!" Runbook & FAQ |
| `_Sidebar.md` | Wiki Global Sidebar Navigation |
| `_Footer.md` | Wiki Global Footer Banner |

---

## 🚀 How to Synchronize with GitHub Wiki

> **💡 Good news!** Wiki syncing is now automated via a GitHub Action (`.github/workflows/wiki-sync.yml`). Every time you push changes to `docs/wiki/` on the `main` branch, the wiki updates automatically!

If you ever need to sync manually, here are the steps:

```bash
# 1. Clone the GitHub Wiki git repository
git clone https://github.com/RUN-APPAREL/RUN.wiki.git /tmp/run-wiki

# 2. Copy the formatted wiki files
cp docs/wiki/*.md /tmp/run-wiki/
rm /tmp/run-wiki/README.md  # Keep README local to main repository

# 3. Commit and push to the live wiki
cd /tmp/run-wiki
git add .
git commit -m "docs(wiki): sync 6-chapter visual guide and sidebar"
git push origin master
```
