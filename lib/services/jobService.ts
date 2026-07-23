import { browserSupabase } from "@/lib/supabase/browser";
import type { CreateJobInput, Job, JobEditableField } from "@/lib/types/job";

const jobColumns =
  "id,created_at,archived_at,job_number,status,quote_id,enquiry_id,customer_id,customer_name,phone,email,scheduled_start,scheduled_end,pickup_address,delivery_address,pickup_suburb,delivery_suburb,crew,vehicle,scope_summary,special_instructions,quoted_amount,paid_amount";

export async function listJobs(): Promise<Job[]> {
  const { data, error } = await browserSupabase
    .from("jobs")
    .select(jobColumns)
    .order("scheduled_start", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createJobFromQuote(input: CreateJobInput): Promise<Job> {
  const { quote, form } = input;
  const { data, error } = await browserSupabase
    .from("jobs")
    .insert({
      user_id: input.userId,
      enquiry_id: quote.enquiry_id || null,
      quote_id: quote.id,
      customer_id: quote.customer_id || null,
      job_number: input.jobNumber,
      status: "booked",
      customer_name: quote.customer_name,
      phone: quote.phone,
      email: quote.email || "",
      scheduled_start: new Date(form.scheduled_start).toISOString(),
      scheduled_end: form.scheduled_end
        ? new Date(form.scheduled_end).toISOString()
        : null,
      pickup_address: form.pickup_address,
      delivery_address: form.delivery_address,
      pickup_suburb: quote.pickup_suburb,
      delivery_suburb: quote.delivery_suburb,
      crew: form.crew,
      vehicle: form.vehicle,
      scope_summary: quote.scope_summary,
      special_instructions: form.special_instructions,
      quoted_amount: quote.price_amount || null,
      paid_amount: 0,
    })
    .select(jobColumns)
    .single();

  if (error) throw error;

  const { error: quoteError } = await browserSupabase
    .from("quotes")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", quote.id);

  if (quoteError) throw quoteError;

  if (quote.enquiry_id) {
    const { error: enquiryError } = await browserSupabase
      .from("enquiries")
      .update({ status: "booked", updated_at: new Date().toISOString() })
      .eq("id", quote.enquiry_id);

    if (enquiryError) throw enquiryError;
  }

  return data;
}

export async function updateJobStatus(id: string, status: string): Promise<void> {
  const { error } = await browserSupabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function updateJobField(
  id: string,
  field: JobEditableField,
  value: string | number | null
): Promise<string | number | null> {
  const finalValue =
    (field === "scheduled_start" || field === "scheduled_end") && value
      ? new Date(String(value)).toISOString()
      : value;

  const { error } = await browserSupabase
    .from("jobs")
    .update({ [field]: finalValue, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  return finalValue;
}
