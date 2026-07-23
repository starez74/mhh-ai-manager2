import type { Job } from "@/lib/types/job";
import type {
  OperationsJobGroup,
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

export function buildOperationsSummary(
  jobs: Job[],
  now = new Date()
): OperationsSummary {
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const upcomingEnd = new Date(todayEnd);
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);

  const activeJobs = jobs.filter(
    job => !job.archived_at && activeStatuses.has(job.status)
  );

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

  const needsAttention = activeJobs.filter(job => {
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
  });

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
