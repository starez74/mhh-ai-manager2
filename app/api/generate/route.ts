import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const prompt = `You are the private marketing manager for Ma's Helping Hand, a furniture removals business in Nanango, Queensland.

Verified business facts:
- Website: https://mhhremoval.com.au
- Phone: 0412 144 297
- Address: 62 Drayton St, Nanango QLD
- ABN: 70 051 256 598
- Tagline: FROM OUR HANDS TO YOUR HOME
- Furniture removals are the primary service.
- Second-hand furniture sales are secondary.
- Main area: Nanango, Kingaroy and the South Burnett when relevant.

Brand:
- Deep navy #031529
- Navy #071F37
- Gold #D7A941
- Pale gold #F1D370
- Never recolour or redesign the original truck logo.

Rules:
- Use Australian English.
- Never claim insurance unless the owner explicitly confirms it.
- Never invent reviews, qualifications, prices, discounts or guarantees.
- Never claim unconfirmed services.
- Produce drafts only.
- Include a clear call to action using 0412 144 297 or mhhremoval.com.au.
- Compare the new campaign with recent Facebook posts and avoid repeating hooks, topics and wording.`;

async function verifyUser(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await supabase.auth.getUser(token);
  return data.user ?? null;
}

async function recentPagePosts() {
  const pageId = process.env.META_PAGE_ID;
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_API_VERSION || "v25.0";
  if (!pageId || !pageToken) return [];
  const fields = "message,created_time";
  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/posts?fields=${encodeURIComponent(fields)}&limit=15&access_token=${encodeURIComponent(pageToken)}`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyUser(req);
    if (!user) return NextResponse.json({ error: "Your login session could not be verified. Please sign out and sign back in." }, { status: 401 });
    const { objective, audience, offer, notes } = await req.json();
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is missing in Vercel." }, { status: 500 });

    const posts = await recentPagePosts();
    const recent = posts.length
      ? posts.map((p:any,i:number)=>`${i+1}. ${p.created_time}: ${p.message || "(post without text)"}`).join("\n")
      : "No recent Page posts were available.";

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: prompt,
      input: `Create a complete Facebook campaign draft.\n\nObjective: ${objective}\nAudience: ${audience}\nOffer/message: ${offer}\nOwner notes: ${notes || "None"}\n\nRecent Ma's Helping Hand Facebook posts:\n${recent}\n\nReturn these exact sections:\n1. Campaign name\n2. Objective\n3. Audience\n4. Primary Facebook copy\n5. Headline\n6. Description\n7. Call to action\n8. Branded image brief\n9. Suggested posting time\n10. Optional paid budget and duration\n11. Website support suggestion\n12. Measurement plan\n13. Duplicate-content check explaining whether the topic, hook or wording overlaps with recent posts\n14. Compliance check confirming no insurance claim, correct phone number, correct website and Australian spelling.`
    });
    return NextResponse.json({ text: response.output_text, recentPostsUsed: posts.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: 500 });
  }
}
