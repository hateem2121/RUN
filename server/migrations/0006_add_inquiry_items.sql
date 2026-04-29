-- Migration: Add items column to inquiries table
-- Created: 2026-04-29

ALTER TABLE "inquiries" ADD COLUMN "items" jsonb DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN "inquiries"."items" IS 'Stored JSON array of quote request items containing productId, quantity, and notes';
