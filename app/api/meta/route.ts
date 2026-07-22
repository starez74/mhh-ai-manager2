import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: "Your login session is invalid." }, { status: 401 });
  }

  const pageId = process.env.META_PAGE_ID;
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION || "v25.0";

  if (!pageId || !pageToken) {
    return NextResponse.json({
      connected: false,
      publishingEnabled: false,
      message: "Meta Page ID and Page access token have not been configured."
    });
  }

  try {
    const fields = "id,message,created_time,permalink_url";
    const url =
      `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}` +
      `/posts?fields=${encodeURIComponent(fields)}&limit=10&access_token=${encodeURIComponent(pageToken)}`;

    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        connected: false,
        publishingEnabled: process.env.META_PUBLISHING_ENABLED === "true",
        message: data?.error?.message || "Meta connection failed.",
        metaErrorCode: data?.error?.code
      });
    }

    return NextResponse.json({
      connected: true,
      publishingEnabled: process.env.META_PUBLISHING_ENABLED === "true",
      pageId,
      posts: data.data || []
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      publishingEnabled: false,
      message: error instanceof Error ? error.message : "Meta connection failed."
    });
  }
}
