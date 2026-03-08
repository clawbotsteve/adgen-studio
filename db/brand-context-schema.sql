-- Brand Context Schema
-- Per-client brand context storage (Parker-style "Context Hub")
-- Run via Supabase SQL editor

-- 1. Brand Context (one per client, upsert pattern)
create table if not exists brand_context (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,

  -- Structured brand data fields (mirrors Parker's Training Path)
  brand_guidelines text,              -- positioning, vocabulary, tone, voice
  products text,                      -- product descriptions and USPs
  competitive_landscape text,         -- competitors analysis
  customer_personas text,             -- target audience profiles
  founder_story text,                 -- brand origin story (optional)
  marketing_calendar text,            -- events, campaigns, seasonal notes
  compliance_legal text,              -- restricted claims, required disclaimers
  testing_priorities text,            -- what to test next, iteration vs new
  ad_format_preferences text,         -- preferred formats and constraints
  creative_ops_constraints text,      -- turnaround, volume, operational limits
  naming_conventions text,            -- naming rules for campaigns/assets
  goals text,                         -- business and marketing goals

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brand_context_tenant_client
  on brand_context(tenant_id, client_id);
create unique index if not exists idx_brand_context_unique
  on brand_context(tenant_id, client_id);

-- 2. Brand Context Documents (uploaded PDFs, DOCXs, images)
create table if not exists brand_context_docs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_context_id uuid not null references brand_context(id) on delete cascade,

  file_name text not null,
  file_type text not null,            -- 'pdf', 'docx', 'png', 'jpg'
  storage_url text not null,
  file_size_bytes bigint,
  upload_order integer not null default 0,

  created_at timestamptz not null default now()
);

create index if not exists idx_brand_context_docs_context
  on brand_context_docs(brand_context_id);
create index if not exists idx_brand_context_docs_tenant
  on brand_context_docs(tenant_id);
