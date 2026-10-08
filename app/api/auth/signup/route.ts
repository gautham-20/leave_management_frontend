import { apiFetch } from "@/lib/spring";
import { errorResponse } from "@/app/api/_lib/responses";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await apiFetch("/api/auth/signup", { method: "POST", body });
    return Response.json(data, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}