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

export async function saveDispatchAssignment(
  jobId: string,
  input: DispatchAssignmentInput
): Promise<DispatchAssignmentResult> {
  const crew = input.crew.trim();
  const vehicle = input.vehicle.trim();
  const scheduledStart = normaliseOptionalDate(input.scheduledStart);
  const scheduledEnd = normaliseOptionalDate(input.scheduledEnd);

  if (!crew) throw new Error("Crew assignment is required.");
  if (!vehicle) throw new Error("Vehicle assignment is required.");
  if (!scheduledStart) throw new Error("Scheduled start is required.");

  if (
    scheduledEnd &&
    new Date(scheduledEnd).getTime() <= new Date(scheduledStart).getTime()
  ) {
    throw new Error("Scheduled end must be after the scheduled start.");
  }

  const update = {
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    crew,
    vehicle,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await browserSupabase
    .from("jobs")
    .update(update)
    .eq("id", jobId)
    .select("scheduled_start,scheduled_end,crew,vehicle")
    .single();

  if (error) throw error;
  return data;
}
