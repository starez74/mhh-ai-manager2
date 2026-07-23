export type VehicleAvailabilityStatus =
  | "available"
  | "busy"
  | "maintenance";

export type Vehicle = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  registration: string;
  vehicle_type: string;
  capacity_notes: string;
  service_due_at: string | null;
  inspection_due_at: string | null;
  availability_status: VehicleAvailabilityStatus;
  is_active: boolean;
};

export type VehicleInput = {
  name: string;
  registration: string;
  vehicle_type: string;
  capacity_notes: string;
  service_due_at: string | null;
  inspection_due_at: string | null;
  availability_status: VehicleAvailabilityStatus;
};
