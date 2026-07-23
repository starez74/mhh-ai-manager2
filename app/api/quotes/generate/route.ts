import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/services/serverAuthService";
import { generateQuoteDraft } from "@/lib/services/quoteGenerationService";
import { apiError, apiSuccess, errorMessage } from "@/lib/api/responses";
import type { Enquiry } from "@/lib/types/enquiry";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) return apiError("Unauthorised.", 401);

    const body: unknown = await request.json();
    const enquiry = (body as { enquiry?: Enquiry }).enquiry;
    if (!enquiry?.customer_name || !enquiry.pickup_suburb || !enquiry.delivery_suburb) {
      return apiError("The enquiry is missing required details.", 400);
    }

    const quote = await generateQuoteDraft(enquiry);
    return apiSuccess({ quote });
  } catch (error) {
    const message = errorMessage(error, "Unexpected quote-generation error.");
    return apiError(
      message === "The AI returned an invalid quote format." ? message : message,
      message.includes("invalid quote format") ? 502 : 500
    );
  }
}
