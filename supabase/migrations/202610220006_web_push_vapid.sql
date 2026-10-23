-- poop.lol — Native Web Push (VAPID) subscriptions.
-- OneSignal subscription ids are replaced by the standard Web Push endpoint and
-- encryption keys returned by PushSubscription.toJSON().

drop function if exists public.register_push_subscription(text, text);
drop function if exists public.unregister_push_subscription(text);

alter table public.push_subscriptions
  add column if not exists endpoint text,
  add column if not exists p256dh text,
  add column if not exists auth text;

-- Existing OneSignal rows cannot be used by Web Push. Users re-subscribe from
-- their browser on the next visit.
delete from public.push_subscriptions
where endpoint is null or p256dh is null or auth is null;

alter table public.push_subscriptions alter column endpoint set not null;
alter table public.push_subscriptions alter column p256dh set not null;
alter table public.push_subscriptions alter column auth set not null;
alter table public.push_subscriptions drop column if exists onesignal_subscription_id;

create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_endpoint_check;
alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_check
  check (endpoint ~* '^https://' and char_length(endpoint) between 10 and 2048);

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_p256dh_check;
alter table public.push_subscriptions
  add constraint push_subscriptions_p256dh_check
  check (p256dh ~ '^[A-Za-z0-9_-]{20,200}$');

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_auth_check;
alter table public.push_subscriptions
  add constraint push_subscriptions_auth_check
  check (auth ~ '^[A-Za-z0-9_-]{8,100}$');

create or replace function public.register_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_platform text default 'web'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_endpoint text := trim(coalesce(p_endpoint, ''));
  v_p256dh text := trim(coalesce(p_p256dh, ''));
  v_auth text := trim(coalesce(p_auth, ''));
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  if v_endpoint !~* '^https://'
    or char_length(v_endpoint) < 10
    or char_length(v_endpoint) > 2048
    or v_p256dh !~ '^[A-Za-z0-9_-]{20,200}$'
    or v_auth !~ '^[A-Za-z0-9_-]{8,100}$'
  then
    raise exception 'INVALID_SUBSCRIPTION' using errcode = 'P0001';
  end if;

  -- The same browser endpoint may be reused after logout/login. It is
  -- unguessable and is only ever issued by the browser push service.
  delete from public.push_subscriptions
  where endpoint = v_endpoint and user_id <> v_uid;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, platform)
  values (
    v_uid,
    v_endpoint,
    v_p256dh,
    v_auth,
    left(public.clean_text(coalesce(p_platform, 'web'), 30), 30)
  )
  on conflict (endpoint)
  do update set
    user_id = excluded.user_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    platform = excluded.platform,
    updated_at = now();

  return jsonb_build_object('subscribed', true);
end;
$$;

create or replace function public.unregister_push_subscription(p_endpoint text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  delete from public.push_subscriptions
  where user_id = v_uid
    and endpoint = trim(coalesce(p_endpoint, ''));

  return jsonb_build_object('subscribed', false);
end;
$$;

revoke all on function public.register_push_subscription(text, text, text, text) from public, anon, authenticated;
revoke all on function public.unregister_push_subscription(text) from public, anon, authenticated;
grant execute on function public.register_push_subscription(text, text, text, text) to authenticated;
grant execute on function public.unregister_push_subscription(text) to authenticated;
