import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Check = {
  key: string;
  label: string;
  status: "healthy" | "warning" | "error";
  message: string;
  checkedAt: string;
};

async function verifyUser(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data } = await supabase.auth.getUser(token);
  return data.user ?? null;
}

async function checkWebsite(checkedAt: string): Promise<Check> {
  const website = process.env.NEXT_PUBLIC_BUSINESS_WEBSITE || "https://mhhremoval.com.au";

  try {
    const response = await fetch(website, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });

    return {
      key: "website",
      label: "Business website",
      status: response.ok ? "healthy" : "warning",
      message: response.ok
        ? `${website} responded successfully.`
        : `${website} returned HTTP ${response.status}.`,
      checkedAt
    };
  } catch (error) {
    return {
      key: "website",
      label: "Business website",
      status: "error",
      message: error instanceof Error ? error.message : "Website request failed.",
      checkedAt
    };
  }
}

async function checkOpenAI(checkedAt: string): Promise<Check> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";

  if (!apiKey) {
    return {
      key: "openai",
      label: "OpenAI",
      status: "error",
      message: "OPENAI_API_KEY is missing.",
      checkedAt
    };
  }

  try {
    const response = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json().catch(() => ({}));

    return {
      key: "openai",
      label: "OpenAI",
      status: response.ok ? "healthy" : "error",
      message: response.ok
        ? `API key accepted and model ${model} is available.`
        : data?.error?.message || `OpenAI returned HTTP ${response.status}.`,
      checkedAt
    };
  } catch (error) {
    return {
      key: "openai",
      label: "OpenAI",
      status: "error",
      message: error instanceof Error ? error.message : "OpenAI connection failed.",
      checkedAt
    };
  }
}

async function checkSupabase(checkedAt: string, userId: string): Promise<Check> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return {
      key: "supabase",
      label: "Supabase",
      status: "error",
      message: "Supabase URL or publishable key is missing.",
      checkedAt
    };
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error } = await supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      key: "supabase",
      label: "Supabase",
      status: error ? "error" : "healthy",
      message: error ? error.message : "Database connection and enquiries table verified.",
      checkedAt
    };
  } catch (error) {
    return {
      key: "supabase",
      label: "Supabase",
      status: "error",
      message: error instanceof Error ? error.message : "Supabase connection failed.",
      checkedAt
    };
  }
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const checkedAt = new Date().toISOString();
  const checks = await Promise.all([
    checkSupabase(checkedAt, user.id),
    checkOpenAI(checkedAt),
    checkWebsite(checkedAt)
  ]);

  return NextResponse.json({
    checkedAt,
    checks,
    overallHealthy: checks.every(check => check.status === "healthy")
  });
}
