/**
 * Helpers that keep route handlers thin and consistent.
 *
 * Services throw `HttpError` for expected problems (bad input, not found);
 * `handle` turns those into JSON errors and anything else into a logged 500.
 */
import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/shared/types";

/** An error with an HTTP status, safe to show to the user. */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

/** Runs a route body and converts its result or error to a JSON response. */
export async function handle<T>(body: () => Promise<T>, successStatus = 200): Promise<NextResponse> {
  try {
    return NextResponse.json(await body(), { status: successStatus });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json<ApiErrorBody>({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json<ApiErrorBody>(
      { error: "Server error. Check DATABASE_URL and that the database is seeded (npm run db:seed)." },
      { status: 500 },
    );
  }
}

/** Reads a JSON body, or fails with 400 if it is not valid JSON. */
export async function readJson<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    throw new HttpError(400, "Request body must be JSON.");
  }
}

/** Throws a 400 unless `value` is a non-empty string; returns it trimmed. */
export function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, `${field} is required.`);
  return value.trim();
}

/** Throws a 400 unless `value` is one of `allowed`. */
export function requireOneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new HttpError(400, `${field} must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}
