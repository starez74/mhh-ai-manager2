import { browserSupabase } from "@/lib/supabase/browser";

export async function getBrowserSession() {
  const { data, error } = await browserSupabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signOut() {
  const { error } = await browserSupabase.auth.signOut();

  if (error) {
    throw error;
  }
}