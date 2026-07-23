"use client";

import { useEffect, useMemo, useState } from "react";
import { filterOperationsJobs } from "@/lib/services/operationsService";
import OperationsCalendar from "@/components/dashboard/OperationsCalendar";
import type { Job } from "@/lib/types/job";
import type {
  DispatchAssignmentInput,
  DispatchSummary,
  OperationsAssignmentFilter,
  OperationsFilters,
  OperationsScheduleGroup,
} from "@/lib/types/operations";

type OperationsCentreProps = {
  jobs: Job[];
  dispatch: DispatchSummary;
  schedule: OperationsScheduleGroup[];
  onOpenJob: (job: Job) => void;
  onSaveDispatch: (
    job: Job,
    assignment: DispatchAssignmentInput
  ) => Promise<void>;
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

function localInput(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function OperationsCentre({
  jobs,
  dispatch,
  schedule,
  onOpenJob,
  onSaveDispatch,
}: OperationsCentreProps) {
  const [mode, setMode] = useState<"board" | "calendar">("board");
  const [assignment, setAssignment] =
    useState<OperationsAssignmentFilter>("all");
  const [needsAttention, setNeedsAttention] = useState(false);
  const [status, setStatus] = useState("all");
  const [dispatchJob, setDispatchJob] = useState<Job | null>(null);
  const [dispatchForm, setDispatchForm] = useState<DispatchAssignmentInput>({
    scheduledStart: "",
    scheduledEnd: "",
    crew: "",
    vehicle: "",
  });
  const [dispatchError, setDispatchError] = useState("");
  const [dispatchSaving, setDispatchSaving] = useState(false);

  useEffect(() => {
    if (!dispatchJob) return;

    const current = schedule
      .flatMap(group => group.jobs)
      .find(job => job.id === dispatchJob.id);

    if (current) setDispatchJob(current);
  }, [schedule, dispatchJob?.id]);

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

  function openDispatch(job: Job) {
    setDispatchJob(job);
    setDispatchError("");
    setDispatchForm({
      scheduledStart: localInput(job.scheduled_start),
      scheduledEnd: localInput(job.scheduled_end),
      crew: job.crew,
      vehicle: job.vehicle,
    });
  }

  async function saveDispatch() {
    if (!dispatchJob) return;

    setDispatchSaving(true);
    setDispatchError("");

    try {
      await onSaveDispatch(dispatchJob, dispatchForm);
      setDispatchJob(null);
    } catch (error) {
      setDispatchError(
        error instanceof Error ? error.message : "Unable to save dispatch."
      );
    } finally {
      setDispatchSaving(false);
    }
  }

  return (
    <>
      <div className="sectionHead">
        <div>
          <h2>Operations Centre</h2>
          <p className="muted">
            Scheduling, readiness and dispatch information for active jobs.
          </p>
        </div>
        <div className="operationsModeSwitch" aria-label="Operations view">
          <button
            className={`btn small ${mode === "board" ? "" : "secondary"}`}
            onClick={() => setMode("board")}
          >
            Dispatch board
          </button>
          <button
            className={`btn small ${mode === "calendar" ? "" : "secondary"}`}
            onClick={() => setMode("calendar")}
          >
            Calendar
          </button>
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

      {mode === "board" ? (
        <>
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
                <article className="operationsJob" key={`${group.key}-${job.id}`}>
                  <button
                    className="operationsJobOpen"
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
                  <button
                    className="btn secondary small operationsDispatchButton"
                    onClick={() => openDispatch(job)}
                  >
                    Assign dispatch
                  </button>
                </article>
              ))
            )}
          </section>
        ))}
      </div>

        </>
      ) : (
        <OperationsCalendar
          jobs={jobs}
          onOpenJob={onOpenJob}
          onSaveDispatch={onSaveDispatch}
        />
      )}

      {dispatchJob && (
        <div
          className="dispatchOverlay"
          role="presentation"
          onMouseDown={event => {
            if (event.currentTarget === event.target) setDispatchJob(null);
          }}
        >
          <section
            className="card dispatchPanel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispatch-title"
          >
            <div className="sectionHead">
              <div>
                <h3 id="dispatch-title">Dispatch {dispatchJob.job_number}</h3>
                <p className="muted">{dispatchJob.customer_name}</p>
              </div>
              <button
                className="btn secondary small"
                onClick={() => setDispatchJob(null)}
                disabled={dispatchSaving}
              >
                Close
              </button>
            </div>

            <div className="grid two">
              <div>
                <label htmlFor="dispatch-start">Scheduled start *</label>
                <input
                  id="dispatch-start"
                  type="datetime-local"
                  value={dispatchForm.scheduledStart}
                  onChange={event =>
                    setDispatchForm({
                      ...dispatchForm,
                      scheduledStart: event.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label htmlFor="dispatch-end">Scheduled end</label>
                <input
                  id="dispatch-end"
                  type="datetime-local"
                  value={dispatchForm.scheduledEnd}
                  onChange={event =>
                    setDispatchForm({
                      ...dispatchForm,
                      scheduledEnd: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid two">
              <div>
                <label htmlFor="dispatch-crew">Crew *</label>
                <input
                  id="dispatch-crew"
                  value={dispatchForm.crew}
                  onChange={event =>
                    setDispatchForm({
                      ...dispatchForm,
                      crew: event.target.value,
                    })
                  }
                  placeholder="Assigned crew"
                />
              </div>
              <div>
                <label htmlFor="dispatch-vehicle">Vehicle *</label>
                <input
                  id="dispatch-vehicle"
                  value={dispatchForm.vehicle}
                  onChange={event =>
                    setDispatchForm({
                      ...dispatchForm,
                      vehicle: event.target.value,
                    })
                  }
                  placeholder="Assigned vehicle"
                />
              </div>
            </div>

            {dispatchError && <p className="error">{dispatchError}</p>}

            <div className="actions">
              <button
                className="btn"
                onClick={saveDispatch}
                disabled={dispatchSaving}
              >
                {dispatchSaving ? "Saving…" : "Save dispatch"}
              </button>
              <button
                className="btn secondary"
                onClick={() => onOpenJob(dispatchJob)}
                disabled={dispatchSaving}
              >
                Open full job
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
