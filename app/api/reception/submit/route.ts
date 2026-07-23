import { NextRequest } from "next/server";
import { createPublicEnquiry } from "@/lib/services/enquiryService";
import { apiError, apiSuccess, errorMessage } from "@/lib/api/responses";
import { logApiError } from "@/lib/api/logging";
import type { ReceptionSubmission } from "@/lib/types/enquiry";

function text(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input: ReceptionSubmission = {
      customer_name: text(body.customer_name, 120),
      phone: text(body.phone, 40),
      email: text(body.email, 180),
      preferred_contact: text(body.preferred_contact, 20) || "phone",
      pickup_suburb: text(body.pickup_suburb, 120),
      delivery_suburb: text(body.delivery_suburb, 120),
      preferred_date: text(body.preferred_date, 80),
      property_size: text(body.property_size, 80),
      stairs: text(body.stairs, 20) || "No",
      steep_driveway: text(body.steep_driveway, 20) || "No",
      heavy_items: text(body.heavy_items, 500),
      item_summary: text(body.item_summary, 1200),
      extra_notes: text(body.extra_notes, 1200),
    };

    if (!input.customer_name || !input.phone || !input.pickup_suburb || !input.delivery_suburb) {
      return apiError("Name, phone, pickup suburb and delivery suburb are required.", 400);
    }

    const summary = [
      `${input.customer_name} requested a furniture-removal quote from ${input.pickup_suburb} to ${input.delivery_suburb}.`,
      input.preferred_date ? `Preferred date: ${input.preferred_date}.` : "Date is flexible or not supplied.",
      input.property_size ? `Property size: ${input.property_size}.` : "",
      `Stairs: ${input.stairs}.`,
      `Steep driveway: ${input.steep_driveway}.`,
      input.heavy_items ? `Heavy items: ${input.heavy_items}.` : "No heavy items listed.",
      input.item_summary ? `Items: ${input.item_summary}.` : "",
      input.extra_notes ? `Notes: ${input.extra_notes}.` : "",
    ].filter(Boolean).join(" ");

    await createPublicEnquiry(input, summary);
    return apiSuccess({ ok: true });
  } catch (error) {
    logApiError("/api/reception/submit", error);
    return apiError(errorMessage(error, "Unable to submit enquiry."), 500);
  }
}
