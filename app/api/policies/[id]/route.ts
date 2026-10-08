import { apiFetch } from "@/lib/spring";
import { bearerToken, errorResponse } from "@/app/api/_lib/responses";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Update a policy. Admin only — Spring Boot rejects any other role with 403. */
export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return Response.json({ message: "Not signed in" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await request.json();

    const policy = await apiFetch(`/api/policies/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
      token,
    });
    return Response.json(policy);
  } catch (error) {
    return errorResponse(error);
  }
}

/** Delete a policy. Admin only. */
export async function DELETE(request: Request, ctx: Ctx) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return Response.json({ message: "Not signed in" }, { status: 401 });
    }

    const { id } = await ctx.params;

    await apiFetch(`/api/policies/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
