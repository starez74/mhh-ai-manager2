import { browserSupabase } from "@/lib/supabase/browser";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Enquiry, ReceptionSubmission } from "@/lib/types/enquiry";

export async function listEnquiries(): Promise<Enquiry[]> {
  const { data, error } = await browserSupabase
    .from("enquiries")
    .select("id,created_at,archived_at,status,source,customer_name,phone,email,preferred_contact,pickup_suburb,delivery_suburb,preferred_date,property_size,stairs,steep_driveway,heavy_items,item_summary,extra_notes,ai_summary,follow_up_at,customer_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateEnquiryStatus(id: string, status: string): Promise<void> {
  const { error } = await browserSupabase
    .from("enquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateEnquiryFollowUp(id: string, value: string): Promise<void> {
  const follow_up_at = value ? new Date(value).toISOString() : null;
  const { error } = await browserSupabase
    .from("enquiries")
    .update({ follow_up_at })
    .eq("id", id);
  if (error) throw error;
}

export async function createPublicEnquiry(
  input: ReceptionSubmission,
  summary: string
): Promise<void> {
  const { error } = await createServerSupabase().from("enquiries").insert({
    user_id: null,
    source: "website",
    status: "new",
    ...input,
    ai_summary: summary,
  });
  if (error) throw error;
}
