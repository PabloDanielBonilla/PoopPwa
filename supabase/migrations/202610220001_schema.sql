-- poop.lol — Supabase schema
-- Fresh database. No Firebase data is migrated.

-- PostgreSQL 13+ provides gen_random_uuid() in pg_catalog, so no extension is
-- required. Room codes derive their randomness from that UUID.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 3 and 30),
  avatar text not null default '' check (char_length(avatar) <= 300000),
  country text not null default '' check (char_length(country) <= 60),
  country_code text not null default 'CR' check (country_code ~ '^[A-Z]{2}$'),
  total_poops integer not null default 0 check (total_poops >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  poops_today integer not null default 0 check (poops_today >= 0),
  poops_this_week integer not null default 0 check (poops_this_week >= 0),
  timezone_offset integer not null default 0 check (timezone_offset between -840 and 840),
  sponsor_url text not null default '' check (sponsor_url = '' or sponsor_url ~* '^https://'),
  sponsor_text text not null default '' check (char_length(sponsor_text) <= 80),
  sponsor_clicks integer not null default 0 check (sponsor_clicks >= 0),
  is_sponsored boolean not null default false,
  last_poop_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));
create index if not exists profiles_created_at_idx on public.profiles (created_at);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 40),
  code text not null unique check (code ~ '^[A-Z2-9]{8}$'),
  description text not null default '' check (char_length(description) <= 140),
  category text not null default 'friends'
    check (category in ('friends', 'work', 'school', 'family', 'other')),
  avatar text not null default '' check (char_length(avatar) <= 300000),
  created_by uuid not null references auth.users(id) on delete cascade,
  total_poops integer not null default 0 check (total_poops >= 0),
  royal_decree text not null default '' check (char_length(royal_decree) <= 160),
  premium_status text not null default 'none'
    check (premium_status in ('none', 'active', 'trialing', 'past_due', 'canceled', 'expired')),
  premium_plan text not null default 'free' check (premium_plan in ('free', 'monthly')),
  premium_current_period_end timestamptz,
  premium_cancel_at_period_end boolean not null default false,
  polar_subscription_id text,
  polar_customer_id text,
  polar_product_id text,
  premium_started_at timestamptz,
  premium_updated_at timestamptz,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_created_by_idx on public.rooms (created_by);
create index if not exists rooms_last_activity_idx on public.rooms (last_activity_at desc);
create index if not exists rooms_polar_subscription_idx on public.rooms (polar_subscription_id);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  group_poops integer not null default 0 check (group_poops >= 0),
  poops_today integer not null default 0 check (poops_today >= 0),
  poops_today_date date,
  poops_this_week integer not null default 0 check (poops_this_week >= 0),
  poops_this_week_date date,
  last_poop_at timestamptz,
  primary key (room_id, user_id)
);

create unique index if not exists room_members_one_owner_idx
  on public.room_members (room_id) where role = 'owner';
create index if not exists room_members_user_idx on public.room_members (user_id);
create index if not exists room_members_room_rank_idx
  on public.room_members (room_id, group_poops desc, joined_at asc);

create table if not exists public.poops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  note text not null default '' check (char_length(note) <= 120),
  country text not null default '' check (char_length(country) <= 60),
  country_code text not null default '' check (country_code = '' or country_code ~ '^[A-Z]{2}$'),
  free boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists poops_user_created_idx on public.poops (user_id, created_at desc);
create index if not exists poops_room_created_idx on public.poops (room_id, created_at desc);

create table if not exists public.daily_poops (
  user_id uuid not null references auth.users(id) on delete cascade,
  poop_date date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, poop_date)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  actor_avatar text not null default '',
  title text not null check (char_length(title) <= 120),
  body text not null check (char_length(body) <= 240),
  url text not null default '/',
  tag text not null default 'poop-room',
  read boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  onesignal_subscription_id text not null unique,
  platform text not null default 'web' check (char_length(platform) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  body text not null check (char_length(body) <= 240),
  url text not null default '/',
  tag text not null default 'poop-room',
  data jsonb not null default '{}'::jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists notification_jobs_pending_idx
  on public.notification_jobs (created_at) where processed_at is null;

create table if not exists public.processed_webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, action, window_start)
);

create table if not exists public.premium_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete set null,
  event_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists premium_events_room_idx on public.premium_events (room_id, created_at desc);

