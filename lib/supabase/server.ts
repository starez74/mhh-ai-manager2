import { createClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";

export function createServerSupabase(accessToken?: string) {
  const config = getPublicConfig();

  return createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}
