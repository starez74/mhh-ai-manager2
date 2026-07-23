"use client";

import { browserSupabase } from "@/lib/supabase/browser";
import type {
  DispatchAssignmentInput,
  DispatchAssignmentResult,
} from "@/lib/types/operations";

function normaliseOptionalDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Enter a valid schedule date and time.");
  }

  return parsed.toISOString();
}

async function assertNoResourceConflict(
  jobId: string,
  resourceColumn: "crew_id" | "vehicle_id",
  resourceId: string,
  scheduledStart: string,
  scheduledEnd: string | null,
  label: string
): Promise<void> {
  const effectiveEnd = scheduledEnd ?? scheduledStart;
  const { data, error } = await browserSupabase
    .from("jobs")
    .select("id,job_number,scheduled_start,scheduled_end")
    .eq(resourceColumn, resourceId)
    .neq("id", jobId)
    .is("archived_at", null)
    .lt("scheduled_start", effectiveEnd)
    .or(`scheduled_end.is.null,scheduled_end.gt.${scheduledStart}`)
    .limit(1);

  if (error) throw error;
  const conflict = data?.[0];
  if (conflict) {
    throw new Error(`${label} is already assigned to ${conflict.job_number} during this time.`);
  }
}

export async function saveDispatchAssignment(
  jobId: string,
  input: DispatchAssignmentInput
): Promise<DispatchAssignmentResult> {
  const crewId = input.crewId.trim();
  const crew = input.crewName.trim();
  const vehicleId = input.vehicleId.trim();
  const vehicle = input.vehicleName.trim();
  const scheduledStart = normaliseOptionalDate(input.scheduledStart);
  const scheduledEnd = normaliseOptionalDate(input.scheduledEnd);

  if (!crewId || !crew) throw new Error("Crew assignment is required.");
  if (!vehicleId || !vehicle) throw new Error("Vehicle assignment is required.");
  if (!scheduledStart) throw new Error("Scheduled start is required.");

  if (
    scheduledEnd &&
    new Date(scheduledEnd).getTime() <= new Date(scheduledStart).getTime()
  ) {
    throw new Error("Scheduled end must be after the scheduled start.");
  }

  await Promise.all([
    assertNoResourceConflict(jobId, "crew_id", crewId, scheduledStart, scheduledEnd, crew),
    assertNoResourceConflict(jobId, "vehicle_id", vehicleId, scheduledStart, scheduledEnd, vehicle),
  ]);

  const update = {
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    crew,
    vehicle,
    crew_id: crewId,
    vehicle_id: vehicleId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await browserSupabase
    .from("jobs")
    .update(update)
    .eq("id", jobId)
    .select("scheduled_start,scheduled_end,crew,vehicle,crew_id,vehicle_id")
    .single();

  if (error) throw error;
  return data;
}
