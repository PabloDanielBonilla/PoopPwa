import { admin } from "./utils.ts";

export function polarBaseUrl(): string {
  return (Deno.env.get("POLAR_SERVER") ?? "production") === "sandbox"
    ? "https://sandbox-api.polar.sh"
    : "https://api.polar.sh";
}

export function polarConfigured(): boolean {
  return Boolean(
    Deno.env.get("POLAR_ACCESS_TOKEN") &&
      Deno.env.get("POLAR_PRODUCT_ID_ROOM_MONTHLY"),
  );
}

export async function polarFetch(
  path: string,
  init: RequestInit = {},
): Promise<any> {
  const token = Deno.env.get("POLAR_ACCESS_TOKEN") ?? "";
  if (!token) throw new Error("POLAR_NOT_CONFIGURED");

  const response = await fetch(
    `${polarBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    },
  );

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const detail = data?.detail ?? data?.message ?? text;
    throw new Error(`POLAR_${response.status}: ${String(detail).slice(0, 500)}`);
  }

  return data;
}

export function mapPremiumStatus(status: string): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "revoked":
    case "incomplete_expired":
    case "unpaid":
      return "expired";
    default:
      return "none";
  }
}

export function normalizeSubscription(subscription: any) {
  const status = mapPremiumStatus(String(subscription?.status ?? ""));
  const periodEnd =
    subscription?.current_period_end ??
    subscription?.currentPeriodEnd ??
    null;
  const startedAt =
    subscription?.created_at ??
    subscription?.createdAt ??
    null;

  const endDate = periodEnd ? new Date(periodEnd) : null;
  const startDate = startedAt ? new Date(startedAt) : null;

  return {
    status,
    plan: status === "none" || status === "expired" ? "free" : "monthly",
    currentPeriodEnd:
      endDate && !Number.isNaN(endDate.getTime()) ? endDate.toISOString() : null,
    cancelAtPeriodEnd: Boolean(
      subscription?.cancel_at_period_end ?? subscription?.cancelAtPeriodEnd,
    ),
    polarSubscriptionId: subscription?.id ?? null,
    polarCustomerId:
      subscription?.customer_id ?? subscription?.customerId ?? null,
    polarProductId: subscription?.product_id ?? subscription?.productId ?? null,
    startedAt:
      startDate && !Number.isNaN(startDate.getTime())
        ? startDate.toISOString()
        : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function applySubscription(
  subscription: any,
  fallbackRoomId?: string | null,
): Promise<string | null> {
  const metadata = subscription?.metadata ?? {};
  let roomId = String(
    metadata.room_id ?? metadata.roomId ?? metadata.group_id ??
      metadata.groupId ?? fallbackRoomId ?? "",
  );

  if (!roomId && subscription?.id) {
    const { data } = await admin
      .from("rooms")
      .select("id")
      .eq("polar_subscription_id", subscription.id)
      .maybeSingle<{ id: string }>();
    roomId = data?.id ?? "";
  }

  if (!roomId) {
    console.warn("[polar] subscription without a room", subscription?.id);
    return null;
  }

  const premium = normalizeSubscription(subscription);
  const expectedProduct = Deno.env.get("POLAR_PRODUCT_ID_ROOM_MONTHLY") ?? "";
  const actualProduct = String(premium.polarProductId ?? "");

  if (expectedProduct && actualProduct && actualProduct !== expectedProduct) {
    console.warn("[polar] subscription product does not match room plan", {
      subscriptionId: premium.polarSubscriptionId,
      actualProduct,
      expectedProduct,
    });
    return null;
  }

  const { error } = await admin
    .from("rooms")
    .update({
      premium_status: premium.status,
      premium_plan: premium.plan,
      premium_current_period_end: premium.currentPeriodEnd,
      premium_cancel_at_period_end: premium.cancelAtPeriodEnd,
      polar_subscription_id: premium.polarSubscriptionId,
      polar_customer_id: premium.polarCustomerId,
      polar_product_id: premium.polarProductId,
      premium_started_at: premium.startedAt,
      premium_updated_at: premium.updatedAt,
    })
    .eq("id", roomId);

  if (error) throw new Error(error.message);

  try {
    await admin.rpc("refresh_premium_stats");
  } catch {
    // Stats are cosmetic; never fail a paid subscription update over them.
  }
  return roomId;
}
