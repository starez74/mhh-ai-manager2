import { browserSupabase } from "@/lib/supabase/browser";
import type { Customer, CustomerInput } from "@/lib/types/customer";
import type { Enquiry } from "@/lib/types/enquiry";

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await browserSupabase
    .from("customers")
    .select("id,created_at,archived_at,name,phone,email,preferred_contact,address,notes,status")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCustomer(userId: string, input: CustomerInput): Promise<void> {
  const { error } = await browserSupabase
    .from("customers")
    .insert({ user_id: userId, ...input, status: "active" });
  if (error) throw error;
}

export async function convertEnquiryToCustomer(
  userId: string,
  enquiry: Enquiry
): Promise<Customer> {
  const { data, error } = await browserSupabase
    .from("customers")
    .insert({
      user_id: userId,
      name: enquiry.customer_name,
      phone: enquiry.phone,
      email: enquiry.email || "",
      preferred_contact: enquiry.preferred_contact || "phone",
      address: "",
      notes: enquiry.ai_summary || enquiry.extra_notes || "",
      status: "active",
    })
    .select("id,created_at,archived_at,name,phone,email,preferred_contact,address,notes,status")
    .single();
  if (error) throw error;

  const nextStatus = enquiry.status === "new" ? "contacted" : enquiry.status;
  const { error: enquiryError } = await browserSupabase
    .from("enquiries")
    .update({
      customer_id: data.id,
      converted_at: new Date().toISOString(),
      status: nextStatus,
    })
    .eq("id", enquiry.id);
  if (enquiryError) throw enquiryError;

  return data;
}
