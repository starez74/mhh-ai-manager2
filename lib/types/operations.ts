import type { Job } from "@/lib/types/job";

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
