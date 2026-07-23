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


export type ActivityInput = Pick<Activity, "event_type" | "title"> &
  Partial<Pick<Activity, "details" | "enquiry_id" | "quote_id" | "job_id">>;
