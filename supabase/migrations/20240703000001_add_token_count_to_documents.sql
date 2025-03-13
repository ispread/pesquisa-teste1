-- Add token_count column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS token_count INTEGER;

-- Add token_usage column to track actual token usage when processed
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS token_usage INTEGER;

-- Add a function to estimate token count based on file size
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

-- Create a trigger to automatically estimate tokens on document insert
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

-- Update existing documents with estimated token counts
UPDATE documents
SET token_count = estimate_tokens(file_size, file_type)
WHERE token_count IS NULL OR token_count = 0;
