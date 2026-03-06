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
