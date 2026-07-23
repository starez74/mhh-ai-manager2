export type Enquiry = {
  id: string;
  created_at: string;
  archived_at?: string | null;
  status: string;
  source: string;
  customer_name: string;
  phone: string;
  email: string;
  preferred_contact: string;
  pickup_suburb: string;
  delivery_suburb: string;
  preferred_date: string;
  property_size: string;
  stairs: string;
  steep_driveway: string;
  heavy_items: string;
  item_summary: string;
  extra_notes: string;
  ai_summary: string;
  follow_up_at?: string;
  customer_id?: string;
};

export type ReceptionSubmission = Omit<
  Enquiry,
  "id" | "created_at" | "archived_at" | "status" | "source" | "ai_summary" | "follow_up_at" | "customer_id"
>;
