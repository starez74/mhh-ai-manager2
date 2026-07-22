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

function metaError(data: any, fallback: string) {
  const error = data?.error;
  if (!error) return fallback;

  const parts = [
    error.message,
    error.type ? `Type: ${error.type}` : "",
    error.code != null ? `Code: ${error.code}` : "",
    error.error_subcode != null ? `Subcode: ${error.error_subcode}` : ""
  ].filter(Boolean);

  return parts.join(" · ");
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req);

  if (!user) {
    return NextResponse.json(
      { connected: false, error: "Your login session is invalid." },
      { status: 401 }
    );
  }

  const pageId = process.env.META_PAGE_ID?.trim();
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN?.trim();
  const version = process.env.META_GRAPH_API_VERSION?.trim() || "v25.0";
  const publishingEnabled = process.env.META_PUBLISHING_ENABLED === "true";
  const syncedAt = new Date().toISOString();

  if (!pageId || !pageToken) {
    return NextResponse.json({
      connected: false,
      publishingEnabled,
      syncedAt,
      pageIdConfigured: Boolean(pageId),
      tokenConfigured: Boolean(pageToken),
      graphVersion: version,
      message: "META_PAGE_ID or META_PAGE_ACCESS_TOKEN is missing from Vercel."
    });
  }

  try {
    const pageUrl =
      `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}` +
      `?fields=${encodeURIComponent("id,name,link")}` +
      `&access_token=${encodeURIComponent(pageToken)}`;

    const pageResponse = await fetch(pageUrl, { cache: "no-store" });
    const pageData = await pageResponse.json();

    if (!pageResponse.ok) {
      return NextResponse.json({
        connected: false,
        publishingEnabled,
        syncedAt,
        pageIdConfigured: true,
        tokenConfigured: true,
        graphVersion: version,
        pageId,
        stage: "page_identity",
        message: metaError(pageData, "Meta could not verify the configured Facebook Page.")
      });
    }

    const fields = "id,message,created_time,permalink_url";
    const postsUrl =
      `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/posts` +
      `?fields=${encodeURIComponent(fields)}` +
      `&limit=15` +
      `&access_token=${encodeURIComponent(pageToken)}`;

    const postsResponse = await fetch(postsUrl, { cache: "no-store" });
    const postsData = await postsResponse.json();

    if (!postsResponse.ok) {
      return NextResponse.json({
        connected: false,
        pageIdentityConnected: true,
        postsReadable: false,
        publishingEnabled,
        syncedAt,
        pageIdConfigured: true,
        tokenConfigured: true,
        graphVersion: version,
        pageId,
        pageName: pageData.name || "",
        pageLink: pageData.link || "",
        stage: "read_posts",
        message: metaError(postsData, "The Page was verified, but recent posts could not be read.")
      });
    }

    return NextResponse.json({
      connected: true,
      pageIdentityConnected: true,
      postsReadable: true,
      publishingEnabled,
      syncedAt,
      pageIdConfigured: true,
      tokenConfigured: true,
      graphVersion: version,
      pageId,
      pageName: pageData.name || "",
      pageLink: pageData.link || "",
      postCount: Array.isArray(postsData.data) ? postsData.data.length : 0,
      posts: postsData.data || [],
      message: "Facebook Page identity and recent-post access were verified successfully."
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      publishingEnabled,
      syncedAt,
      pageIdConfigured: true,
      tokenConfigured: true,
      graphVersion: version,
      stage: "network",
      message: error instanceof Error ? error.message : "Meta connection failed."
    });
  }
}
