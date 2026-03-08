-- UGC Studio schema extension
-- Run after main schema.sql

-- UGC Concepts table
create table if not exists ugc_concepts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  title text not null,
  hook_type text,
  funnel_stage text,
  tone text,
  angle text,
  persona text,
  script_text text,
  shot_list jsonb,
  status text not null default 'drafted' check (status in ('drafted','saved','approved','launched','rejected')),
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_ugc_concepts_tenant_brand on ugc_concepts(tenant_id, brand_id);
create index if not exists idx_ugc_concepts_status on ugc_concepts(status);

-- UGC Variants table
create table if not exists ugc_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  concept_id uuid not null references ugc_concepts(id) on delete cascade,
  kind text not null check (kind in ('image','video')),
  model_name text not null,
  audio_tier text not null default 'no_audio' check (audio_tier in ('no_audio','audio','audio_voice')),
  duration_sec integer,
  aspect_ratio text,
  resolution text,
  hook text,
  cta text,
  visual_angle text,
  prompt text not null,
  status text not null default 'queued' check (status in ('queued','generating','generated','approved','rejected','launched','failed')),
  fal_cost_usd numeric(10,4),
  client_charge_usd numeric(10,4),
  margin_usd numeric(10,4),
  output_url text,
  output_drive_url text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ugc_variants_tenant_concept on ugc_variants(tenant_id, concept_id);
create index if not exists idx_ugc_variants_status on ugc_variants(status);

-- Client Avatars table
create table if not exists client_avatars (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  avatar_type text not null default 'premade' check (avatar_type in ('premade','trained')),
  provider text,
  preview_image_url text,
  source_asset_url text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_avatars_tenant_brand on client_avatars(tenant_id, brand_id);

-- Client Voices table
create table if not exists client_voices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  provider text,
  voice_id text,
  language text default 'en',
  style_tags text[] default '{}',
  is_cloned boolean default false,
  consent_doc_url text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_voices_tenant_brand on client_voices(tenant_id, brand_id);

-- Avatar Voice Presets table
create table if not exists avatar_voice_presets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  avatar_id uuid references client_avatars(id) on delete set null,
  voice_id uuid references client_voices(id) on delete set null,
  default_language text default 'en',
  default_tone text,
  is_default boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_avatar_voice_presets_tenant_brand on avatar_voice_presets(tenant_id, brand_id);

-- UGC Favorites table
create table if not exists ugc_favorites (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null,
  variant_id uuid not null references ugc_variants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id, variant_id)
);

-- UGC Performance table
create table if not exists ugc_performance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  variant_id uuid not null references ugc_variants(id) on delete cascade,
  platform text,
  campaign_name text,
  impressions integer default 0,
  clicks integer default 0,
  ctr numeric(6,4),
  spend_usd numeric(10,2),
  cpa_usd numeric(10,2),
  roas numeric(8,4),
  captured_at timestamptz not null default now()
);

create index if not exists idx_ugc_performance_tenant on ugc_performance(tenant_id);
create index if not exists idx_ugc_performance_variant on ugc_performance(variant_id);
