import type { Job } from "@/lib/types/job";
import type {
  DispatchSummary,
  OperationsFilters,
  OperationsJobGroup,
  OperationsScheduleGroup,
  OperationsSummary,
} from "@/lib/types/operations";

const activeStatuses = new Set(["booked", "confirmed", "in_progress"]);

function startOfLocalDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfLocalDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(23, 59, 59, 999);
  return result;
}

function isActiveJob(job: Job): boolean {
  return !job.archived_at && activeStatuses.has(job.status);
}

function isAssigned(job: Job): boolean {
  return Boolean(job.crew.trim() && job.vehicle.trim());
}

export function jobNeedsOperationsAttention(
  job: Job,
  now = new Date()
): boolean {
  const todayStart = startOfLocalDay(now);
  const scheduled = job.scheduled_start
    ? new Date(job.scheduled_start)
    : null;
  const overdue = scheduled ? scheduled < todayStart : false;

  return (
    overdue ||
    !job.crew.trim() ||
    !job.vehicle.trim() ||
    !job.pickup_address.trim() ||
    !job.delivery_address.trim()
  );
}

export function buildOperationsSummary(
  jobs: Job[],
  now = new Date()
): OperationsSummary {
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const upcomingEnd = new Date(todayEnd);
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);

  const activeJobs = jobs.filter(isActiveJob);

  const scheduledJobs = activeJobs
    .filter(job => Boolean(job.scheduled_start))
    .sort(
      (left, right) =>
        new Date(left.scheduled_start as string).getTime() -
        new Date(right.scheduled_start as string).getTime()
    );

  const today = scheduledJobs.filter(job => {
    const scheduled = new Date(job.scheduled_start as string);
    return scheduled >= todayStart && scheduled <= todayEnd;
  });

  const upcoming = scheduledJobs.filter(job => {
    const scheduled = new Date(job.scheduled_start as string);
    return scheduled > todayEnd && scheduled <= upcomingEnd;
  });

  const unscheduled = activeJobs.filter(job => !job.scheduled_start);
  const needsAttention = activeJobs.filter(job =>
    jobNeedsOperationsAttention(job, now)
  );

  return { today, upcoming, unscheduled, needsAttention };
}

export function buildOperationsJobGroups(
  summary: OperationsSummary
): OperationsJobGroup[] {
  return [
    { key: "today", label: "Today", jobs: summary.today },
    { key: "upcoming", label: "Next 7 days", jobs: summary.upcoming },
    { key: "unscheduled", label: "Unscheduled", jobs: summary.unscheduled },
    {
      key: "attention",
      label: "Needs attention",
      jobs: summary.needsAttention,
    },
  ];
}

export function buildOperationsSchedule(
  jobs: Job[],
  now = new Date()
): OperationsScheduleGroup[] {
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = endOfLocalDay(tomorrowStart);
  const weekEnd = endOfLocalDay(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const activeJobs = jobs.filter(isActiveJob);
  const scheduledJobs = activeJobs
    .filter(job => Boolean(job.scheduled_start))
    .sort(
      (left, right) =>
        new Date(left.scheduled_start as string).getTime() -
        new Date(right.scheduled_start as string).getTime()
    );

  return [
    {
      key: "unscheduled",
      label: "Unscheduled",
      jobs: activeJobs.filter(job => !job.scheduled_start),
    },
    {
      key: "today",
      label: "Today",
      jobs: scheduledJobs.filter(job => {
        const scheduled = new Date(job.scheduled_start as string);
        return scheduled <= todayEnd;
      }),
    },
    {
      key: "tomorrow",
      label: "Tomorrow",
      jobs: scheduledJobs.filter(job => {
        const scheduled = new Date(job.scheduled_start as string);
        return scheduled >= tomorrowStart && scheduled <= tomorrowEnd;
      }),
    },
    {
      key: "this-week",
      label: "This Week",
      jobs: scheduledJobs.filter(job => {
        const scheduled = new Date(job.scheduled_start as string);
        return scheduled > tomorrowEnd && scheduled <= weekEnd;
      }),
    },
  ];
}

export function buildDispatchSummary(
  jobs: Job[],
  now = new Date()
): DispatchSummary {
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const activeJobs = jobs.filter(isActiveJob);
  const dueToday = activeJobs.filter(job => {
    if (!job.scheduled_start) return false;
    const scheduled = new Date(job.scheduled_start);
    return scheduled >= todayStart && scheduled <= todayEnd;
  }).length;
  const overdue = activeJobs.filter(job => {
    if (!job.scheduled_start) return false;
    return new Date(job.scheduled_start) < todayStart;
  }).length;

  return {
    dueToday,
    overdue,
    vehiclesAllocated: activeJobs.filter(job => job.vehicle.trim()).length,
    crewsAllocated: activeJobs.filter(job => job.crew.trim()).length,
  };
}

export function filterOperationsJobs(
  jobs: Job[],
  filters: OperationsFilters,
  now = new Date()
): Job[] {
  return jobs.filter(job => {
    if (filters.assignment === "assigned" && !isAssigned(job)) return false;
    if (filters.assignment === "unassigned" && isAssigned(job)) return false;
    if (filters.needsAttention && !jobNeedsOperationsAttention(job, now)) {
      return false;
    }
    if (filters.status !== "all" && job.status !== filters.status) return false;
    return true;
  });
}
