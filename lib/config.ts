type PublicConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  businessWebsite: string;
};

type ServerConfig = {
  openAiApiKey: string;
  openAiModel: string;
  metaPageId?: string;
  metaPageAccessToken?: string;
  metaGraphApiVersion: string;
  metaPublishingEnabled: boolean;
};

function required(name: string, value: string | undefined): string {
  const resolved = value?.trim();
  if (!resolved) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return resolved;
}

export function getPublicConfig(): PublicConfig {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublishableKey: required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ),
    businessWebsite:
      process.env.NEXT_PUBLIC_BUSINESS_WEBSITE?.trim() || "https://mhhremoval.com.au",
  };
}

export function getServerConfig(): ServerConfig {
  return {
    openAiApiKey: required("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
    openAiModel: process.env.OPENAI_MODEL?.trim() || "gpt-5-mini",
    metaPageId: process.env.META_PAGE_ID?.trim(),
    metaPageAccessToken: process.env.META_PAGE_ACCESS_TOKEN?.trim(),
    metaGraphApiVersion: process.env.META_GRAPH_API_VERSION?.trim() || "v25.0",
    metaPublishingEnabled: process.env.META_PUBLISHING_ENABLED === "true",
  };
}
