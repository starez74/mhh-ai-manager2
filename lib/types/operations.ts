import type { Job } from "@/lib/types/job";

export interface DispatchAssignmentResult {
  scheduled_start: string | null;
  scheduled_end: string | null;
  crew: string;
  vehicle: string;
};

export interface DispatchAssignmentInput {
  crew: string;
  vehicle: string;
  scheduledStart: string;
  scheduledEnd: string;
};

export type OperationsSummary = {
  today: Job[];
  upcoming: Job[];
  unscheduled: Job[];
  needsAttention: Job[];
};

export type OperationsJobGroup = {
  key: string;
  label: string;
  jobs: Job[];
};

export type OperationsScheduleKey =
  | "unscheduled"
  | "today"
  | "tomorrow"
  | "this-week";

export type OperationsScheduleGroup = {
  key: OperationsScheduleKey;
  label: string;
  jobs: Job[];
};

export type OperationsAssignmentFilter =
  | "all"
  | "assigned"
  | "unassigned";

export type OperationsFilters = {
  assignment: OperationsAssignmentFilter;
  needsAttention: boolean;
  status: string;
};

export type DispatchSummary = {
  dueToday: number;
  overdue: number;
  vehiclesAllocated: number;
  crewsAllocated: number;
};
