"use client";

import { createClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";

const config = getPublicConfig();

export const browserSupabase = createClient(
  config.supabaseUrl,
  config.supabasePublishableKey
);
