import { browserSupabase } from "@/lib/supabase/browser";
import type { Activity, ActivityInput } from "@/lib/types/activity";

export async function listActivities(): Promise<Activity[]> {
  const { data, error } = await browserSupabase
    .from("activity_events")
    .select("id,created_at,enquiry_id,quote_id,job_id,event_type,title,details")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function recordActivity(
  userId: string,
  values: ActivityInput
): Promise<void> {
  const { error } = await browserSupabase.from("activity_events").insert({
    user_id: userId,
    event_type: values.event_type || "update",
    title: values.title || "Updated",
    details: values.details || "",
    enquiry_id: values.enquiry_id || null,
    quote_id: values.quote_id || null,
    job_id: values.job_id || null,
  });
  if (error) throw error;
}
