#!/bin/bash
cd /Users/hateemjamshaid/Sites/RUN

echo "Running verify:tech-integrity..."
npm run verify:tech-integrity 2>&1 | tee findings/sysi/protocol-0.txt || true

echo "Running biome check (json)..."
npx @biomejs/biome check --reporter=json . 2>&1 | tee findings/sysi/biome-full.json || true

echo "Running biome check (txt)..."
npx @biomejs/biome check . 2>&1 | tee findings/sysi/biome-report.txt || true

echo "Running tsc..."
npx tsc --noEmit 2>&1 | tee findings/sysi/typescript-errors.txt || true

echo "Running build..."
npm run build 2>&1 | tee findings/sysi/build-output.txt || true

echo "Checking tech debt..."
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP\|DEPRECATED" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git . 2>&1 | tee findings/sysi/tech-debt.txt || true

echo "Checking security..."
if [ -d "client" ]; then grep -rn "process.env" --include="*.ts" --include="*.tsx" client/ | grep -v "NODE_ENV" > findings/sysi/security-env.txt || true; fi
if [ -f "server/routes/auth.ts" ]; then grep -n "mock-login\|NODE_ENV" server/routes/auth.ts > findings/sysi/security-auth.txt || true; fi
if [ -f "server/boot/routes.ts" ]; then grep -n "NODE_ENV\|/docs" server/boot/routes.ts > findings/sysi/security-swagger.txt || true; fi

echo "Checking js routes..."
if [ -d "server/routes" ]; then find server/routes -name "*.js" | grep -v node_modules | tee findings/sysi/js-route-files.txt || true; fi

echo "Running npm audit..."
npm audit --json 2>&1 | tee findings/sysi/dependency-audit.json || true

echo "Checking env files in git..."
git log --all --diff-filter=A -- .env .env.local .env.* | head -5 > findings/sysi/env-git.txt || true

echo "Checking PORT constant..."
grep -r "PORT" . --include="*.ts" | grep -v "node_modules" | grep -v "5002" > findings/sysi/port-check.txt || true

echo "Done."
