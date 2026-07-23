export type DashboardStats = {
  newLeads: number;
  openQuotes: number;
  upcomingJobs: number;
  followUps: number;
};

export type HealthCheck = {
  key: string;
  label: string;
  status: "healthy" | "warning" | "error";
  message: string;
  checkedAt: string;
};

export type DashboardView =
  | "dashboard"
  | "operations"
  | "enquiries"
  | "quotes"
  | "jobs"
  | "customers"
  | "receptionist"
  | "marketing"
  | "facebook"
  | "connections"
  | "settings";
