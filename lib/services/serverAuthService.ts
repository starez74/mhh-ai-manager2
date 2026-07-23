import "server-only";

import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

export function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();
  return token || null;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<User | null> {
  const token = bearerToken(request);

  if (!token) {
    return null;
  }

  const { data, error } = await createServerSupabase().auth.getUser(token);

  if (error) {
    return null;
  }

  return data.user ?? null;
}