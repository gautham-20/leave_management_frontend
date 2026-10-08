/**
 * Server-side client for the Spring Boot API.
 *
 * Only ever import this from route handlers or server components — it reads
 * `SPRING_API_URL` and `SPRING_API_TOKEN`, which must stay out of the browser
 * bundle. Client components should call the `/api/...` routes instead.
 */

const DEFAULT_BASE_URL = "http://localhost:8080";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function apiBaseUrl(): string {
  return process.env.SPRING_API_URL ?? DEFAULT_BASE_URL;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
};

/**
 * Calls the Spring Boot API and normalises failures into {@link ApiError} so
 * route handlers can pass the backend's message straight through to the UI.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    // fetch only rejects on network-level failures, which almost always mean
    // the backend is unreachable.
    throw new ApiError(503, "Cannot reach the API server. Is the backend running?");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      `API request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}