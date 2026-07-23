export type Activity = {
  id: string;
  created_at: string;
  enquiry_id?: string;
  quote_id?: string;
  job_id?: string;
  event_type: string;
  title: string;
  details: string;
};
