import * as webpush from "jsr:@negrel/webpush@0.5.0";

export interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
  data?: Record<string, unknown>;
  icon?: string;
  badge?: string;
}

export interface PushSendResult {
  sent: number;
  gone: string[];
  failed: string[];
}

let serverPromise: Promise<webpush.ApplicationServer> | null = null;

function vapidKeys(): webpush.ExportedVapidKeys {
  const raw = Deno.env.get("VAPID_KEYS_JSON") ?? "";
  if (!raw) throw new Error("VAPID_NOT_CONFIGURED");

  try {
    const parsed = JSON.parse(raw) as webpush.ExportedVapidKeys;
    if (!parsed?.publicKey || !parsed?.privateKey) {
      throw new Error("missing keys");
    }
    return parsed;
  } catch {
    throw new Error("VAPID_INVALID_KEYS");
  }
}

function subject(): string {
  return Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@poop.lol";
}

export function getWebPushServer(): Promise<webpush.ApplicationServer> {
  if (!serverPromise) {
    serverPromise = (async () => {
      let keys: CryptoKeyPair;
      try {
        keys = await webpush.importVapidKeys(vapidKeys());
      } catch {
        throw new Error("VAPID_INVALID_KEYS");
      }

      return webpush.ApplicationServer.new({
        contactInformation: subject(),
        vapidKeys: keys,
      });
    })().catch((error) => {
      serverPromise = null;
      throw error;
    });
  }
  return serverPromise;
}

export async function sendWebPush(
  subscriptions: StoredPushSubscription[],
  payload: PushPayload,
): Promise<PushSendResult> {
  if (subscriptions.length === 0) {
    return { sent: 0, gone: [], failed: [] };
  }

  const server = await getWebPushServer();
  const body = JSON.stringify(payload);
  const result: PushSendResult = { sent: 0, gone: [], failed: [] };

  await Promise.all(
    subscriptions.map(async (row) => {
      try {
        const subscriber = server.subscribe({
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        });
        await subscriber.pushTextMessage(body, {
          ttl: 60 * 60 * 24,
          urgency: webpush.Urgency.High,
        });
        result.sent += 1;
      } catch (error) {
        if (error instanceof webpush.PushMessageError) {
          const status = error.response.status;
          if (error.isGone() || status === 404) {
            result.gone.push(row.endpoint);
          } else {
            result.failed.push(`${status}:${row.endpoint.slice(0, 80)}`);
          }
        } else {
          result.failed.push(
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    }),
  );

  return result;
}
