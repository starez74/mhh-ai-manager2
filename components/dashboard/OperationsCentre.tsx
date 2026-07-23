"use client";

import { useMemo, useState } from "react";
import { filterOperationsJobs } from "@/lib/services/operationsService";
import type { Job } from "@/lib/types/job";
import type {
  DispatchSummary,
  OperationsAssignmentFilter,
  OperationsFilters,
  OperationsScheduleGroup,
} from "@/lib/types/operations";

type OperationsCentreProps = {
  dispatch: DispatchSummary;
  schedule: OperationsScheduleGroup[];
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
  dispatch,
  schedule,
  onOpenJob,
}: OperationsCentreProps) {
  const [assignment, setAssignment] =
    useState<OperationsAssignmentFilter>("all");
  const [needsAttention, setNeedsAttention] = useState(false);
  const [status, setStatus] = useState("all");

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(schedule.flatMap(group => group.jobs.map(job => job.status)))
      ).sort(),
    [schedule]
  );

  const filters: OperationsFilters = {
    assignment,
    needsAttention,
    status,
  };

  const filteredSchedule = useMemo(
    () =>
      schedule.map(group => ({
        ...group,
        jobs: filterOperationsJobs(group.jobs, filters),
      })),
    [schedule, assignment, needsAttention, status]
  );

  return (
    <>
      <div className="sectionHead">
        <div>
          <h2>Operations Centre</h2>
          <p className="muted">
            Scheduling, readiness and dispatch information for active jobs.
          </p>
        </div>
      </div>

      <div className="grid four operationsMetrics">
        <div className="card">
          <div className="metric">{dispatch.dueToday}</div>
          <div>Jobs due today</div>
        </div>
        <div className="card">
          <div className="metric">{dispatch.overdue}</div>
          <div>Overdue jobs</div>
        </div>
        <div className="card">
          <div className="metric">{dispatch.vehiclesAllocated}</div>
          <div>Vehicles allocated</div>
        </div>
        <div className="card">
          <div className="metric">{dispatch.crewsAllocated}</div>
          <div>Crews allocated</div>
        </div>
      </div>

      <div className="card operationsFilters" aria-label="Operations filters">
        <div>
          <label htmlFor="operations-assignment">Assignment</label>
          <select
            id="operations-assignment"
            value={assignment}
            onChange={event =>
              setAssignment(event.target.value as OperationsAssignmentFilter)
            }
          >
            <option value="all">All jobs</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
        <div>
          <label htmlFor="operations-status">Status</label>
          <select
            id="operations-status"
            value={status}
            onChange={event => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            {statuses.map(value => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <label className="operationsCheck">
          <input
            type="checkbox"
            checked={needsAttention}
            onChange={event => setNeedsAttention(event.target.checked)}
          />
          Needs attention only
        </label>
      </div>

      <div className="operationsSchedule">
        {filteredSchedule.map(group => (
          <section className="card operationsColumn" key={group.key}>
            <div className="sectionHead">
              <h3>{group.label}</h3>
              <span className="badge">{group.jobs.length}</span>
            </div>

            {group.jobs.length === 0 ? (
              <p className="muted">No matching jobs.</p>
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
