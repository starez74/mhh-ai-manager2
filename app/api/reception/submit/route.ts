import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function text(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = text(body.customer_name, 120);
    const phone = text(body.phone, 40);
    const pickup = text(body.pickup_suburb, 120);
    const delivery = text(body.delivery_suburb, 120);

    if (!name || !phone || !pickup || !delivery) {
      return NextResponse.json(
        { error: "Name, phone, pickup suburb and delivery suburb are required." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const summary = [
      `${name} requested a furniture-removal quote from ${pickup} to ${delivery}.`,
      body.preferred_date ? `Preferred date: ${text(body.preferred_date, 80)}.` : "Date is flexible or not supplied.",
      body.property_size ? `Property size: ${text(body.property_size, 80)}.` : "",
      `Stairs: ${text(body.stairs, 20) || "No"}.`,
      `Steep driveway: ${text(body.steep_driveway, 20) || "No"}.`,
      body.heavy_items ? `Heavy items: ${text(body.heavy_items, 500)}.` : "No heavy items listed.",
      body.item_summary ? `Items: ${text(body.item_summary, 1200)}.` : "",
      body.extra_notes ? `Notes: ${text(body.extra_notes, 1200)}.` : ""
    ].filter(Boolean).join(" ");

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase.from("enquiries").insert({
      user_id: null,
      source: "website",
      status: "new",
      customer_name: name,
      phone,
      email: text(body.email, 180),
      preferred_contact: text(body.preferred_contact, 20) || "phone",
      pickup_suburb: pickup,
      delivery_suburb: delivery,
      preferred_date: text(body.preferred_date, 80),
      property_size: text(body.property_size, 80),
      stairs: text(body.stairs, 20) || "No",
      steep_driveway: text(body.steep_driveway, 20) || "No",
      heavy_items: text(body.heavy_items, 500),
      item_summary: text(body.item_summary, 1200),
      extra_notes: text(body.extra_notes, 1200),
      ai_summary: summary
    }).select("id").single();

    if (error) throw error;
    return NextResponse.json({ ok: true, enquiryId: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit enquiry." },
      { status: 500 }
    );
  }
}
