import type { Enquiry } from "@/lib/types/enquiry";
import type { Quote } from "@/lib/types/quote";
import type { Job } from "@/lib/types/job";
import type { DashboardStats } from "@/lib/types/dashboard";

export function calculateDashboardStats(
  enquiries: Enquiry[],
  quotes: Quote[],
  jobs: Job[],
  now = new Date()
): DashboardStats {
  const followUpBoundary = new Date(now.getTime() + 86_400_000);

  return {
    newLeads: enquiries.filter(
      enquiry => !enquiry.archived_at && enquiry.status === "new"
    ).length,
    followUps: enquiries.filter(
      enquiry =>
        !enquiry.archived_at &&
        enquiry.follow_up_at &&
        new Date(enquiry.follow_up_at) <= followUpBoundary &&
        !["closed", "declined", "booked"].includes(enquiry.status)
    ).length,
    openQuotes: quotes.filter(
      quote =>
        !quote.archived_at &&
        ["draft", "approved", "sent"].includes(quote.status)
    ).length,
    upcomingJobs: jobs.filter(
      job =>
        !job.archived_at &&
        job.scheduled_start &&
        new Date(job.scheduled_start) >= now &&
        !["completed", "cancelled"].includes(job.status)
    ).length,
  };
}
