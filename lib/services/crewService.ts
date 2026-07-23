import { browserSupabase } from "@/lib/supabase/browser";
import type { Crew, CrewInput } from "@/lib/types/crew";

const crewColumns =
  "id,user_id,created_at,updated_at,name,contact_name,phone,email,skills,availability_status,is_active";

export async function listCrews(): Promise<Crew[]> {
  const { data, error } = await browserSupabase
    .from("crews")
    .select(crewColumns)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

function validateCrew(input: CrewInput): CrewInput {
  const name = input.name.trim();
  if (!name) throw new Error("Crew name is required.");

  return {
    ...input,
    name,
    contact_name: input.contact_name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    skills: input.skills.map(skill => skill.trim()).filter(Boolean),
  };
}

export async function createCrew(
  userId: string,
  input: CrewInput
): Promise<Crew> {
  const values = validateCrew(input);
  const { data, error } = await browserSupabase
    .from("crews")
    .insert({ user_id: userId, ...values })
    .select(crewColumns)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCrew(
  id: string,
  input: CrewInput
): Promise<Crew> {
  const values = validateCrew(input);
  const { data, error } = await browserSupabase
    .from("crews")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(crewColumns)
    .single();

  if (error) throw error;
  return data;
}

export async function setCrewArchived(
  id: string,
  archived: boolean
): Promise<void> {
  const { error } = await browserSupabase
    .from("crews")
    .update({
      is_active: !archived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}
