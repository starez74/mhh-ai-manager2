import { browserSupabase } from "@/lib/supabase/browser";
import type { RecordTable } from "@/lib/types/record";

export async function setArchived(
  table: RecordTable,
  id: string,
  restore = false
): Promise<void> {
  const { error } = await browserSupabase
    .from(table)
    .update({ archived_at: restore ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRecord(table: RecordTable, id: string): Promise<void> {
  const { error } = await browserSupabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
