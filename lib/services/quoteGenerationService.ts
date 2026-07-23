import "server-only";

import OpenAI from "openai";
import { getOpenAIConfig } from "@/lib/config";
import type { Enquiry } from "@/lib/types/enquiry";
import type { QuoteDraft } from "@/lib/types/quote";

const QUOTE_KEYS = [
  "scope_summary",
  "risk_flags",
  "missing_information",
  "draft_message",
  "suggested_follow_up",
] as const;

function normaliseText(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.map((item) => item.trim()).filter(Boolean).join("\n");
  }

  return null;
}

function parseQuoteDraft(outputText: string): QuoteDraft {
  const trimmed = outputText.trim();

  // Some models may still wrap JSON in a Markdown code fence.
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(withoutFence);
  } catch {
    // Fall back to the first complete-looking JSON object.
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");

    if (start === -1 || end <= start) {
      throw new Error("The AI returned an invalid quote format.");
    }

    try {
      parsed = JSON.parse(withoutFence.slice(start, end + 1));
    } catch {
      throw new Error("The AI returned an invalid quote format.");
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The AI returned an invalid quote format.");
  }

  const record = parsed as Record<string, unknown>;
  const normalised: Record<string, string> = {};

  for (const key of QUOTE_KEYS) {
    const value = normaliseText(record[key]);

    if (value === null) {
      throw new Error(`The AI returned an invalid value for "${key}".`);
    }

    normalised[key] = value;
  }

  return normalised as QuoteDraft;
}

export async function generateQuoteDraft(enquiry: Enquiry): Promise<QuoteDraft> {
  const config = getOpenAIConfig();
  const client = new OpenAI({ apiKey: config.apiKey });

  const response = await client.responses.create({
    model: config.model,
    instructions: `You are the private quote drafting assistant for Ma's Helping Hand, a furniture removals business in Nanango, Queensland.

Use Australian English. Never invent a price. Never claim the business is insured. Never promise availability. Do not state that a quote is final. Analyse the enquiry and prepare a professional draft message for Mick to edit and approve.

Return ONLY one valid JSON object. Do not use Markdown or code fences.

Every value MUST be a string. Use newline-separated text inside a string when listing multiple items.

The object must contain exactly these keys:
- scope_summary
- risk_flags
- missing_information
- draft_message
- suggested_follow_up`,
    input: JSON.stringify(enquiry),
  });

  if (!response.output_text?.trim()) {
    throw new Error("The AI returned an empty quote response.");
  }

  return parseQuoteDraft(response.output_text);
}
