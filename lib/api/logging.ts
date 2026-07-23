type LogContext = Record<string, string | number | boolean | null | undefined>;

export function logApiError(
  route: string,
  error: unknown,
  context: LogContext = {}
): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[API ${route}] ${message}`, context);
}