create table if not exists public.app_stats (
  id integer primary key default 1 check (id = 1),
  total_poops bigint not null default 0 check (total_poops >= 0),
  total_users bigint not null default 0 check (total_users >= 0),
  total_rooms bigint not null default 0 check (total_rooms >= 0),
  premium_rooms bigint not null default 0 check (premium_rooms >= 0),
  poops_today bigint not null default 0 check (poops_today >= 0),
  poops_today_date date not null default current_date,
  last_poop_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.app_stats (id)
values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.clean_text(value text, max_len integer)
returns text
language sql
immutable
as $$
  select left(
    regexp_replace(
      regexp_replace(coalesce(value, ''), '<[^>]*>', '', 'g'),
      '[[:cntrl:]]',
      '',
      'g'
    ),
    greatest(coalesce(max_len, 0), 0)
  );
$$;

create or replace function public.clean_avatar(value text)
returns text
language sql
immutable
as $$
  select left(
    regexp_replace(trim(coalesce(value, '')), '[[:cntrl:]]', '', 'g'),
    300000
  );
$$;

create or replace function public.is_valid_avatar(value text)
returns boolean
language sql
immutable
as $$
  select
    value = ''
    or value ~* '^https://'
    or value ~* '^data:image/'
    or value ~ '^monogram:[A-Za-z0-9]{1,2}:[A-Za-z0-9#_-]+$'
    or value ~ '^/avatar[1-9][0-9]*\.jpg$'
    or value ~ '^/popohero1_transparent\.png(\?v=[0-9]+)?$';
$$;

create or replace function public.unique_username(base text)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  candidate text;
  suffix integer := 0;
  root text;
begin
  root := lower(regexp_replace(coalesce(base, 'pooper'), '[^a-zA-Z0-9_]+', '', 'g'));
  root := left(root, 20);
  if char_length(root) < 3 then
    root := 'pooper';
  end if;

  candidate := root;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    suffix := suffix + 1;
    candidate := left(root, 20) || suffix::text;
  end loop;

  return candidate;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.is_room_member(p_room_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = p_room_id and user_id = p_user_id
  );
$$;

create or replace function public.room_is_premium(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.rooms
    where id = p_room_id
      and premium_status in ('active', 'trialing', 'canceled')
      and (premium_current_period_end is null or premium_current_period_end > now())
  );
$$;

create or replace function public.profile_json(p_user_id uuid, p_private boolean default false)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'email', case
      when p_private and p_user_id = auth.uid() then coalesce(u.email, '')
      else ''
    end,
    'avatar', p.avatar,
    'country', p.country,
    'countryCode', p.country_code,
    'totalPoops', p.total_poops,
    'currentStreak', p.current_streak,
    'bestStreak', p.best_streak,
    'poopsToday', p.poops_today,
    'poopsThisWeek', p.poops_this_week,
    'createdAt', p.created_at,
    'lastPoopAt', p.last_poop_at,
    'timezoneOffset', p.timezone_offset,
    'sponsorUrl', p.sponsor_url,
    'sponsorText', p.sponsor_text,
    'sponsorClicks', p.sponsor_clicks,
    'isSponsored', p.is_sponsored,
    'groupIds', coalesce((
      select jsonb_agg(m.room_id)
      from public.room_members m
      where m.user_id = p_user_id
    ), '[]'::jsonb),
    'dailyHistory', coalesce((
      select jsonb_agg(
        jsonb_build_object('date', d.poop_date::text, 'count', d.count)
        order by d.poop_date
      )
      from (
        select poop_date, count
        from public.daily_poops
        where user_id = p_user_id
        order by poop_date desc
        limit 30
      ) d
    ), '[]'::jsonb)
  )
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = p_user_id;
$$;

create or replace function public.member_json(p_room_id uuid, p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'userId', m.user_id,
    'username', p.username,
    'avatar', p.avatar,
    'countryCode', p.country_code,
    'role', m.role,
    'joinedAt', m.joined_at,
    'groupPoops', m.group_poops,
    'poopsToday', m.poops_today,
    'poopsTodayDate', m.poops_today_date::text,
    'poopsThisWeek', m.poops_this_week,
    'poopsThisWeekDate', m.poops_this_week_date::text,
    'timezoneOffset', p.timezone_offset,
    'lastPoopAt', m.last_poop_at,
    'rank', (
      select count(*) + 1
      from public.room_members m2
      where m2.room_id = m.room_id
        and (
          m2.group_poops > m.group_poops
          or (m2.group_poops = m.group_poops and m2.joined_at < m.joined_at)
        )
    )
  )
  from public.room_members m
  join public.profiles p on p.id = m.user_id
  where m.room_id = p_room_id and m.user_id = p_user_id;
$$;

