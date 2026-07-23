import type { Job } from "@/lib/types/job";

export default function UpcomingJobs({ jobs }: { jobs: Job[] }) {
  const upcoming = jobs
    .filter(job => job.scheduled_start && !job.archived_at && !["completed", "cancelled"].includes(job.status))
    .slice(0, 5);

  return (
    <div className="card">
      <h3>Upcoming Jobs</h3>
      {upcoming.length === 0 ? (
        <p className="muted">No upcoming jobs.</p>
      ) : (
        upcoming.map(job => (
          <div className="campaign" key={job.id}>
            <strong>{job.job_number}</strong>
            <p>{job.customer_name} · {job.pickup_suburb} → {job.delivery_suburb}</p>
            <div className="muted">{job.scheduled_start ? new Date(job.scheduled_start).toLocaleString("en-AU") : "Schedule pending"}</div>
          </div>
        ))
      )}
    </div>
  );
}
