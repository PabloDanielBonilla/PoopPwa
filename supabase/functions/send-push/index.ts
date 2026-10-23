import {
  admin,
  appUrl,
  errorResponse,
  json,
  safeEqual,
} from "../_shared/utils.ts";
import {
  sendWebPush,
  type StoredPushSubscription,
} from "../_shared/webpush.ts";

interface Job {
  id: string;
  room_id: string;
  actor_id: string;
  title: string;
  body: string;
  url: string;
  tag: string;
  data: Record<string, unknown>;
  attempts: number;
  processed_at: string | null;
}

interface WebhookBody {
  type?: string;
  table?: string;
  record?: Job;
  job_id?: string;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return errorResponse(request, "METHOD_NOT_ALLOWED", 405);
  }

  const expectedSecret = Deno.env.get("PUSH_WEBHOOK_SECRET") ?? "";
  const providedSecret = request.headers.get("x-webhook-secret") ?? "";

  if (!expectedSecret || !safeEqual(expectedSecret, providedSecret)) {
    return errorResponse(request, "UNAUTHORIZED", 401);
  }

  let body: WebhookBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse(request, "INVALID_JSON", 400);
  }

  const jobId = body.record?.id ?? body.job_id;
  if (!jobId) {
    return errorResponse(request, "MISSING_JOB_ID", 400);
  }

  const { data: job, error: jobError } = await admin
    .from("notification_jobs")
    .select("id, room_id, actor_id, title, body, url, tag, data, attempts, processed_at")
    .eq("id", jobId)
    .maybeSingle<Job>();

  if (jobError) {
    return errorResponse(request, jobError.message, 500);
  }
  if (!job) {
    return json(request, { ok: true, skipped: "job_not_found" });
  }
  if (job.processed_at) {
    return json(request, { ok: true, skipped: "already_processed" });
  }

  // Claim the job. If another webhook invocation already claimed it, stop.
  const { data: claimed, error: claimError } = await admin
    .from("notification_jobs")
    .update({
      processed_at: new Date().toISOString(),
      attempts: (job.attempts ?? 0) + 1,
    })
    .eq("id", job.id)
    .is("processed_at", null)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (claimError) {
    return errorResponse(request, claimError.message, 500);
  }
  if (!claimed) {
    return json(request, { ok: true, skipped: "already_claimed" });
  }

  try {
    const { data: members, error: membersError } = await admin
      .from("room_members")
      .select("user_id")
      .eq("room_id", job.room_id)
      .neq("user_id", job.actor_id);

    if (membersError) throw new Error(membersError.message);

    const memberIds = (members ?? []).map((member) => member.user_id);
    if (memberIds.length === 0) {
      return json(request, { ok: true, sent: 0, reason: "no_recipients" });
    }

    const { data: subscriptions, error: subscriptionsError } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("user_id", memberIds);

    if (subscriptionsError) throw new Error(subscriptionsError.message);

    const rows = (subscriptions ?? []) as StoredPushSubscription[];
    if (rows.length === 0) {
      return json(request, { ok: true, sent: 0, reason: "no_subscriptions" });
    }

    const targetUrl = job.url.startsWith("http")
      ? job.url
      : `${appUrl()}${job.url.startsWith("/") ? "" : "/"}${job.url}`;

    const pushResult = await sendWebPush(rows, {
      title: job.title,
      body: job.body,
      url: targetUrl,
      tag: job.tag,
      data: job.data,
      icon: `${appUrl()}/pwa-192x192.png`,
      badge: `${appUrl()}/pwa-192x192.png`,
    });

    if (pushResult.gone.length > 0) {
      await admin
        .from("push_subscriptions")
        .delete()
        .in("endpoint", pushResult.gone);
    }

    if (pushResult.sent === 0) {
      throw new Error(`PUSH_FAILED: ${pushResult.failed.slice(0, 3).join(" | ")}`);
    }

    return json(request, {
      ok: true,
      sent: pushResult.sent,
      recipients: memberIds.length,
      failed: pushResult.failed.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await admin
      .from("notification_jobs")
      .update({
        processed_at: null,
        last_error: message.slice(0, 500),
      })
      .eq("id", job.id);

    if (message === "VAPID_NOT_CONFIGURED" || message === "VAPID_INVALID_KEYS") {
      return errorResponse(request, message, 503);
    }

    return errorResponse(request, "PUSH_FAILED", 500);
  }
});
