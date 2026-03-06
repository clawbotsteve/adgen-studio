const must = (value: string | undefined, key: string): string => {
  if (!value) throw new Error(`Missing required configuration: ${key}`);
  return value;
};

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  falApiKey: process.env.FAL_KEY,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  driveServiceAccountEmail: process.env.GDRIVE_SERVICE_ACCOUNT_EMAIL,
  driveServiceAccountPrivateKey: process.env.GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY,
  driveRootFolderId: process.env.GDRIVE_ROOT_FOLDER_ID,
};

export const requireSupabasePublic = () => ({
  url: must(env.supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
  anonKey: must(env.supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
});

export const requireServiceRole = () => must(env.supabaseServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
