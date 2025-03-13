-- Fix token_count column in documents table

-- Check if token_count column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'documents' 
                   AND column_name = 'token_count') THEN
        ALTER TABLE documents ADD COLUMN token_count INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'documents' 
                   AND column_name = 'token_usage') THEN
        ALTER TABLE documents ADD COLUMN token_usage INTEGER;
    END IF;
END
$$;

-- Update existing documents with estimated token counts if they don't have one
UPDATE documents
SET token_count = CEIL(file_size / 4)
WHERE token_count IS NULL OR token_count = 0;

-- Create or replace function to estimate tokens
CREATE OR REPLACE FUNCTION estimate_tokens(file_size BIGINT, file_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  bytes_per_token INTEGER := 4; -- Default approximation
  estimated_tokens INTEGER;
BEGIN
  -- Basic estimation based on file size
  estimated_tokens := CEIL(file_size / bytes_per_token);
  
  -- Adjust based on file type
  IF file_type LIKE '%pdf%' THEN
    -- Estimate PDF tokens based on approximate page count
    DECLARE
      estimated_pages INTEGER := GREATEST(1, CEIL(file_size / (100 * 1024))); -- ~100KB per page
      tokens_per_page INTEGER := 500; -- Average tokens per page
    BEGIN
      estimated_tokens := estimated_pages * tokens_per_page;
    END;
  ELSIF file_type LIKE '%word%' OR file_type LIKE '%document%' THEN
    -- Word documents typically have more tokens per byte than plain text
    estimated_tokens := CEIL(estimated_tokens * 0.8);
  ELSIF file_type LIKE '%csv%' OR file_type LIKE '%excel%' OR file_type LIKE '%spreadsheet%' THEN
    -- Spreadsheets are more token-efficient when represented as text
    estimated_tokens := CEIL(estimated_tokens * 0.5);
  END IF;
  
  RETURN GREATEST(1, estimated_tokens);
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_document_token_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if token_count is NULL or zero
  IF NEW.token_count IS NULL OR NEW.token_count = 0 THEN
    NEW.token_count := estimate_tokens(NEW.file_size, NEW.file_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_document_token_count ON documents;

-- Create the trigger
CREATE TRIGGER set_document_token_count
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_document_token_count();
