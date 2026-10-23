import {
  admin,
  appUrl,
  corsHeaders,
  errorResponse,
  json,
  readJson,
  requireUser,
} from "../_shared/utils.ts";
import { polarConfigured, polarFetch } from "../_shared/polar.ts";

function isPremium(room: any): boolean {
  if (!room) return false;
  if (!["active", "trialing", "canceled"].includes(String(room.premium_status))) {
    return false;
  }
  if (!room.premium_current_period_end) {
    return room.premium_status !== "canceled";
  }
  return new Date(room.premium_current_period_end).getTime() > Date.now();
}

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
      .select(
        "id, code, name, created_by, premium_status, premium_plan, premium_current_period_end, premium_cancel_at_period_end, polar_customer_id, polar_product_id",
      )
      .eq("id", roomId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!room) return errorResponse(request, "ROOM_NOT_FOUND", 404);
    if (room.created_by !== user.id) {
      return errorResponse(request, "NOT_ROOM_OWNER", 403);
    }

    if (isPremium(room)) {
      return json(request, {
        alreadyPremium: true,
        premium: {
          status: room.premium_status,
          plan: room.premium_plan,
          currentPeriodEnd: room.premium_current_period_end,
          cancelAtPeriodEnd: room.premium_cancel_at_period_end,
        },
      });
    }

    if (!polarConfigured()) {
      return errorResponse(request, "POLAR_NOT_CONFIGURED", 503);
    }

    const productId = Deno.env.get("POLAR_PRODUCT_ID_ROOM_MONTHLY") ?? "";
    const checkout = await polarFetch("/v1/checkouts/", {
      method: "POST",
      body: JSON.stringify({
        products: [productId],
        customer_email: user.email ?? undefined,
        success_url:
          `${appUrl()}/checkout?group_id=${encodeURIComponent(room.id)}` +
          `&checkout_id={CHECKOUT_ID}`,
        metadata: {
          room_id: room.id,
          roomId: room.id,
          group_id: room.id,
          groupId: room.id,
          user_id: user.id,
          userId: user.id,
          kind: "room_monthly",
        },
      }),
    });

    return json(request, {
      checkoutId: checkout?.id ?? null,
      url: checkout?.url ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "AUTH_REQUIRED") {
      return errorResponse(request, "AUTH_REQUIRED", 401);
    }
    console.error("premium-checkout", message);
    return errorResponse(request, message, 500);
  }
});
