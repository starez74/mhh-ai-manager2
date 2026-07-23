type PublicConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  businessWebsite: string;
};

type OpenAIConfig = {
  apiKey: string;
  model: string;
};

type MetaConfig = {
  pageId?: string;
  pageAccessToken?: string;
  graphApiVersion: string;
  publishingEnabled: boolean;
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

export function getOpenAIConfig(): OpenAIConfig {
  return {
    apiKey: required("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-5-mini",
  };
}

export function getMetaConfig(): MetaConfig {
  return {
    pageId: process.env.META_PAGE_ID?.trim(),
    pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN?.trim(),
    graphApiVersion: process.env.META_GRAPH_API_VERSION?.trim() || "v25.0",
    publishingEnabled: process.env.META_PUBLISHING_ENABLED === "true",
  };
}

export function getServerConfig(): ServerConfig {
  const openAI = getOpenAIConfig();
  const meta = getMetaConfig();

  return {
    openAiApiKey: openAI.apiKey,
    openAiModel: openAI.model,
    metaPageId: meta.pageId,
    metaPageAccessToken: meta.pageAccessToken,
    metaGraphApiVersion: meta.graphApiVersion,
    metaPublishingEnabled: meta.publishingEnabled,
  };
}
