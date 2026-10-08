import { apiFetch } from "@/lib/spring";
import { bearerToken, errorResponse } from "@/app/api/_lib/responses";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return Response.json({ message: "Not signed in" }, { status: 401 });
    }

    // Spring Boot scopes the response by role: employees see only their own
    // records, managers and admins see everything.
    const leaves = await apiFetch("/api/leaves", { token });
    return Response.json(leaves);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return Response.json({ message: "Not signed in" }, { status: 401 });
    }

    const body = await request.json();

    // The employee is derived from the token by Spring Boot, so it is never
    // accepted from the client.
    const leave = await apiFetch("/api/leaves", { method: "POST", body, token });
    return Response.json(leave, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}