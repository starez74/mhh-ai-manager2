import type { Job } from "@/lib/types/job";

export type CalendarView = "day" | "week" | "month";

export type CalendarRange = {
  start: Date;
  end: Date;
  days: Date[];
};

export type TimelineEvent = {
  job: Job;
  start: Date;
  end: Date;
  durationMinutes: number;
};

export type ScheduleConflict = {
  jobId: string;
  jobNumber: string;
  resource: "crew" | "vehicle";
  resourceName: string;
};

export type CalendarMoveInput = {
  job: Job;
  targetDate: Date;
};

export type CalendarResizeInput = {
  job: Job;
  durationMinutes: number;
};
