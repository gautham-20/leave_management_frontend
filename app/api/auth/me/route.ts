import { apiFetch } from "@/lib/spring";
import { bearerToken, errorResponse } from "@/app/api/_lib/responses";

export const dynamic = "force-dynamic";

/** Rehydrates the client session after a page refresh. */
export async function GET(request: Request) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return Response.json({ message: "Not signed in" }, { status: 401 });
    }

    const user = await apiFetch("/api/auth/me", { token });
    return Response.json(user);
  } catch (error) {
    return errorResponse(error);
  }
}