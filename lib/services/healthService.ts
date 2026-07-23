import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { getOpenAIConfig, getPublicConfig } from "@/lib/config";

export type HealthCheck = {
  key: string;
  label: string;
  status: "healthy" | "warning" | "error";
  message: string;
  checkedAt: string;
};

async function checkWebsite(checkedAt: string): Promise<HealthCheck> {
  const { businessWebsite } = getPublicConfig();

  try {
    const response = await fetch(businessWebsite, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    return {
      key: "website",
      label: "Business website",
      status: response.ok ? "healthy" : "warning",
      message: response.ok
        ? `${businessWebsite} responded successfully.`
        : `${businessWebsite} returned HTTP ${response.status}.`,
      checkedAt,
    };
  } catch (error) {
    return {
      key: "website",
      label: "Business website",
      status: "error",
      message: error instanceof Error ? error.message : "Website request failed.",
      checkedAt,
    };
  }
}

async function checkOpenAI(checkedAt: string): Promise<HealthCheck> {
  let config;
  try {
    config = getOpenAIConfig();
  } catch (error) {
    return {
      key: "openai",
      label: "OpenAI",
      status: "error",
      message: error instanceof Error ? error.message : "OPENAI_API_KEY is missing.",
      checkedAt,
    };
  }

  try {
    const response = await fetch(
      `https://api.openai.com/v1/models/${encodeURIComponent(config.model)}`,
      {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    const data = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };

    return {
      key: "openai",
      label: "OpenAI",
      status: response.ok ? "healthy" : "error",
      message: response.ok
        ? `API key accepted and model ${config.model} is available.`
        : data.error?.message || `OpenAI returned HTTP ${response.status}.`,
      checkedAt,
    };
  } catch (error) {
    return {
      key: "openai",
      label: "OpenAI",
      status: "error",
      message: error instanceof Error ? error.message : "OpenAI connection failed.",
      checkedAt,
    };
  }
}

async function checkSupabase(
  checkedAt: string,
  userId: string,
  accessToken: string
): Promise<HealthCheck> {
  try {
    const { error } = await createServerSupabase(accessToken)
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      key: "supabase",
      label: "Supabase",
      status: error ? "error" : "healthy",
      message: error ? error.message : "Database connection and enquiries table verified.",
      checkedAt,
    };
  } catch (error) {
    return {
      key: "supabase",
      label: "Supabase",
      status: "error",
      message: error instanceof Error ? error.message : "Supabase connection failed.",
      checkedAt,
    };
  }
}

export async function runHealthChecks(userId: string, accessToken: string) {
  const checkedAt = new Date().toISOString();
  const checks = await Promise.all([
    checkSupabase(checkedAt, userId, accessToken),
    checkOpenAI(checkedAt),
    checkWebsite(checkedAt),
  ]);

  return {
    checkedAt,
    checks,
    overallHealthy: checks.every((check) => check.status === "healthy"),
  };
}
