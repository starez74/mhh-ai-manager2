import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const { data } = await client().auth.getUser(auth.slice(7).trim());
  return data.user ?? null;
}
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Your login session is invalid." }, { status: 401 });
  if (process.env.META_PUBLISHING_ENABLED !== "true") return NextResponse.json({ error: "Facebook publishing is disabled in Vercel." }, { status: 403 });
  const pageId = process.env.META_PAGE_ID;
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION || "v25.0";
  if (!pageId || !pageToken) return NextResponse.json({ error: "Meta Page connection is not configured." }, { status: 500 });
  const { campaignId } = await req.json();
  const supabase = client();
  const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", campaignId).eq("user_id", user.id).single();
  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  if (campaign.status !== "approved") return NextResponse.json({ error: "Only approved campaigns can be published." }, { status: 403 });
  const message = campaign.facebook_post || campaign.content;
  if (!message?.trim()) return NextResponse.json({ error: "Campaign has no Facebook caption." }, { status: 400 });
  const r = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/feed`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, access_token: pageToken }) });
  const j = await r.json();
  if (!r.ok) return NextResponse.json({ error: j?.error?.message || "Facebook publishing failed." }, { status: r.status });
  await supabase.from("campaigns").update({ status: "published", meta_post_id: j.id, published_at: new Date().toISOString() }).eq("id", campaign.id).eq("user_id", user.id);
  return NextResponse.json({ success: true, postId: j.id, message: "Approved caption published to Facebook." });
}
