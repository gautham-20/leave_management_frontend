import { apiFetch } from "@/lib/spring";
import { errorResponse } from "@/app/api/_lib/responses";

// The backend performs real authentication, so this route is always dynamic.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await apiFetch("/api/auth/login", { method: "POST", body });
    return Response.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}