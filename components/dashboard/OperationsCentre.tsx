import type { Job } from "@/lib/types/job";
import type {
  OperationsJobGroup,
  OperationsSummary,
} from "@/lib/types/operations";

type OperationsCentreProps = {
  summary: OperationsSummary;
  groups: OperationsJobGroup[];
  onOpenJob: (job: Job) => void;
};

function scheduleLabel(job: Job): string {
  if (!job.scheduled_start) return "Schedule required";

  return new Date(job.scheduled_start).toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OperationsCentre({
  summary,
  groups,
  onOpenJob,
}: OperationsCentreProps) {
  return (
    <>
      <div className="sectionHead">
        <div>
          <h2>Operations Centre</h2>
          <p className="muted">
            Daily job readiness, scheduling and dispatch information.
          </p>
        </div>
      </div>

      <div className="grid four operationsMetrics">
        <div className="card">
          <div className="metric">{summary.today.length}</div>
          <div>Jobs today</div>
        </div>
        <div className="card">
          <div className="metric">{summary.upcoming.length}</div>
          <div>Next 7 days</div>
        </div>
        <div className="card">
          <div className="metric">{summary.unscheduled.length}</div>
          <div>Unscheduled</div>
        </div>
        <div className="card">
          <div className="metric">{summary.needsAttention.length}</div>
          <div>Need attention</div>
        </div>
      </div>

      <div className="operationsBoard">
        {groups.map(group => (
          <section className="card operationsColumn" key={group.key}>
            <div className="sectionHead">
              <h3>{group.label}</h3>
              <span className="badge">{group.jobs.length}</span>
            </div>

            {group.jobs.length === 0 ? (
              <p className="muted">No jobs in this group.</p>
            ) : (
              group.jobs.map(job => (
                <button
                  className="operationsJob"
                  key={`${group.key}-${job.id}`}
                  onClick={() => onOpenJob(job)}
                >
                  <div className="sectionHead">
                    <strong>{job.job_number}</strong>
                    <span className="badge">{job.status}</span>
                  </div>
                  <div>{job.customer_name}</div>
                  <div className="muted">
                    {job.pickup_suburb} → {job.delivery_suburb}
                  </div>
                  <div className="muted">{scheduleLabel(job)}</div>
                  <div className="operationsResources">
                    <span>Crew: {job.crew || "Not assigned"}</span>
                    <span>Vehicle: {job.vehicle || "Not assigned"}</span>
                  </div>
                </button>
              ))
            )}
          </section>
        ))}
      </div>
    </>
  );
}
