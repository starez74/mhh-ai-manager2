import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { authenticateRequest, bearerToken } from "@/lib/services/serverAuthService";

export type AuthenticatedRequest = {
  user: User;
  accessToken: string;
};

export async function getAuthenticatedRequest(
  request: NextRequest
): Promise<AuthenticatedRequest | null> {
  const accessToken = bearerToken(request);
  if (!accessToken) return null;

  const user = await authenticateRequest(request);
  return user ? { user, accessToken } : null;
}
