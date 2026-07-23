import "server-only";

import OpenAI from "openai";
import { getOpenAIConfig } from "@/lib/config";
import type { Enquiry } from "@/lib/types/enquiry";
import type { QuoteDraft } from "@/lib/types/quote";

function isQuoteDraft(value: unknown): value is QuoteDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  return [
    "scope_summary",
    "risk_flags",
    "missing_information",
    "draft_message",
    "suggested_follow_up",
  ].every((key) => typeof draft[key] === "string");
}

export async function generateQuoteDraft(enquiry: Enquiry): Promise<QuoteDraft> {
  const config = getOpenAIConfig();
  const client = new OpenAI({ apiKey: config.apiKey });

  const response = await client.responses.create({
    model: config.model,
    instructions: `You are the private quote drafting assistant for Ma's Helping Hand, a furniture removals business in Nanango, Queensland.

Use Australian English. Never invent a price. Never claim the business is insured. Never promise availability. Do not state that a quote is final. Analyse the enquiry and prepare a professional draft message for Mick to edit and approve.

Return ONLY valid JSON with these keys: scope_summary, risk_flags, missing_information, draft_message, suggested_follow_up.`,
    input: JSON.stringify(enquiry),
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.output_text);
  } catch {
    throw new Error("The AI returned an invalid quote format.");
  }

  if (!isQuoteDraft(parsed)) {
    throw new Error("The AI returned an invalid quote format.");
  }

  return parsed;
}
