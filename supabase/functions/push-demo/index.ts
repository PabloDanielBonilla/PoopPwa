import {
  admin,
  appUrl,
  corsHeaders,
  errorResponse,
  json,
  requireUser,
} from "../_shared/utils.ts";
import {
  sendWebPush,
  type StoredPushSubscription,
} from "../_shared/webpush.ts";

const MAX_DEMOS_PER_HOUR = 5;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return errorResponse(request, "METHOD_NOT_ALLOWED", 405);
  }

  try {
    const user = await requireUser(request);

    const { data: subscriptions, error: subscriptionsError } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user.id);

    if (subscriptionsError) throw new Error(subscriptionsError.message);

    const rows = (subscriptions ?? []) as StoredPushSubscription[];
    if (rows.length === 0) {
      return json(request, {
        ok: true,
        sent: 0,
        reason: "no_subscriptions",
      });
    }

    const { data: limitCount, error: limitError } = await admin.rpc(
      "consume_push_demo_limit",
      { p_user_id: user.id },
    );
    if (limitError) throw new Error(limitError.message);
    if (Number(limitCount) > MAX_DEMOS_PER_HOUR) {
      return errorResponse(request, "PUSH_DEMO_RATE_LIMITED", 429);
    }

    const baseUrl = appUrl();
    const pushResult = await sendWebPush(rows, {
      title: "poop.lol push test",
      body: "Las notificaciones push están funcionando en este dispositivo.",
      url: `${baseUrl}/?push=demo`,
      tag: "poop-push-demo",
      data: { type: "push_demo" },
      icon: `${baseUrl}/pwa-192x192.png`,
      badge: `${baseUrl}/pwa-192x192.png`,
    });

    if (pushResult.gone.length > 0) {
      await admin
        .from("push_subscriptions")
        .delete()
        .in("endpoint", pushResult.gone);
    }

    if (pushResult.sent === 0) {
      console.error("push-demo failed", pushResult.failed);
      return errorResponse(request, "PUSH_DEMO_FAILED", 500);
    }

    return json(request, {
      ok: true,
      sent: pushResult.sent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "AUTH_REQUIRED") {
      return errorResponse(request, "AUTH_REQUIRED", 401);
    }
    if (message === "VAPID_NOT_CONFIGURED" || message === "VAPID_INVALID_KEYS") {
      return errorResponse(request, message, 503);
    }
    console.error("push-demo", message);
    return errorResponse(request, "PUSH_DEMO_FAILED", 500);
  }
});
