import { apiFetch } from "@/lib/spring";
import { bearerToken, errorResponse } from "@/app/api/_lib/responses";

export const dynamic = "force-dynamic";

/** Active policies. Every signed-in role may read; Spring Boot enforces that. */
export async function GET(request: Request) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return Response.json({ message: "Not signed in" }, { status: 401 });
    }

    const policies = await apiFetch("/api/policies", { token });
    return Response.json(policies);
  } catch (error) {
    return errorResponse(error);
  }
}

/** Create a policy. Admin only — Spring Boot rejects any other role with 403. */
export async function POST(request: Request) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return Response.json({ message: "Not signed in" }, { status: 401 });
    }

    const body = await request.json();
    const policy = await apiFetch("/api/policies", {
      method: "POST",
      body,
      token,
    });
    return Response.json(policy, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
