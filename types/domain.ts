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
