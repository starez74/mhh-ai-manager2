import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const BUSINESS = `You are the private marketing manager for Ma's Helping Hand, a furniture removals business in Nanango, Queensland, Australia.
Verified facts: website https://mhhremoval.com.au; phone 0412 144 297; address 62 Drayton St, Nanango QLD; ABN 70 051 256 598; tagline FROM OUR HANDS TO YOUR HOME. Furniture removals are primary and second-hand furniture sales are secondary. Service area is Nanango, Kingaroy and the South Burnett when relevant.
Brand: deep navy #031529, navy #071F37, gold #D7A941, pale gold #F1D370, white text, original truck logo never recoloured or redesigned.
Rules: use Australian English; never claim insurance unless explicitly confirmed; never invent reviews, licences, qualifications, prices, discounts or guarantees; never claim unverified services; create drafts only; keep copy natural and local; include phone or website in the CTA; avoid repeating recent Page posts and saved campaigns.`;

async function userFrom(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await supabase.auth.getUser(token);
  return data.user ?? null;
}

async function recentFacebookPosts() {
  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION || "v25.0";
  if (!pageId || !token) return [];
  try {
    const fields = "message,created_time";
    const url = `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/posts?fields=${encodeURIComponent(fields)}&limit=15&access_token=${encodeURIComponent(token)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json();
    return j.data || [];
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  try {
    const user = await userFrom(req);
    if (!user) return NextResponse.json({ error: "Your login session could not be verified. Please sign out and sign back in." }, { status: 401 });
    const { objective, audience, offer, notes } = await req.json();
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is missing in Vercel." }, { status: 500 });

    const fb = await recentFacebookPosts();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(url, key, { global: { headers: { Authorization: req.headers.get("authorization") ?? "" } } });
    const { data: saved } = await supabase.from("campaigns").select("title,facebook_post,content,created_at").order("created_at", { ascending: false }).limit(20);

    const context = [
      "RECENT FACEBOOK POSTS:",
      ...(fb.length ? fb.map((p:any,i:number)=>`${i+1}. ${p.created_time}: ${p.message || "(no text)"}`) : ["None available"]),
      "RECENT SAVED CAMPAIGNS:",
      ...((saved || []).length ? (saved || []).map((c:any,i:number)=>`${i+1}. ${c.created_at}: ${c.title} — ${c.facebook_post || c.content}`) : ["None saved"])
    ].join("\n");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: BUSINESS,
      input: `Create a new Facebook campaign.\nObjective: ${objective}\nAudience: ${audience}\nOffer/message: ${offer}\nOwner notes: ${notes || "None"}\n\n${context}\n\nReturn ONLY valid JSON with exactly these keys: campaign_name, objective, audience, facebook_post, headline, description, call_to_action, image_brief, posting_time, paid_budget, website_support, measurement_plan, duplicate_warning, compliance_check. compliance_check must contain insurance_claim, phone_correct, website_correct, australian_spelling.`
    });
    let campaign;
    try { campaign = JSON.parse(response.output_text); }
    catch { return NextResponse.json({ error: "The AI returned an invalid campaign format. Generate again." }, { status: 502 }); }
    return NextResponse.json({ campaign, recentPostsUsed: fb.length, savedCampaignsUsed: (saved || []).length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: 500 });
  }
}
