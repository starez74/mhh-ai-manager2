import { browserSupabase } from "@/lib/supabase/browser";
import type { Job } from "@/lib/types/job";

export async function listJobs(): Promise<Job[]> {
  const { data, error } = await browserSupabase
    .from("jobs")
    .select("id,created_at,archived_at,job_number,status,quote_id,enquiry_id,customer_id,customer_name,phone,email,scheduled_start,scheduled_end,pickup_address,delivery_address,pickup_suburb,delivery_suburb,crew,vehicle,scope_summary,special_instructions,quoted_amount,paid_amount")
    .order("scheduled_start", { ascending: true });
  if (error) throw error;
  return data ?? [];
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
  field: string,
  value: unknown
): Promise<void> {
  const finalValue =
    (field === "scheduled_start" || field === "scheduled_end") && value
      ? new Date(String(value)).toISOString()
      : value;
  const { error } = await browserSupabase
    .from("jobs")
    .update({ [field]: finalValue, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
