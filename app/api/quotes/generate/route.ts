import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data } = await supabase.auth.getUser(token);
  return data.user || null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });
    }

    const { enquiry } = await req.json();
    if (!enquiry?.customer_name || !enquiry?.pickup_suburb || !enquiry?.delivery_suburb) {
      return NextResponse.json({ error: "The enquiry is missing required details." }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: `You are the private quote drafting assistant for Ma's Helping Hand, a furniture removals business in Nanango, Queensland.

Use Australian English. Never invent a price. Never claim the business is insured. Never promise availability. Do not state that a quote is final. Analyse the enquiry and prepare a professional draft message for Mick to edit and approve.

The draft message should:
- thank the customer;
- summarise the move;
- clearly state any information still required;
- say that pricing and availability will be confirmed after review;
- include phone 0412 144 297;
- be friendly and practical.

Return ONLY valid JSON with this structure:
{
  "scope_summary": "concise internal scope summary",
  "risk_flags": "access, heavy item, distance or timing flags; or None identified",
  "missing_information": "specific missing details; or No critical information missing",
  "draft_message": "customer-facing draft quote response without a price",
  "suggested_follow_up": "short recommended next action"
}`,
      input: JSON.stringify(enquiry)
    });

    try {
      return NextResponse.json({ quote: JSON.parse(response.output_text) });
    } catch {
      return NextResponse.json({ error: "The AI returned an invalid quote format." }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected quote-generation error." },
      { status: 500 }
    );
  }
}
