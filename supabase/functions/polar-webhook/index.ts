import {
  admin,
  base64ToBytes,
  errorResponse,
  hmacSha256,
  json,
  safeEqual,
  sha256Hex,
} from "../_shared/utils.ts";
import { applySubscription } from "../_shared/polar.ts";

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const keyBytes = secret.startsWith("whsec_")
    ? base64ToBytes(secret.slice("whsec_".length))
    : new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToHex(new Uint8Array(signature));
}

async function verifyStandardWebhook(
  request: Request,
  rawBody: string,
  secret: string,
): Promise<boolean> {
  const id = request.headers.get("webhook-id") ?? "";
  const timestamp = request.headers.get("webhook-timestamp") ?? "";
  const signature = request.headers.get("webhook-signature") ?? "";
  if (!id || !timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = await hmacSha256(
    secret,
    `${id}.${timestamp}.${rawBody}`,
  );

  return signature
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1,"))
    .some((part) => safeEqual(part.slice(3), expected));
}

async function verifyLegacySignature(
  request: Request,
  rawBody: string,
  secret: string,
): Promise<boolean> {
  const header = request.headers.get("polar-webhook-signature") ?? "";
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index), part.slice(index + 1)];
    }),
  );

  if (!parts.t || !parts.v1) return false;
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = await hmacHex(secret, `${parts.t}.${rawBody}`);
  return safeEqual(parts.v1, expected);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return errorResponse(request, "METHOD_NOT_ALLOWED", 405);
  }

  const secret = Deno.env.get("POLAR_WEBHOOK_SECRET") ?? "";
  if (!secret) {
    return errorResponse(request, "WEBHOOK_NOT_CONFIGURED", 503);
  }

  const rawBody = await request.text();
  let valid = false;
  try {
    valid =
      (await verifyStandardWebhook(request, rawBody, secret)) ||
      (await verifyLegacySignature(request, rawBody, secret));
  } catch {
    valid = false;
  }

  if (!valid) {
    return errorResponse(request, "INVALID_SIGNATURE", 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse(request, "INVALID_JSON", 400);
  }

  const eventType = String(payload?.type ?? "unknown");
  const eventId =
    request.headers.get("webhook-id") ??
    String(payload?.id ?? "") ??
    "";
  const resolvedEventId = eventId || (await sha256Hex(rawBody));

  const { error: insertError } = await admin
    .from("processed_webhook_events")
    .insert({ id: resolvedEventId, type: eventType });

  if (insertError) {
    if (insertError.code === "23505") {
      return json(request, { ok: true, duplicate: true });
    }
    return errorResponse(request, insertError.message, 500);
  }

  try {
    const data = payload?.data ?? payload?.object ?? payload;
    let roomId: string | null = null;

    // Only subscription events may change Premium. Checkout events are handled
    // by premium-verify, which fetches the subscription directly from Polar.
    if (eventType.startsWith("subscription.")) {
      roomId = await applySubscription(data);
    }

    await admin.from("premium_events").insert({
      room_id: roomId,
      event_id: resolvedEventId,
      event_type: eventType,
      payload,
    });

    return json(request, { ok: true, roomId });
  } catch (error) {
    // Allow Polar to retry this event.
    await admin
      .from("processed_webhook_events")
      .delete()
      .eq("id", resolvedEventId);

    const message = error instanceof Error ? error.message : String(error);
    console.error("polar-webhook", message);
    return errorResponse(request, "WEBHOOK_FAILED", 500);
  }
});
