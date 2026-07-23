import "server-only";

import OpenAI from "openai";
import { ApiRouteError } from "@/lib/api/errors";
import { getMetaConfig, getOpenAIConfig } from "@/lib/config";
import { createServerSupabase } from "@/lib/supabase/server";

const BUSINESS = `You are the private marketing manager for Ma's Helping Hand, a furniture removals business in Nanango, Queensland, Australia.
Verified facts: website https://mhhremoval.com.au; phone 0412 144 297; address 62 Drayton St, Nanango QLD; ABN 70 051 256 598; tagline FROM OUR HANDS TO YOUR HOME. Furniture removals are primary and second-hand furniture sales are secondary. Service area is Nanango, Kingaroy and the South Burnett when relevant.
Brand: deep navy #031529, navy #071F37, gold #D7A941, pale gold #F1D370, white text, original truck logo never recoloured or redesigned.
Rules: use Australian English; never claim insurance unless explicitly confirmed; never invent reviews, licences, qualifications, prices, discounts or guarantees; never claim unverified services; create drafts only; keep copy natural and local; include phone or website in the CTA; avoid repeating recent Page posts and saved campaigns.`;

type CampaignRequest = {
  objective?: unknown;
  audience?: unknown;
  offer?: unknown;
  notes?: unknown;
};

type RecentPost = {
  created_time?: string;
  message?: string;
};

type SavedCampaign = {
  title?: string;
  facebook_post?: string;
  content?: string;
  created_at?: string;
};

async function recentFacebookPosts(): Promise<RecentPost[]> {
  const config = getMetaConfig();
  if (!config.pageId || !config.pageAccessToken) return [];

  try {
    const fields = "message,created_time";
    const url =
      `https://graph.facebook.com/${config.graphApiVersion}/${encodeURIComponent(config.pageId)}/posts` +
      `?fields=${encodeURIComponent(fields)}&limit=15` +
      `&access_token=${encodeURIComponent(config.pageAccessToken)}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];

    const data = (await response.json()) as { data?: RecentPost[] };
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

export async function generateCampaignDraft(
  request: CampaignRequest,
  accessToken: string
) {
  const openAI = getOpenAIConfig();
  const facebookPosts = await recentFacebookPosts();
  const supabase = createServerSupabase(accessToken);

  const { data: saved, error } = await supabase
    .from("campaigns")
    .select("title,facebook_post,content,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new ApiRouteError(error.message, 500);
  }

  const savedCampaigns = (saved ?? []) as SavedCampaign[];
  const context = [
    "RECENT FACEBOOK POSTS:",
    ...(facebookPosts.length
      ? facebookPosts.map(
          (post, index) =>
            `${index + 1}. ${post.created_time}: ${post.message || "(no text)"}`
        )
      : ["None available"]),
    "RECENT SAVED CAMPAIGNS:",
    ...(savedCampaigns.length
      ? savedCampaigns.map(
          (campaign, index) =>
            `${index + 1}. ${campaign.created_at}: ${campaign.title} — ${
              campaign.facebook_post || campaign.content
            }`
        )
      : ["None saved"]),
  ].join("\n");

  const client = new OpenAI({ apiKey: openAI.apiKey });
  const response = await client.responses.create({
    model: openAI.model,
    instructions: BUSINESS,
    input: `Create a new Facebook campaign.
Objective: ${String(request.objective ?? "")}
Audience: ${String(request.audience ?? "")}
Offer/message: ${String(request.offer ?? "")}
Owner notes: ${String(request.notes ?? "None")}

${context}

Return ONLY valid JSON with exactly these keys: campaign_name, objective, audience, facebook_post, headline, description, call_to_action, image_brief, posting_time, paid_budget, website_support, measurement_plan, duplicate_warning, compliance_check. compliance_check must contain insurance_claim, phone_correct, website_correct, australian_spelling.`,
  });

  let campaign: unknown;
  try {
    campaign = JSON.parse(response.output_text);
  } catch {
    throw new ApiRouteError(
      "The AI returned an invalid campaign format. Generate again.",
      502
    );
  }

  return {
    campaign,
    recentPostsUsed: facebookPosts.length,
    savedCampaignsUsed: savedCampaigns.length,
  };
}
