export class ApiRouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ApiRouteError";
  }
}

export function apiErrorStatus(error: unknown, fallback = 500): number {
  return error instanceof ApiRouteError ? error.status : fallback;
}
