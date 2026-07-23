"use client";

import { useMemo, useState } from "react";
import {
  buildCalendarRange,
  buildTimelineEvents,
  detectScheduleConflicts,
  listUnscheduledJobs,
  moveJobToDate,
  resizeJobDuration,
  shiftCalendarAnchor,
} from "@/lib/services/calendarService";
import type { Job } from "@/lib/types/job";
import type { CalendarView } from "@/lib/types/calendar";
import type { DispatchAssignmentInput } from "@/lib/types/operations";

type OperationsCalendarProps = {
  jobs: Job[];
  onOpenJob: (job: Job) => void;
  onSaveDispatch: (
    job: Job,
    assignment: DispatchAssignmentInput
  ) => Promise<void>;
};

const durationOptions = [
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "3 hours", minutes: 180 },
  { label: "4 hours", minutes: 240 },
  { label: "6 hours", minutes: 360 },
  { label: "8 hours", minutes: 480 },
];

function dayKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatRangeLabel(anchor: Date, view: CalendarView): string {
  if (view === "day") {
    return anchor.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (view === "month") {
    return anchor.toLocaleDateString("en-AU", {
      month: "long",
      year: "numeric",
    });
  }

  const range = buildCalendarRange(anchor, "week");
  return `${range.start.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  })} – ${range.end.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function localDateTime(value: Date): string {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default function OperationsCalendar({
  jobs,
  onOpenJob,
  onSaveDispatch,
}: OperationsCalendarProps) {
  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [message, setMessage] = useState("");
  const [savingJobId, setSavingJobId] = useState("");

  const range = useMemo(
    () => buildCalendarRange(anchor, view),
    [anchor, view]
  );
  const events = useMemo(
    () => buildTimelineEvents(jobs, range),
    [jobs, range]
  );
  const unscheduled = useMemo(() => listUnscheduledJobs(jobs), [jobs]);

  const eventsByDay = useMemo(() => {
    const result = new Map<string, typeof events>();

    for (const day of range.days) result.set(dayKey(day), []);
    for (const event of events) {
      const key = dayKey(event.start);
      const current = result.get(key);
      if (current) current.push(event);
    }

    return result;
  }, [events, range.days]);

  async function persistSchedule(
    job: Job,
    scheduledStart: string,
    scheduledEnd: string
  ) {
    const conflicts = detectScheduleConflicts(jobs, {
      jobId: job.id,
      scheduledStart,
      scheduledEnd,
      crew: job.crew,
      vehicle: job.vehicle,
    });

    if (conflicts.length) {
      const details = conflicts
        .map(
          conflict =>
            `${conflict.resourceName} is already assigned to ${conflict.jobNumber}`
        )
        .join("; ");
      setMessage(`Schedule conflict: ${details}.`);
      return;
    }

    setSavingJobId(job.id);
    setMessage("");

    try {
      await onSaveDispatch(job, {
        scheduledStart: localDateTime(new Date(scheduledStart)),
        scheduledEnd: localDateTime(new Date(scheduledEnd)),
        crew: job.crew,
        vehicle: job.vehicle,
      });
      setMessage(`${job.job_number} schedule updated.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update schedule."
      );
    } finally {
      setSavingJobId("");
    }
  }

  async function dropJob(jobId: string, targetDate: Date) {
    const job = jobs.find(item => item.id === jobId);
    if (!job) return;

    const moved = moveJobToDate(job, targetDate);
    await persistSchedule(job, moved.scheduledStart, moved.scheduledEnd);
  }

  async function resizeJob(job: Job, durationMinutes: number) {
    try {
      const resized = resizeJobDuration(job, durationMinutes);
      await persistSchedule(
        job,
        resized.scheduledStart,
        resized.scheduledEnd
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to resize job."
      );
    }
  }

  return (
    <div className="operationsCalendar">
      <div className="card calendarToolbar">
        <div className="calendarNavigation">
          <button
            className="btn secondary small"
            onClick={() =>
              setAnchor(current => shiftCalendarAnchor(current, view, -1))
            }
          >
            Previous
          </button>
          <button
            className="btn secondary small"
            onClick={() => setAnchor(new Date())}
          >
            Today
          </button>
          <button
            className="btn secondary small"
            onClick={() =>
              setAnchor(current => shiftCalendarAnchor(current, view, 1))
            }
          >
            Next
          </button>
        </div>

        <strong>{formatRangeLabel(anchor, view)}</strong>

        <div className="calendarViewSwitch" aria-label="Calendar view">
          {(["day", "week", "month"] as CalendarView[]).map(value => (
            <button
              key={value}
              className={`btn small ${view === value ? "" : "secondary"}`}
              onClick={() => setView(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={message.startsWith("Schedule conflict") ? "notice error" : "notice"}>
          {message}
        </div>
      )}

      <section className="card unscheduledLane">
        <div className="sectionHead">
          <div>
            <h3>Unscheduled jobs</h3>
            <p className="muted">
              Drag a job onto a calendar day to schedule it at 8:00 am.
            </p>
          </div>
          <span className="badge">{unscheduled.length}</span>
        </div>
        <div className="unscheduledJobs">
          {unscheduled.length === 0 ? (
            <p className="muted">No unscheduled jobs.</p>
          ) : (
            unscheduled.map(job => (
              <button
                key={job.id}
                className="calendarJobChip"
                draggable
                onDragStart={event =>
                  event.dataTransfer.setData("text/job-id", job.id)
                }
                onClick={() => onOpenJob(job)}
              >
                <strong>{job.job_number}</strong>
                <span>{job.customer_name}</span>
              </button>
            ))
          )}
        </div>
      </section>

      <div
        className={`calendarGrid calendarGrid-${view}`}
        aria-label={`${view} scheduling calendar`}
      >
        {range.days.map(day => {
          const dayEvents = eventsByDay.get(dayKey(day)) ?? [];
          const isOutsideMonth =
            view === "month" && day.getMonth() !== anchor.getMonth();
          const isToday = dayKey(day) === dayKey(new Date());

          return (
            <section
              className={`card calendarDay ${isOutsideMonth ? "calendarDayMuted" : ""} ${isToday ? "calendarToday" : ""}`}
              key={dayKey(day)}
              onDragOver={event => event.preventDefault()}
              onDrop={event => {
                event.preventDefault();
                const jobId = event.dataTransfer.getData("text/job-id");
                if (jobId) void dropJob(jobId, day);
              }}
            >
              <div className="calendarDayHeader">
                <strong>
                  {day.toLocaleDateString("en-AU", {
                    weekday: view === "month" ? "short" : "long",
                    day: "numeric",
                    month: view === "day" ? "long" : "short",
                  })}
                </strong>
                <span className="badge">{dayEvents.length}</span>
              </div>

              <div className="calendarDayEvents">
                {dayEvents.length === 0 ? (
                  <p className="muted calendarEmpty">Drop a job here.</p>
                ) : (
                  dayEvents.map(event => (
                    <article
                      className={`calendarEvent ${event.start < new Date() && event.job.status !== "completed" ? "calendarEventOverdue" : ""}`}
                      key={event.job.id}
                      draggable
                      onDragStart={dragEvent =>
                        dragEvent.dataTransfer.setData(
                          "text/job-id",
                          event.job.id
                        )
                      }
                    >
                      <button
                        className="calendarEventOpen"
                        onClick={() => onOpenJob(event.job)}
                      >
                        <span className="calendarEventTime">
                          {event.start.toLocaleTimeString("en-AU", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" – "}
                          {event.end.toLocaleTimeString("en-AU", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        <strong>{event.job.job_number}</strong>
                        <span>{event.job.customer_name}</span>
                        <small>
                          Crew: {event.job.crew || "Not assigned"} · Vehicle:{" "}
                          {event.job.vehicle || "Not assigned"}
                        </small>
                        <span className="badge">{event.job.status}</span>
                      </button>

                      <label className="calendarDuration">
                        <span>Duration</span>
                        <select
                          aria-label={`Duration for ${event.job.job_number}`}
                          value={
                            durationOptions.some(
                              option =>
                                option.minutes === event.durationMinutes
                            )
                              ? event.durationMinutes
                              : ""
                          }
                          disabled={savingJobId === event.job.id}
                          onChange={changeEvent => {
                            const duration = Number(changeEvent.target.value);
                            if (duration) void resizeJob(event.job, duration);
                          }}
                        >
                          <option value="">Custom</option>
                          {durationOptions.map(option => (
                            <option
                              value={option.minutes}
                              key={option.minutes}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
