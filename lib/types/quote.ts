export type Quote = {
  id: string;
  created_at: string;
  archived_at?: string | null;
  quote_number: string;
  status: string;
  enquiry_id?: string;
  customer_id?: string;
  customer_name: string;
  phone: string;
  email: string;
  pickup_suburb: string;
  delivery_suburb: string;
  preferred_date: string;
  scope_summary: string;
  risk_flags: string;
  missing_information: string;
  draft_message: string;
  price_amount?: number;
  deposit_amount?: number;
  valid_until?: string;
  internal_notes: string;
};

export type QuoteDraft = {
  scope_summary: string;
  risk_flags: string;
  missing_information: string;
  draft_message: string;
  suggested_follow_up: string;
};
