import { NextResponse } from "next/server";

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
