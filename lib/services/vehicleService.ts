import { browserSupabase } from "@/lib/supabase/browser";
import type { Vehicle } from "@/lib/types/vehicle";

const vehicleColumns =
  "id,user_id,created_at,updated_at,name,registration,vehicle_type,capacity_notes,service_due_at,inspection_due_at,availability_status,is_active";

export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await browserSupabase
    .from("vehicles")
    .select(vehicleColumns)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
