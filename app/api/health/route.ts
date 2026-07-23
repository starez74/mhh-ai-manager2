import { NextRequest } from "next/server";
import { getAuthenticatedRequest } from "@/lib/api/auth";
import { apiError, apiSuccess, errorMessage } from "@/lib/api/responses";
import { logApiError } from "@/lib/api/logging";
import { runHealthChecks } from "@/lib/services/healthService";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRequest(request);
    if (!auth) return apiError("Unauthorised.", 401);

    const result = await runHealthChecks(auth.user.id, auth.accessToken);
    return apiSuccess(result);
  } catch (error) {
    logApiError("/api/health", error);
    return apiError(errorMessage(error, "Unable to run health checks."), 500);
  }
}
