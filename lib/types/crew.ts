export type CrewAvailabilityStatus = "available" | "busy" | "leave";

export type Crew = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  skills: string[];
  availability_status: CrewAvailabilityStatus;
  is_active: boolean;
};

export type CrewInput = {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  skills: string[];
  availability_status: CrewAvailabilityStatus;
};
