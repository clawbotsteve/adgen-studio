export type UgcConceptStatus = "drafted" | "saved" | "approved" | "launched" | "rejected";

export type UgcConcept = {
  id: string;
  tenant_id: string;
  brand_id: string;
  title: string;
  hook_type: string | null;
  funnel_stage: string | null;
  tone: string | null;
  angle: string | null;
  persona: string | null;
  script_text: string | null;
  shot_list: Record<string, unknown>[] | null;
  status: UgcConceptStatus;
  created_by: string | null;
  created_at: string;
};

export type UgcVariantStatus = "queued" | "generating" | "generated" | "approved" | "rejected" | "launched" | "failed";
export type AudioTier = "no_audio" | "audio" | "audio_voice";

export type UgcVariant = {
  id: string;
  tenant_id: string;
  concept_id: string;
  kind: "image" | "video";
  model_name: string;
  audio_tier: AudioTier;
  duration_sec: number | null;
  aspect_ratio: string | null;
  resolution: string | null;
  hook: string | null;
  cta: string | null;
  visual_angle: string | null;
  prompt: string;
  status: UgcVariantStatus;
  fal_cost_usd: number | null;
  client_charge_usd: number | null;
  margin_usd: number | null;
  output_url: string | null;
  output_drive_url: string | null;
  error_message: string | null;
  created_at: string;
};

export type ClientAvatar = {
  id: string;
  tenant_id: string;
  brand_id: string;
  name: string;
  avatar_type: "premade" | "trained";
  provider: string | null;
  preview_image_url: string | null;
  source_asset_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type ClientVoice = {
  id: string;
  tenant_id: string;
  brand_id: string;
  name: string;
  provider: string | null;
  voice_id: string | null;
  language: string;
  style_tags: string[];
  is_cloned: boolean;
  consent_doc_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type AvatarVoicePreset = {
  id: string;
  tenant_id: string;
  brand_id: string;
  name: string;
  avatar_id: string | null;
  voice_id: string | null;
  default_language: string;
  default_tone: string | null;
  is_default: boolean;
  created_at: string;
};

export type UgcFavorite = {
  tenant_id: string;
  user_id: string;
  variant_id: string;
  created_at: string;
};

export type UgcPerformance = {
  id: string;
  tenant_id: string;
  variant_id: string;
  platform: string | null;
  campaign_name: string | null;
  impressions: number;
  clicks: number;
  ctr: number | null;
  spend_usd: number | null;
  cpa_usd: number | null;
  roas: number | null;
  captured_at: string;
};
