-- AdGen Studio schema
create extension if not exists "pgcrypto";

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  logo_url text,
  primary_color text default '#7c3aed',
  created_at timestamptz not null default now()
);

create table if not exists tenant_users (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  voice text,
  drive_folder_id text,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  prompt text not null,
  output_url text,
  status text not null check (status in ('queued','processing','completed','failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_brands_tenant_id on brands(tenant_id);
create index if not exists idx_jobs_tenant_id_created_at on jobs(tenant_id, created_at desc);
create index if not exists idx_jobs_brand_id on jobs(brand_id);

-- Clients table
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  description text,
  defaults jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_tenant_id on clients(tenant_id);
create index if not exists idx_clients_archived_at on clients(archived_at);

-- Reference Images table
create table if not exists reference_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  label text not null check (label in ('identity', 'outfit', 'product', 'background')),
  url text not null,
  tags text[] default '{}',
  is_primary boolean default false,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_reference_images_tenant_id on reference_images(tenant_id);
create index if not exists idx_reference_images_client_id on reference_images(client_id);
create index if not exists idx_reference_images_label on reference_images(label);

-- Profiles table
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  mode text not null check (mode in ('image', 'video')),
  endpoint text not null,
  aspect_ratio text not null,
  resolution text not null,
  duration_seconds integer,
  audio_enabled boolean default false,
  seed integer,
  prompt_prefix text,
  prompt_suffix text,
  cost_estimate_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_tenant_id on profiles(tenant_id);
create index if not exists idx_profiles_mode on profiles(mode);

-- Prompt Packs table
create table if not exists prompt_packs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  description text,
  item_count integer default 0,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prompt_packs_tenant_id on prompt_packs(tenant_id);

-- Prompt Items table
create table if not exists prompt_items (
  id uuid primary key default gen_random_uuid(),
  prompt_pack_id uuid not null references prompt_packs(id) on delete cascade,
  concept text not null,
  prompt_text text not null,
  tags text[] default '{}',
  sequence integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_items_prompt_pack_id on prompt_items(prompt_pack_id);
create index if not exists idx_prompt_items_sequence on prompt_items(prompt_pack_id, sequence);

-- Batch Runs table
create table if not exists batch_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  prompt_pack_id uuid not null references prompt_packs(id),
  status text not null check (status in ('queued', 'running', 'paused', 'completed', 'stopped', 'failed')),
  total_items integer not null,
  queued_count integer default 0,
  running_count integer default 0,
  completed_count integer default 0,
  failed_count integer default 0,
  started_at timestamptz,
  stopped_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_batch_runs_tenant_id on batch_runs(tenant_id);
create index if not exists idx_batch_runs_client_id on batch_runs(client_id);
create index if not exists idx_batch_runs_status on batch_runs(status);
create index if not exists idx_batch_runs_created_at on batch_runs(created_at desc);

-- Batch Item Results table
create table if not exists batch_item_results (
  id uuid primary key default gen_random_uuid(),
  batch_run_id uuid not null references batch_runs(id) on delete cascade,
  prompt_item_id uuid not null references prompt_items(id),
  concept text not null,
  prompt text not null,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed')),
  output_url text,
  error_message text,
  error_code text,
  retry_count integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_batch_item_results_batch_run_id on batch_item_results(batch_run_id);
create index if not exists idx_batch_item_results_prompt_item_id on batch_item_results(prompt_item_id);
create index if not exists idx_batch_item_results_status on batch_item_results(status);

-- Retry Jobs table
create table if not exists retry_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_run_id uuid not null references batch_runs(id) on delete cascade,
  batch_item_result_id uuid not null references batch_item_results(id) on delete cascade,
  original_prompt text not null,
  edited_prompt text,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  output_url text,
  error_message text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_retry_jobs_batch_run_id on retry_jobs(batch_run_id);
create index if not exists idx_retry_jobs_batch_item_result_id on retry_jobs(batch_item_result_id);
create index if not exists idx_retry_jobs_status on retry_jobs(status);
