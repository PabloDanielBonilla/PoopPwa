-- poop.lol — Row Level Security and grants
-- The browser can only read its own profile, its rooms, its room members,
-- its own poop history and its own notifications. Every mutation goes through
-- a SECURITY DEFINER RPC that validates auth.uid().

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.poops enable row level security;
alter table public.daily_poops enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.processed_webhook_events enable row level security;
alter table public.rate_limits enable row level security;
alter table public.premium_events enable row level security;
alter table public.app_stats enable row level security;

-- Read-only grants. RLS still decides which rows are visible.
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.rooms to authenticated;
grant select on public.room_members to authenticated;
grant select on public.poops to authenticated;
grant select on public.notifications to authenticated;
grant select on public.app_stats to anon, authenticated;

-- Helper functions used inside RLS policies. They run as definer so the
-- policy can check membership without recursively evaluating room_members RLS.
revoke all on function public.is_room_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.is_room_member(uuid, uuid) to authenticated;

revoke all on function public.room_is_premium(uuid) from public, anon, authenticated;
grant execute on function public.room_is_premium(uuid) to anon, authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists rooms_select_member on public.rooms;
create policy rooms_select_member
  on public.rooms
  for select
  to authenticated
  using (public.is_room_member(id));

drop policy if exists room_members_select_member on public.room_members;
create policy room_members_select_member
  on public.room_members
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_room_member(room_id));

drop policy if exists poops_select_own on public.poops;
create policy poops_select_own
  on public.poops
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists app_stats_select_public on public.app_stats;
create policy app_stats_select_public
  on public.app_stats
  for select
  to anon, authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policies are created for any table. The anon and
-- authenticated roles therefore cannot mutate tables directly. Writes happen
-- only through the RPCs in 202610220003_rpc.sql or through service_role in
-- Edge Functions.

-- Realtime: expose only tables whose SELECT policies already restrict rows.
alter table public.rooms replica identity full;
alter table public.room_members replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    execute 'alter publication supabase_realtime add table public.rooms';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_members'
  ) then
    execute 'alter publication supabase_realtime add table public.room_members';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_stats'
  ) then
    execute 'alter publication supabase_realtime add table public.app_stats';
  end if;
end $$;
