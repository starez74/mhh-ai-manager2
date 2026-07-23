import { NextRequest } from "next/server";
import { getAuthenticatedRequest } from "@/lib/api/auth";
import { apiError, apiSuccess, errorMessage } from "@/lib/api/responses";
import { logApiError } from "@/lib/api/logging";
import { getMetaConnectionStatus } from "@/lib/services/metaService";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedRequest(request);
  if (!auth) {
    return apiSuccess(
      { connected: false, error: "Your login session is invalid." },
      401
    );
  }

  try {
    return apiSuccess(await getMetaConnectionStatus());
  } catch (error) {
    logApiError("/api/meta", error);
    return apiSuccess({
      connected: false,
      syncedAt: new Date().toISOString(),
      stage: "network",
      message: errorMessage(error, "Meta connection failed."),
    });
  }
}
