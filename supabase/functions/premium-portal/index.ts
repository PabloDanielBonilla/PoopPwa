import {
  admin,
  corsHeaders,
  errorResponse,
  json,
  readJson,
  requireUser,
} from "../_shared/utils.ts";
import { polarConfigured, polarFetch } from "../_shared/polar.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return errorResponse(request, "METHOD_NOT_ALLOWED", 405);
  }

  try {
    const user = await requireUser(request);
    const body = await readJson<{ roomId?: string; groupId?: string }>(request);
    const roomId = body.roomId ?? body.groupId ?? "";
    if (!roomId) return errorResponse(request, "MISSING_ROOM_ID", 400);

    const { data: room, error } = await admin
      .from("rooms")
      .select("id, created_by, polar_customer_id")
      .eq("id", roomId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!room) return errorResponse(request, "ROOM_NOT_FOUND", 404);
    if (room.created_by !== user.id) {
      return errorResponse(request, "NOT_ROOM_OWNER", 403);
    }
    if (!room.polar_customer_id) {
      return errorResponse(request, "NO_POLAR_CUSTOMER", 409);
    }
    if (!polarConfigured()) {
      return errorResponse(request, "POLAR_NOT_CONFIGURED", 503);
    }

    const session = await polarFetch("/v1/customer-sessions/", {
      method: "POST",
      body: JSON.stringify({ customer_id: room.polar_customer_id }),
    });

    return json(request, { url: session?.customer_portal_url ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "AUTH_REQUIRED") {
      return errorResponse(request, "AUTH_REQUIRED", 401);
    }
    console.error("premium-portal", message);
    return errorResponse(request, message, 500);
  }
});
