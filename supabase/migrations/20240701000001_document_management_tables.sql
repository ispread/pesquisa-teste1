-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_analyzed_at TIMESTAMP WITH TIME ZONE
);

-- Create extraction_fields table
CREATE TABLE IF NOT EXISTS extraction_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create extraction_field_folders table (for linking fields to source folders)
CREATE TABLE IF NOT EXISTS extraction_field_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extraction_field_id UUID NOT NULL REFERENCES extraction_fields(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create extraction_results table
CREATE TABLE IF NOT EXISTS extraction_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extraction_field_id UUID NOT NULL REFERENCES extraction_fields(id) ON DELETE CASCADE,
  extracted_value TEXT,
  confidence_score FLOAT,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id)
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_field_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_results ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for folders
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own folders" ON folders;
CREATE POLICY "Users can insert their own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;
CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for extraction_fields
DROP POLICY IF EXISTS "Users can view their own extraction fields" ON extraction_fields;
CREATE POLICY "Users can view their own extraction fields"
  ON extraction_fields FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own extraction fields" ON extraction_fields;
CREATE POLICY "Users can insert their own extraction fields"
  ON extraction_fields FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own extraction fields" ON extraction_fields;
CREATE POLICY "Users can update their own extraction fields"
  ON extraction_fields FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own extraction fields" ON extraction_fields;
CREATE POLICY "Users can delete their own extraction fields"
  ON extraction_fields FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for extraction_field_folders
DROP POLICY IF EXISTS "Users can view their own extraction field folders" ON extraction_field_folders;
CREATE POLICY "Users can view their own extraction field folders"
  ON extraction_field_folders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM extraction_fields
      WHERE extraction_fields.id = extraction_field_id
      AND extraction_fields.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own extraction field folders" ON extraction_field_folders;
CREATE POLICY "Users can insert their own extraction field folders"
  ON extraction_field_folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM extraction_fields
      WHERE extraction_fields.id = extraction_field_id
      AND extraction_fields.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own extraction field folders" ON extraction_field_folders;
CREATE POLICY "Users can delete their own extraction field folders"
  ON extraction_field_folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM extraction_fields
      WHERE extraction_fields.id = extraction_field_id
      AND extraction_fields.user_id = auth.uid()
    )
  );

-- Create policies for extraction_results
DROP POLICY IF EXISTS "Users can view their own extraction results" ON extraction_results;
CREATE POLICY "Users can view their own extraction results"
  ON extraction_results FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own extraction results" ON extraction_results;
CREATE POLICY "Users can insert their own extraction results"
  ON extraction_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own extraction results" ON extraction_results;
CREATE POLICY "Users can update their own extraction results"
  ON extraction_results FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own extraction results" ON extraction_results;
CREATE POLICY "Users can delete their own extraction results"
  ON extraction_results FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for all tables
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table folders;
alter publication supabase_realtime add table documents;
alter publication supabase_realtime add table extraction_fields;
alter publication supabase_realtime add table extraction_field_folders;
alter publication supabase_realtime add table extraction_results;