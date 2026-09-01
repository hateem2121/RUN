-- Reinstate session expire index for fast TTL queries and automated pruning
CREATE INDEX IF NOT EXISTS "sessions_expire_idx" ON "sessions" USING btree ("expire");
