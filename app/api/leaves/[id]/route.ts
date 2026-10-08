import { apiFetch } from "@/lib/spring";
import { bearerToken, errorResponse } from "@/app/api/_lib/responses";

export const dynamic = "force-dynamic";

/** Approve or reject a request. Spring Boot enforces the approver role. */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/leaves/[id]">
) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return Response.json({ message: "Not signed in" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await request.json();

    const leave = await apiFetch(`/api/leaves/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
      token,
    });
    return Response.json(leave);
  } catch (error) {
    return errorResponse(error);
  }
}