create or replace function public.sanitize_group(p_room_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'code', r.code,
    'description', r.description,
    'category', r.category,
    'avatar', r.avatar,
    'createdBy', r.created_by,
    'createdByName', cp.username,
    'createdByAvatar', cp.avatar,
    'createdAt', r.created_at,
    'members', coalesce((
      select jsonb_agg(
        public.member_json(m.room_id, m.user_id)
        order by m.group_poops desc, m.joined_at asc
      )
      from public.room_members m
      where m.room_id = r.id
    ), '[]'::jsonb),
    'memberCount', (select count(*) from public.room_members m where m.room_id = r.id),
    'memberIds', coalesce((
      select jsonb_agg(m.user_id)
      from public.room_members m
      where m.room_id = r.id
    ), '[]'::jsonb),
    'totalPoops', r.total_poops,
    'isPrivate', true,
    'activities', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'groupId', p.room_id,
          'userId', p.user_id,
          'username', pp.username,
          'avatar', pp.avatar,
          'note', p.note,
          'timestamp', p.created_at,
          'timeAgo', 'ahora',
          'poopsAdded', 1
        )
        order by p.created_at desc
      )
      from (
        select *
        from public.poops
        where room_id = r.id
        order by created_at desc
        limit 30
      ) p
      join public.profiles pp on pp.id = p.user_id
    ), '[]'::jsonb),
    'isVip', public.room_is_premium(r.id),
    'vipExpiresAt', r.premium_current_period_end,
    'maxMembers', case when public.room_is_premium(r.id) then null else 5 end,
    'royalDecree', r.royal_decree,
    'isPremium', public.room_is_premium(r.id),
    'premium', jsonb_build_object(
      'status', r.premium_status,
      'plan', r.premium_plan,
      'currentPeriodEnd', r.premium_current_period_end,
      'cancelAtPeriodEnd', r.premium_cancel_at_period_end,
      'polarSubscriptionId', r.polar_subscription_id,
      'polarCustomerId', r.polar_customer_id,
      'polarProductId', r.polar_product_id,
      'startedAt', r.premium_started_at,
      'updatedAt', r.premium_updated_at
    ),
    'lastActivityAt', r.last_activity_at,
    'isDemo', false
  )
  from public.rooms r
  left join public.profiles cp on cp.id = r.created_by
  where r.id = p_room_id;
$$;

create or replace function public.generate_room_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
      (get_byte(uuid_send(gen_random_uuid()), i) % 32) + 1,
      1
    ),
    '' order by i
  )
  from generate_series(0, 7) as i;
$$;

create or replace function public.check_rate_limit(
  p_action text,
  p_max integer,
  p_window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_window timestamptz;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  v_window := to_timestamp(
    floor(extract(epoch from now()) / greatest(p_window_seconds, 1))
    * greatest(p_window_seconds, 1)
  );

  insert into public.rate_limits (user_id, action, window_start, count)
  values (v_uid, p_action, v_window, 1)
  on conflict (user_id, action, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  if v_count > greatest(p_max, 1) then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auth lifecycle
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_username text;
  v_avatar text;
  v_country text;
  v_country_code text;
  attempt integer;
begin
  v_username := public.unique_username(coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    split_part(coalesce(new.email, ''), '@', 1),
    'pooper'
  ));
  v_avatar := public.clean_avatar(coalesce(
    new.raw_user_meta_data->>'avatar',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  ));
  if not public.is_valid_avatar(v_avatar) then
    v_avatar := '';
  end if;
  v_country := public.clean_text(coalesce(new.raw_user_meta_data->>'country', ''), 60);
  v_country_code := upper(coalesce(new.raw_user_meta_data->>'country_code', 'CR'));
  if v_country_code !~ '^[A-Z]{2}$' then
    v_country_code := 'CR';
  end if;

  for attempt in 1..5 loop
    begin
      insert into public.profiles (id, username, avatar, country, country_code)
      values (new.id, v_username, v_avatar, v_country, v_country_code)
      on conflict (id) do nothing;
      exit;
    exception when unique_violation then
      v_username := public.unique_username(v_username || attempt::text);
    end;
  end loop;

  update public.app_stats
  set total_users = total_users + 1, updated_at = now()
  where id = 1;

  return new;
end;
$$;

create or replace function public.handle_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.app_stats
  set total_users = greatest(total_users - 1, 0), updated_at = now()
  where id = 1;
  return old;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_user_deleted();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists rooms_touch_updated_at on public.rooms;
create trigger rooms_touch_updated_at
  before update on public.rooms
  for each row execute function public.touch_updated_at();

drop trigger if exists push_subscriptions_touch_updated_at on public.push_subscriptions;
create trigger push_subscriptions_touch_updated_at
  before update on public.push_subscriptions
  for each row execute function public.touch_updated_at();
