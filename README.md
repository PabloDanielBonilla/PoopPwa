# poop.lol

Private-room poop competitions. The global leaderboard, country rankings, coins, packs and paid poop boosts are gone.

- **Logging a poop is always free.** `¡ACABO DE CAGAR! +1` never opens a payment modal.
- **Only room rankings exist.** Each room has its own members, activity feed and king.
- **Free room:** up to 5 members including the host.
- **Room Premium:** `$2.99/month`, paid by the host, unlimited members.
- **Real Web Push:** other members of the same room receive a notification in their phone's notification bar. The actor never notifies themselves, and no global user is notified.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 on **Vercel**
- **Supabase** for Auth (email/password), Postgres, RLS, Realtime, RPCs and Edge Functions
- **Native Web Push (VAPID)** with a service worker and Edge Functions
- **Polar** recurring monthly checkout + signed webhook for Room Premium (deferred)
- `pg_cron` for daily Premium expiry

There is no Firebase dependency, no service-account JSON and no privileged key in the browser. All writes go through Supabase RPCs or Edge Functions.

## Local setup

```bash
npm install
cp .env.example .env.local
cp .env.example .env.functions
# Fill in the NEXT_PUBLIC_* values
node scripts/generate-vapid-keys.mjs --write
npx supabase start       # optional, requires Docker
npx supabase db reset    # applies supabase/migrations
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Link and push the migrations:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The migrations create the schema, RLS policies, RPCs and the `pg_cron` job. The database starts empty; no Firebase data is imported.

### Authentication

In **Authentication → Providers**:

- **Email**: enabled. For production, configure custom SMTP and keep email confirmation on.
- **Google / Apple**: not configured yet. Use email/password for now. The UI may show disabled or unconfigured social buttons.

In **Authentication → URL Configuration**:

- Site URL: `https://poop.lol`
- Redirect URLs:
  - `https://poop.lol/auth/callback`
  - `http://localhost:3000/auth/callback`

The app uses `@supabase/ssr` with PKCE, `/auth/callback` and Next.js 16 Proxy session refresh (`src/proxy.ts`).

### Realtime

The migrations add `rooms`, `room_members`, `notifications` and `app_stats` to the `supabase_realtime` publication. Their SELECT policies limit each browser to its own rooms and notifications.

## Edge Functions

```bash
cp .env.example .env.functions
# Fill in only the server-side values
node scripts/generate-vapid-keys.mjs --write
npx supabase secrets set --env-file .env.functions
# Current scope: only the push functions are required.
npx supabase functions deploy push-demo send-push --use-api
```

| Function | Auth | Purpose |
| --- | --- | --- |
| `send-push` | Webhook secret | Resolves room members, excludes the actor, sends native Web Push |
| `premium-checkout` | User JWT | Host-only Polar checkout (deferred) |
| `premium-verify` | User JWT | Confirms the Polar checkout and activates Premium (deferred) |
| `premium-portal` | User JWT | Host-only Polar customer portal (deferred) |
| `push-demo` | User JWT | Sends a real test push to the signed-in user's devices |
| `polar-webhook` | Polar signature | Idempotent subscription create/update/cancel/revoke (deferred) |

### Push notifications

1. Generate the VAPID key pair:

   ```bash
   node scripts/generate-vapid-keys.mjs --write
   ```

   This writes `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to `.env.local` and `VAPID_KEYS_JSON` plus `VAPID_SUBJECT` to `.env.functions`. Keep the private key secret and never commit `.env.functions`. Change `VAPID_SUBJECT` to a contact email you control before production.

2. Put the public key in Vercel as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, then redeploy.
3. Set the Edge Function secrets:

   ```bash
   npx supabase secrets set --env-file .env.functions
   ```

4. Deploy the push functions:

   ```bash
   npx supabase functions deploy push-demo send-push --use-api
   ```

5. Create a **Database Webhook** in Supabase:
   - Table: `notification_jobs`
   - Events: `INSERT`
   - Type: HTTP Request
   - Method: `POST`
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/send-push`
   - Header: `x-webhook-secret: <PUSH_WEBHOOK_SECRET>`

The browser stores only the standard Web Push endpoint and its `p256dh`/`auth` encryption keys through the `register_push_subscription` RPC. The server resolves the room and recipients; the actor is excluded. On iPhone/iOS 16.4+, the PWA must be installed to the Home Screen before Safari allows Web Push.

Real push is intentionally disabled during `npm run dev` because the PWA service worker is unregistered in development to avoid stale Next.js chunks. Test it on an HTTPS deployment.

Once deployed, use **Test push notification** in the mobile menu (or the send icon in the desktop navbar). It requests permission, registers this device, and calls the authenticated `push-demo` Edge Function. The function only sends to the signed-in user's own Web Push subscriptions and is limited to 5 test pushes per hour. On iPhone, install the PWA first.

## Polar (Room Premium)

1. Create a **recurring monthly** product at `$2.99` in Polar.
2. Set `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID_ROOM_MONTHLY` and `POLAR_WEBHOOK_SECRET` as Edge Function secrets.
3. Point the Polar webhook to:
   `https://YOUR_PROJECT.supabase.co/functions/v1/polar-webhook`
4. Subscribe to subscription events (`subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.revoked`).
5. Use `POLAR_SERVER=sandbox` for sandbox tests.

Checkout success redirects to `/checkout`, which asks `premium-verify` to confirm the Polar subscription. The client can never activate Premium by itself. `expire_room_premium()` runs daily at 03:00 UTC and marks expired plans. Existing members are never removed; new joins are blocked while the room has 5 or more members.

## Security

- RLS is enabled on every table. There are no client INSERT/UPDATE/DELETE policies.
- All mutations are `security definer` RPCs with a fixed `search_path`, or Edge Functions using the service role.
- Room membership, Premium status, rankings, cooldowns and notification recipients are resolved server-side.
- Room codes are 8 characters, usernames are unique case-insensitively, and room creation/joining is rate-limited.
- The Polar webhook verifies signatures and is idempotent.
- Web Push endpoints and their encryption keys are bound to the authenticated Supabase user.
- CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and Permissions-Policy are set in `next.config.ts`.
- `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_KEYS_JSON` (private key), `PUSH_WEBHOOK_SECRET` and Polar secrets are only Edge Function secrets. Never expose them as `NEXT_PUBLIC_*` or commit them.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
npm start
npm run lint
```

Supabase:

```bash
npx supabase db push
npx supabase functions deploy push-demo send-push --use-api
npx supabase secrets set --env-file .env.functions
```

## Deploy on Vercel

1. Import the repository in Vercel.
2. Add `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
3. Deploy. The app is served from Vercel; Supabase handles auth, data and Edge Functions.
4. Add the Vercel production domain to Supabase Auth redirect URLs and to `ALLOWED_ORIGINS`.
5. Verify the Database Webhook and Polar webhook point to the deployed Supabase project.
