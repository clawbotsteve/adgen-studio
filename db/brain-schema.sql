-- Brain feature: swipe file storage and training status
-- Run this in Supabase SQL Editor

-- Table: brain_files — stores uploaded swipe file metadata
CREATE TABLE IF NOT EXISTS brain_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf')),
  storage_url TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_brain_files_tenant ON brain_files(tenant_id);

-- Table: brain_status — tracks training status per tenant
CREATE TABLE IF NOT EXISTS brain_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'processing', 'complete')),
  last_trained_at TIMESTAMPTZ,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_brain_status_tenant ON brain_status(tenant_id);

-- RLS policies
ALTER TABLE brain_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_status ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their tenant's brain files
CREATE POLICY "Users can manage their tenant brain files"
  ON brain_files FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their tenant brain status"
  ON brain_status FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );
