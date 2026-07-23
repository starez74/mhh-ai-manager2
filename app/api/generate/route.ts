import { NextRequest } from "next/server";
import { getAuthenticatedRequest } from "@/lib/api/auth";
import { apiError, apiSuccess, errorMessage } from "@/lib/api/responses";
import { apiErrorStatus } from "@/lib/api/errors";
import { logApiError } from "@/lib/api/logging";
import { generateCampaignDraft } from "@/lib/services/marketingService";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRequest(request);
    if (!auth) {
      return apiError(
        "Your login session could not be verified. Please sign out and sign back in.",
        401
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const result = await generateCampaignDraft(body, auth.accessToken);
    return apiSuccess(result);
  } catch (error) {
    logApiError("/api/generate", error);
    return apiError(
      errorMessage(error, "Unexpected server error."),
      apiErrorStatus(error)
    );
  }
}
