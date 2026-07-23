import { browserSupabase } from "@/lib/supabase/browser";
import type { Vehicle, VehicleInput } from "@/lib/types/vehicle";

const vehicleColumns =
  "id,user_id,created_at,updated_at,name,registration,vehicle_type,capacity_notes,service_due_at,inspection_due_at,availability_status,is_active";

export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await browserSupabase
    .from("vehicles")
    .select(vehicleColumns)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

function validateVehicle(input: VehicleInput): VehicleInput {
  const name = input.name.trim();
  if (!name) throw new Error("Vehicle name is required.");

  return {
    ...input,
    name,
    registration: input.registration.trim().toUpperCase(),
    vehicle_type: input.vehicle_type.trim(),
    capacity_notes: input.capacity_notes.trim(),
  };
}

export async function createVehicle(
  userId: string,
  input: VehicleInput
): Promise<Vehicle> {
  const values = validateVehicle(input);
  const { data, error } = await browserSupabase
    .from("vehicles")
    .insert({ user_id: userId, ...values })
    .select(vehicleColumns)
    .single();

  if (error) throw error;
  return data;
}

export async function updateVehicle(
  id: string,
  input: VehicleInput
): Promise<Vehicle> {
  const values = validateVehicle(input);
  const { data, error } = await browserSupabase
    .from("vehicles")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(vehicleColumns)
    .single();

  if (error) throw error;
  return data;
}

export async function setVehicleArchived(
  id: string,
  archived: boolean
): Promise<void> {
  const { error } = await browserSupabase
    .from("vehicles")
    .update({
      is_active: !archived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}
