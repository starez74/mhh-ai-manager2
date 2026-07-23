import { NextRequest } from "next/server";
import { getAuthenticatedRequest } from "@/lib/api/auth";
import { apiError, apiSuccess, errorMessage } from "@/lib/api/responses";
import { apiErrorStatus } from "@/lib/api/errors";
import { logApiError } from "@/lib/api/logging";
import { publishCampaign } from "@/lib/services/metaService";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRequest(request);
    if (!auth) return apiError("Your login session is invalid.", 401);

    const body = (await request.json()) as { campaignId?: unknown };
    const campaignId = String(body.campaignId ?? "").trim();
    if (!campaignId) return apiError("Campaign ID is required.", 400);

    const result = await publishCampaign(
      campaignId,
      auth.user.id,
      auth.accessToken
    );
    return apiSuccess(result);
  } catch (error) {
    logApiError("/api/meta/publish", error);
    return apiError(
      errorMessage(error, "Facebook publishing failed."),
      apiErrorStatus(error)
    );
  }
}
