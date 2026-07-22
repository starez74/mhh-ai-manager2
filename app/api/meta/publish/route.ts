import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const supabase = serverSupabase();
  const { data } = await supabase.auth.getUser(token);
  return data.user ?? null;
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Your login session is invalid." }, { status: 401 });
  }

  if (process.env.META_PUBLISHING_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Facebook publishing is disabled in Vercel." },
      { status: 403 }
    );
  }

  const pageId = process.env.META_PAGE_ID;
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION || "v25.0";

  if (!pageId || !pageToken) {
    return NextResponse.json(
      { error: "Meta Page connection has not been configured." },
      { status: 500 }
    );
  }

  const { campaignId } = await req.json();
  if (!campaignId) {
    return NextResponse.json({ error: "Campaign ID is required." }, { status: 400 });
  }

  const supabase = serverSupabase();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: "Campaign was not found." }, { status: 404 });
  }

  if (campaign.status !== "approved") {
    return NextResponse.json(
      { error: "Only approved campaigns can be published." },
      { status: 403 }
    );
  }

  const message = campaign.content;
  const response = await fetch(
    `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: pageToken
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data?.error?.message || "Facebook publishing failed." },
      { status: response.status }
    );
  }

  await supabase
    .from("campaigns")
    .update({ status: "published" })
    .eq("id", campaign.id)
    .eq("user_id", user.id);

  return NextResponse.json({
    success: true,
    postId: data.id,
    message: "The approved campaign was published to Facebook."
  });
}
