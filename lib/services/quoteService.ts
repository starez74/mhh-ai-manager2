import OpenAI from "openai";
import { browserSupabase } from "@/lib/supabase/browser";
import { getServerConfig } from "@/lib/config";
import type { Enquiry } from "@/lib/types/enquiry";
import type { Quote, QuoteDraft } from "@/lib/types/quote";

export async function listQuotes(): Promise<Quote[]> {
  const { data, error } = await browserSupabase
    .from("quotes")
    .select("id,created_at,archived_at,quote_number,status,enquiry_id,customer_id,customer_name,phone,email,pickup_suburb,delivery_suburb,preferred_date,scope_summary,risk_flags,missing_information,draft_message,price_amount,deposit_amount,valid_until,internal_notes")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateQuoteStatus(id: string, status: string): Promise<void> {
  const { error } = await browserSupabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateQuoteField(
  id: string,
  field: string,
  value: unknown
): Promise<void> {
  const { error } = await browserSupabase
    .from("quotes")
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function generateQuoteDraft(enquiry: Enquiry): Promise<QuoteDraft> {
  const config = getServerConfig();
  const client = new OpenAI({ apiKey: config.openAiApiKey });
  const response = await client.responses.create({
    model: config.openAiModel,
    instructions: `You are the private quote drafting assistant for Ma's Helping Hand, a furniture removals business in Nanango, Queensland.

Use Australian English. Never invent a price. Never claim the business is insured. Never promise availability. Do not state that a quote is final. Analyse the enquiry and prepare a professional draft message for Mick to edit and approve.

Return ONLY valid JSON with these keys: scope_summary, risk_flags, missing_information, draft_message, suggested_follow_up.`,
    input: JSON.stringify(enquiry),
  });

  const parsed: unknown = JSON.parse(response.output_text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("The AI returned an invalid quote format.");
  }
  return parsed as QuoteDraft;
}
