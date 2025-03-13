-- Fix token_count column in documents table with a simpler approach

-- Add token_count column if it doesn't exist with a default value
ALTER TABLE documents ADD COLUMN IF NOT EXISTS token_count INTEGER DEFAULT 0;

-- Add token_usage column if it doesn't exist with a default value
ALTER TABLE documents ADD COLUMN IF NOT EXISTS token_usage INTEGER DEFAULT 0;

-- Update existing documents with estimated token counts
UPDATE documents
SET token_count = CEIL(file_size / 4)
WHERE token_count IS NULL;
