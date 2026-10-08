import { apiFetch } from "@/lib/spring";
import { bearerToken, errorResponse } from "@/app/api/_lib/responses";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return Response.json({ message: "Not signed in" }, { status: 401 });
    }

    const balance = await apiFetch("/api/leaves/balance", { token });
    return Response.json(balance);
  } catch (error) {
    return errorResponse(error);
  }
}