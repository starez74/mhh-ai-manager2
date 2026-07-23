import { browserSupabase } from "@/lib/supabase/browser";
import type { Crew } from "@/lib/types/crew";

const crewColumns =
  "id,user_id,created_at,updated_at,name,contact_name,phone,email,skills,availability_status,is_active";

export async function listCrews(): Promise<Crew[]> {
  const { data, error } = await browserSupabase
    .from("crews")
    .select(crewColumns)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
