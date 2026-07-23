import { browserSupabase } from "@/lib/supabase/browser";
import type { CreateQuoteInput, Quote, QuoteEditableField } from "@/lib/types/quote";

const quoteColumns =
  "id,created_at,archived_at,quote_number,status,enquiry_id,customer_id,customer_name,phone,email,pickup_suburb,delivery_suburb,preferred_date,scope_summary,risk_flags,missing_information,draft_message,price_amount,deposit_amount,valid_until,internal_notes";

export async function listQuotes(): Promise<Quote[]> {
  const { data, error } = await browserSupabase
    .from("quotes")
    .select(quoteColumns)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const { enquiry, draft } = input;
  const { data, error } = await browserSupabase
    .from("quotes")
    .insert({
      user_id: input.userId,
      enquiry_id: enquiry.id,
      customer_id: enquiry.customer_id || null,
      quote_number: input.quoteNumber,
      status: "draft",
      customer_name: enquiry.customer_name,
      phone: enquiry.phone,
      email: enquiry.email || "",
      pickup_suburb: enquiry.pickup_suburb,
      delivery_suburb: enquiry.delivery_suburb,
      preferred_date: enquiry.preferred_date || "",
      scope_summary: draft.scope_summary,
      risk_flags: draft.risk_flags,
      missing_information: draft.missing_information,
      draft_message: draft.draft_message,
      price_amount: input.priceAmount,
      deposit_amount: input.depositAmount,
      valid_until: input.validUntil,
      internal_notes: input.internalNotes,
    })
    .select(quoteColumns)
    .single();

  if (error) throw error;

  const { error: enquiryError } = await browserSupabase
    .from("enquiries")
    .update({ status: "quoted", updated_at: new Date().toISOString() })
    .eq("id", enquiry.id);

  if (enquiryError) throw enquiryError;
  return data;
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
  field: QuoteEditableField,
  value: string | number | null
): Promise<void> {
  const { error } = await browserSupabase
    .from("quotes")
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
