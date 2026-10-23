import {
  admin,
  corsHeaders,
  errorResponse,
  json,
  readJson,
  requireUser,
} from "../_shared/utils.ts";
import { applySubscription, polarConfigured, polarFetch } from "../_shared/polar.ts";

function productIdOf(value: any): string {
  return String(
    value?.product_id ?? value?.productId ?? value?.product?.id ?? "",
  );
}

function metadataOf(value: any): Record<string, any> {
  return value?.metadata ?? {};
}

function metaValue(metadata: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    const value = metadata?.[key];
    if (value !== undefined && value !== null && String(value) !== "") {
      return String(value);
    }
  }
  return "";
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
    const body = await readJson<{
      roomId?: string;
      groupId?: string;
      checkoutId?: string;
      sessionId?: string;
    }>(request);
    const roomId = body.roomId ?? body.groupId ?? "";
    const checkoutId = body.checkoutId ?? body.sessionId ?? "";

    if (!roomId) return errorResponse(request, "MISSING_ROOM_ID", 400);
    if (!checkoutId) return errorResponse(request, "MISSING_CHECKOUT_ID", 400);
    if (!polarConfigured()) {
      return errorResponse(request, "POLAR_NOT_CONFIGURED", 503);
    }

    const { data: room, error: roomError } = await admin
      .from("rooms")
      .select("id, code, created_by")
      .eq("id", roomId)
      .maybeSingle();

    if (roomError) throw new Error(roomError.message);
    if (!room) return errorResponse(request, "ROOM_NOT_FOUND", 404);
    if (room.created_by !== user.id) {
      return errorResponse(request, "NOT_ROOM_OWNER", 403);
    }

    const checkout = await polarFetch(
      `/v1/checkouts/${encodeURIComponent(checkoutId)}`,
    );

    if (!["succeeded", "confirmed"].includes(String(checkout?.status))) {
      return errorResponse(request, "CHECKOUT_NOT_COMPLETED", 409);
    }

    const expectedProduct = Deno.env.get("POLAR_PRODUCT_ID_ROOM_MONTHLY") ?? "";
    const checkoutMeta = metadataOf(checkout);
    const checkoutRoomId = metaValue(
      checkoutMeta,
      "room_id",
      "roomId",
      "group_id",
      "groupId",
    );
    const checkoutUserId = metaValue(checkoutMeta, "user_id", "userId");

    if (checkoutRoomId && checkoutRoomId !== roomId) {
      return errorResponse(request, "CHECKOUT_ROOM_MISMATCH", 403);
    }
    if (checkoutUserId && checkoutUserId !== user.id) {
      return errorResponse(request, "CHECKOUT_USER_MISMATCH", 403);
    }

    const checkoutEmail = String(
      checkout?.customer_email ?? checkout?.customerEmail ?? "",
    ).toLowerCase();
    if (
      checkoutEmail &&
      user.email &&
      checkoutEmail !== user.email.toLowerCase()
    ) {
      return errorResponse(request, "CHECKOUT_USER_MISMATCH", 403);
    }

    const checkoutProduct = productIdOf(checkout);
    if (
      expectedProduct &&
      checkoutProduct &&
      checkoutProduct !== expectedProduct
    ) {
      return errorResponse(request, "CHECKOUT_PRODUCT_MISMATCH", 403);
    }

    const subscriptionId =
      checkout?.subscription_id ??
      checkout?.subscriptionId ??
      checkout?.subscription?.id ??
      "";
    if (!subscriptionId) {
      return errorResponse(request, "CHECKOUT_WITHOUT_SUBSCRIPTION", 409);
    }

    const subscription = await polarFetch(
      `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    );

    const subscriptionMeta = metadataOf(subscription);
    const subscriptionRoomId = metaValue(
      subscriptionMeta,
      "room_id",
      "roomId",
      "group_id",
      "groupId",
    );
    const subscriptionUserId = metaValue(
      subscriptionMeta,
      "user_id",
      "userId",
    );

    if (subscriptionRoomId && subscriptionRoomId !== roomId) {
      return errorResponse(request, "CHECKOUT_ROOM_MISMATCH", 403);
    }
    if (subscriptionUserId && subscriptionUserId !== user.id) {
      return errorResponse(request, "CHECKOUT_USER_MISMATCH", 403);
    }

    const subscriptionProduct = productIdOf(subscription);
    if (
      expectedProduct &&
      subscriptionProduct &&
      subscriptionProduct !== expectedProduct
    ) {
      return errorResponse(request, "CHECKOUT_PRODUCT_MISMATCH", 403);
    }

    await applySubscription(subscription, roomId);

    return json(request, {
      success: true,
      group: { id: room.id, code: room.code },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "AUTH_REQUIRED") {
      return errorResponse(request, "AUTH_REQUIRED", 401);
    }
    console.error("premium-verify", message);
    return errorResponse(request, message, 500);
  }
});
