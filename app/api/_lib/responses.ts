import { NextResponse } from "next/server";
import { ApiError } from "@/lib/spring";

/**
 * Converts any thrown value into a JSON response, preserving the backend's
 * status code and message so the client can show something useful.
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error("Unhandled route handler error:", error);
  return NextResponse.json(
    { message: "Something went wrong. Please try again." },
    { status: 500 }
  );
}

/** Reads the bearer token forwarded by the browser. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}