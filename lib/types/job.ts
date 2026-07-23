export type Job = {
  id: string;
  created_at: string;
  archived_at?: string | null;
  job_number: string;
  status: string;
  quote_id?: string;
  enquiry_id?: string;
  customer_id?: string;
  customer_name: string;
  phone: string;
  email: string;
  scheduled_start?: string;
  scheduled_end?: string;
  pickup_address: string;
  delivery_address: string;
  pickup_suburb: string;
  delivery_suburb: string;
  crew: string;
  vehicle: string;
  scope_summary: string;
  special_instructions: string;
  quoted_amount?: number;
  paid_amount: number;
};

export type JobForm = {
  scheduled_start: string;
  scheduled_end: string;
  pickup_address: string;
  delivery_address: string;
  crew: string;
  vehicle: string;
  special_instructions: string;
};


export type CreateJobInput = {
  userId: string;
  quote: import("@/lib/types/quote").Quote;
  form: JobForm;
  jobNumber: string;
};

export type JobEditableField =
  | "scheduled_start"
  | "scheduled_end"
  | "pickup_address"
  | "delivery_address"
  | "crew"
  | "vehicle"
  | "special_instructions"
  | "paid_amount";
