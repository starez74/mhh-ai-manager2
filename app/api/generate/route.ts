import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const prompt = `You are the private marketing manager for Ma's Helping Hand, a furniture removals business in Nanango, Queensland.

Business facts:
- Website: https://mhhremoval.com.au
- Phone: 0412 144 297
- Address: 62 Drayton St, Nanango QLD
- ABN: 70 051 256 598
- Tagline: FROM OUR HANDS TO YOUR HOME
- Furniture removals are the primary service.
- Second-hand furniture sales are secondary.

Brand:
- Deep navy #031529
- Navy #071F37
- Gold #D7A941
- Pale gold #F1D370
- Never recolour or redesign the original truck logo.

Rules:
- Use Australian English.
- Never claim the business is insured unless explicitly confirmed.
- Never invent reviews, qualifications, prices or guarantees.
- Produce drafts only.
- Include a clear call to action.`;

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Your login session is missing. Please sign out and sign back in." },
        { status: 401 }
      );
    }

    const token = authorization.slice(7).trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing in Vercel." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Your login session could not be verified. Please sign out and sign back in." },
        { status: 401 }
      );
    }

    const { objective, audience, offer, notes } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in Vercel." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: prompt,
      input: `Create a complete Facebook marketing campaign draft.

Objective: ${objective}
Audience: ${audience}
Offer or message: ${offer}
Owner notes: ${notes || "None"}

Return:
1. Campaign name
2. Objective
3. Audience
4. Primary Facebook copy
5. Headline
6. Description
7. Call to action
8. Branded image brief
9. Suggested posting time
10. Optional paid budget and duration
11. Website support suggestion
12. Measurement plan
13. Compliance check confirming no insurance claim, correct phone number, correct website, and Australian spelling.`
    });

    return NextResponse.json({ text: response.output_text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}
