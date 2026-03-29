-- Enable recommended PostgreSQL extensions for Neon
-- Run this migration to enable performance monitoring and useful extensions

-- HIGH PRIORITY: Query performance tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- MEDIUM PRIORITY: Useful for common use cases (optional, uncomment if needed)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;         -- Fuzzy text search
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;        -- Cryptographic functions
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- UUID generation

-- Verify extensions are enabled
SELECT name, installed_version 
FROM pg_available_extensions 
WHERE installed_version IS NOT NULL 
ORDER BY name;
