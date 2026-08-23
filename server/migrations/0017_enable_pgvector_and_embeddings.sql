-- Migration 0017: Enable pgvector and Add Embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add 384-dimensional vector embedding column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Add 384-dimensional vector embedding column to fabrics
ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create HNSW cosine similarity index on products
CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx 
ON products USING hnsw (embedding vector_cosine_ops);

-- Create HNSW cosine similarity index on fabrics
CREATE INDEX IF NOT EXISTS fabrics_embedding_hnsw_idx 
ON fabrics USING hnsw (embedding vector_cosine_ops);
