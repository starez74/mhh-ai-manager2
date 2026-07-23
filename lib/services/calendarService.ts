import type { Job } from "@/lib/types/job";
import type {
  CalendarRange,
  CalendarView,
  ScheduleConflict,
  TimelineEvent,
} from "@/lib/types/calendar";

const ACTIVE_STATUSES = new Set(["booked", "confirmed", "in_progress"]);
const DEFAULT_DURATION_MINUTES = 120;

function startOfDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(value: Date, amount: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(value: Date): Date {
  const result = startOfDay(value);
  const mondayOffset = (result.getDay() + 6) % 7;
  return addDays(result, -mondayOffset);
}

function startOfMonthGrid(value: Date): Date {
  const first = new Date(value.getFullYear(), value.getMonth(), 1);
  return startOfWeek(first);
}

function endOfMonthGrid(value: Date): Date {
  const last = new Date(value.getFullYear(), value.getMonth() + 1, 0);
  const start = startOfWeek(last);
  return endOfDay(addDays(start, 6));
}

function dateRangeDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let current = startOfDay(start);

  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }

  return days;
}

function normalisedEnd(job: Job, start: Date): Date {
  if (job.scheduled_end) {
    const end = new Date(job.scheduled_end);
    if (!Number.isNaN(end.getTime()) && end > start) return end;
  }

  return new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60_000);
}

function isActive(job: Job): boolean {
  return !job.archived_at && ACTIVE_STATUSES.has(job.status);
}

export function buildCalendarRange(
  anchor: Date,
  view: CalendarView
): CalendarRange {
  if (view === "day") {
    const start = startOfDay(anchor);
    return { start, end: endOfDay(anchor), days: [start] };
  }

  if (view === "week") {
    const start = startOfWeek(anchor);
    const end = endOfDay(addDays(start, 6));
    return { start, end, days: dateRangeDays(start, end) };
  }

  const start = startOfMonthGrid(anchor);
  const end = endOfMonthGrid(anchor);
  return { start, end, days: dateRangeDays(start, end) };
}

export function shiftCalendarAnchor(
  anchor: Date,
  view: CalendarView,
  direction: -1 | 1
): Date {
  const result = new Date(anchor);

  if (view === "day") result.setDate(result.getDate() + direction);
  if (view === "week") result.setDate(result.getDate() + direction * 7);
  if (view === "month") result.setMonth(result.getMonth() + direction);

  return result;
}

export function buildTimelineEvents(
  jobs: Job[],
  range: CalendarRange
): TimelineEvent[] {
  return jobs
    .filter(isActive)
    .flatMap(job => {
      if (!job.scheduled_start) return [];

      const start = new Date(job.scheduled_start);
      if (Number.isNaN(start.getTime())) return [];

      const end = normalisedEnd(job, start);
      if (end < range.start || start > range.end) return [];

      return [{
        job,
        start,
        end,
        durationMinutes: Math.max(
          30,
          Math.round((end.getTime() - start.getTime()) / 60_000)
        ),
      }];
    })
    .sort((left, right) => left.start.getTime() - right.start.getTime());
}

export function listUnscheduledJobs(jobs: Job[]): Job[] {
  return jobs
    .filter(job => isActive(job) && !job.scheduled_start)
    .sort((left, right) => left.created_at.localeCompare(right.created_at));
}

export function moveJobToDate(job: Job, targetDate: Date): {
  scheduledStart: string;
  scheduledEnd: string;
} {
  const existingStart = job.scheduled_start
    ? new Date(job.scheduled_start)
    : null;
  const start = new Date(targetDate);

  if (existingStart && !Number.isNaN(existingStart.getTime())) {
    start.setHours(
      existingStart.getHours(),
      existingStart.getMinutes(),
      0,
      0
    );
  } else {
    start.setHours(8, 0, 0, 0);
  }

  const existingEnd = existingStart
    ? normalisedEnd(job, existingStart)
    : null;
  const duration = existingStart && existingEnd
    ? existingEnd.getTime() - existingStart.getTime()
    : DEFAULT_DURATION_MINUTES * 60_000;

  return {
    scheduledStart: start.toISOString(),
    scheduledEnd: new Date(start.getTime() + duration).toISOString(),
  };
}

export function resizeJobDuration(
  job: Job,
  durationMinutes: number
): { scheduledStart: string; scheduledEnd: string } {
  if (!job.scheduled_start) {
    throw new Error("Schedule the job before changing its duration.");
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes < 30) {
    throw new Error("Job duration must be at least 30 minutes.");
  }

  const start = new Date(job.scheduled_start);
  if (Number.isNaN(start.getTime())) {
    throw new Error("The job has an invalid scheduled start.");
  }

  return {
    scheduledStart: start.toISOString(),
    scheduledEnd: new Date(
      start.getTime() + durationMinutes * 60_000
    ).toISOString(),
  };
}

export function detectScheduleConflicts(
  jobs: Job[],
  candidate: {
    jobId: string;
    scheduledStart: string;
    scheduledEnd: string;
    crew: string;
    vehicle: string;
  }
): ScheduleConflict[] {
  const start = new Date(candidate.scheduledStart);
  const end = new Date(candidate.scheduledEnd);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return [];
  }

  const crew = candidate.crew.trim().toLocaleLowerCase();
  const vehicle = candidate.vehicle.trim().toLocaleLowerCase();
  const conflicts: ScheduleConflict[] = [];

  for (const job of jobs.filter(isActive)) {
    if (job.id === candidate.jobId || !job.scheduled_start) continue;

    const otherStart = new Date(job.scheduled_start);
    if (Number.isNaN(otherStart.getTime())) continue;
    const otherEnd = normalisedEnd(job, otherStart);

    if (start >= otherEnd || end <= otherStart) continue;

    if (crew && job.crew.trim().toLocaleLowerCase() === crew) {
      conflicts.push({
        jobId: job.id,
        jobNumber: job.job_number,
        resource: "crew",
        resourceName: job.crew.trim(),
      });
    }

    if (vehicle && job.vehicle.trim().toLocaleLowerCase() === vehicle) {
      conflicts.push({
        jobId: job.id,
        jobNumber: job.job_number,
        resource: "vehicle",
        resourceName: job.vehicle.trim(),
      });
    }
  }

  return conflicts;
}
