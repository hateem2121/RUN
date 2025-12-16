#!/bin/bash
# Verify GLTF upload in object storage and database

echo "🔍 Verifying GLTF Upload"
echo "========================"
echo ""

# Check recent media entries in database
echo "📊 Recent media entries (last 5):"
echo "SELECT id, filename, mimeType, type, storagePath, uploadedAt FROM media ORDER BY uploadedAt DESC LIMIT 5;" | node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const results = await sql\`SELECT id, filename, mimeType, type, storagePath, uploadedAt FROM media ORDER BY uploadedAt DESC LIMIT 5\`;
  console.table(results);
})();
" 2>/dev/null || echo "⚠️  Database query failed (run from project root)"

echo ""
echo "🔍 Searching for GLTF/GLB files in database:"
echo "SELECT id, filename, mimeType, storagePath FROM media WHERE filename LIKE '%glb%' OR filename LIKE '%gltf%' OR mimeType LIKE '%gltf%' ORDER BY uploadedAt DESC LIMIT 3;" | node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const results = await sql\`SELECT id, filename, mimeType, storagePath FROM media WHERE filename LIKE '%glb%' OR filename LIKE '%gltf%' OR mimeType LIKE '%gltf%' ORDER BY uploadedAt DESC LIMIT 3\`;
  if (results.length > 0) {
    console.table(results);
  } else {
    console.log('❌ No GLTF/GLB files found');
  }
})();
" 2>/dev/null || echo "⚠️  Database query failed"

echo ""
echo "📁 Recent upload logs:"
grep -i "finalize upload\|cube\|glb\|gltf" /tmp/logs/Start_application_*.log 2>/dev/null | tail -20 || echo "⚠️  No logs found"

echo ""
echo "✅ Verification complete"
