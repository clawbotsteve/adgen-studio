export type Tenant = {
  id: string;
  name: string;
  domain: string;
};

export type Brand = {
  id: string;
  tenant_id: string;
  name: string;
  voice: string | null;
  drive_folder_id: string | null;
  created_at: string;
};

export type Job = {
  id: string;
  tenant_id: string;
  brand_id: string;
  prompt: string;
  output_url: string | null;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
};

export type Client = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  defaults: Record<string, unknown> | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReferenceImage = {
  id: string;
  tenant_id: string;
  client_id: string;
  label: "identity" | "outfit" | "product" | "background";
  url: string;
  tags: string[];
  is_primary: boolean;
  file_size_bytes: number | null;
  created_at: string;
};

export type Profile = {
  id: string;
  tenant_id: string;
  name: string;
  mode: "image" | "video";
  endpoint: string;
  aspect_ratio: string;
  resolution: string;
  duration_seconds: number | null;
  audio_enabled: boolean;
  seed: number | null;
  prompt_prefix: string | null;
  prompt_suffix: string | null;
  cost_estimate_cents: number | null;
  created_at: string;
  updated_at: string;
};

export type PromptPack = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  item_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type PromptItem = {
  id: string;
  prompt_pack_id: string;
  concept: string;
  prompt_text: string;
  tags: string[];
  sequence: number;
  created_at: string;
};

export type BatchRunStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "stopped"
  | "failed";

export type BatchRun = {
  id: string;
  tenant_id: string;
  client_id: string;
  profile_id: string;
  prompt_pack_id: string;
  status: BatchRunStatus;
  total_items: number;
  queued_count: number;
  running_count: number;
  completed_count: number;
  failed_count: number;
  started_at: string | null;
  stopped_at: string | null;
  created_by: string;
  created_at: string;
};

export type BatchItemStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type BatchItemResult = {
  id: string;
  batch_run_id: string;
  prompt_item_id: string;
  concept: string;
  prompt: string;
  status: BatchItemStatus;
  output_url: string | null;
  error_message: string | null;
  error_code: string | null;
  retry_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type RetryJob = {
  id: string;
  batch_run_id: string;
  batch_item_result_id: string;
  original_prompt: string;
  edited_prompt: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  output_url: string | null;
  error_message: string | null;
  created_by: string;
  created_at: string;
};
