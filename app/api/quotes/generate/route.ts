import { NextRequest } from "next/server";
import { getAuthenticatedRequest } from "@/lib/api/auth";
import { generateQuoteDraft } from "@/lib/services/quoteGenerationService";
import { apiError, apiSuccess, errorMessage } from "@/lib/api/responses";
import { logApiError } from "@/lib/api/logging";
import type { Enquiry } from "@/lib/types/enquiry";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRequest(request);
    if (!auth) return apiError("Unauthorised.", 401);

    const body: unknown = await request.json();
    const enquiry = (body as { enquiry?: Enquiry }).enquiry;
    if (!enquiry?.customer_name || !enquiry.pickup_suburb || !enquiry.delivery_suburb) {
      return apiError("The enquiry is missing required details.", 400);
    }

    const quote = await generateQuoteDraft(enquiry);
    return apiSuccess({ quote });
  } catch (error) {
    logApiError("/api/quotes/generate", error);
    const message = errorMessage(error, "Unexpected quote-generation error.");
    return apiError(message, message.includes("invalid quote format") ? 502 : 500);
  }
}
