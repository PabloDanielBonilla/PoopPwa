-- poop.lol — Server-authoritative RPCs
-- All writes are validated here. The browser never decides membership limits,
-- Premium status, rankings or who receives a notification.

create or replace function public.ensure_profile(
  p_username text default null,
  p_avatar text default null,
  p_country text default null,
  p_country_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_country_code text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid) then
    v_country_code := upper(coalesce(nullif(p_country_code, ''), 'CR'));
    if v_country_code !~ '^[A-Z]{2}$' then
      v_country_code := 'CR';
    end if;

    insert into public.profiles (id, username, avatar, country, country_code)
    values (
      v_uid,
      public.unique_username(coalesce(nullif(p_username, ''), 'pooper')),
      case
        when public.is_valid_avatar(public.clean_avatar(p_avatar)) then public.clean_avatar(p_avatar)
        else ''
      end,
      public.clean_text(coalesce(p_country, ''), 60),
      v_country_code
    );
  end if;

  return jsonb_build_object('user', public.profile_json(v_uid, true));
end;
$$;

create or replace function public.update_profile(
  p_username text,
  p_avatar text,
  p_country text,
  p_country_code text,
  p_sponsor_url text default '',
  p_sponsor_text text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_avatar text;
  v_country text;
  v_country_code text;
  v_sponsor_url text;
  v_sponsor_text text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  v_username := lower(regexp_replace(public.clean_text(p_username, 30), '[^a-zA-Z0-9_]+', '', 'g'));
  if char_length(v_username) < 3 then
    raise exception 'INVALID_USERNAME' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(username) = v_username and id <> v_uid
  ) then
    raise exception 'USERNAME_TAKEN' using errcode = 'P0001';
  end if;

  v_avatar := public.clean_avatar(p_avatar);
  if not public.is_valid_avatar(v_avatar) then
    raise exception 'INVALID_AVATAR' using errcode = 'P0001';
  end if;

  v_country := public.clean_text(coalesce(p_country, ''), 60);
  v_country_code := upper(coalesce(nullif(p_country_code, ''), 'CR'));
  if v_country_code !~ '^[A-Z]{2}$' then
    v_country_code := 'CR';
  end if;

  v_sponsor_url := trim(coalesce(p_sponsor_url, ''));
  v_sponsor_text := public.clean_text(coalesce(p_sponsor_text, ''), 80);
  if v_sponsor_url <> '' and v_sponsor_url !~* '^https://' then
    raise exception 'INVALID_SPONSOR_URL' using errcode = 'P0001';
  end if;

  update public.profiles
  set username = v_username,
      avatar = v_avatar,
      country = v_country,
      country_code = v_country_code,
      sponsor_url = v_sponsor_url,
      sponsor_text = v_sponsor_text,
      is_sponsored = v_sponsor_url <> '',
      updated_at = now()
  where id = v_uid;

  return jsonb_build_object('user', public.profile_json(v_uid, true));
end;
$$;

create or replace function public.get_my_rooms()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(public.sanitize_group(m.room_id) order by r.last_activity_at desc),
    '[]'::jsonb
  )
  from public.room_members m
  join public.rooms r on r.id = m.room_id
  where m.user_id = auth.uid();
$$;

create or replace function public.get_room_by_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
  v_room public.rooms%rowtype;
  v_member_count integer;
  v_premium boolean;
  v_is_member boolean;
begin
  v_code := upper(regexp_replace(coalesce(p_code, ''), '[^A-Z0-9]', '', 'g'));
  if char_length(v_code) <> 8 then
    return null;
  end if;

  select * into v_room from public.rooms where code = v_code;
  if not found then
    return null;
  end if;

  select count(*) into v_member_count from public.room_members where room_id = v_room.id;
  v_premium := public.room_is_premium(v_room.id);
  v_is_member := case
    when auth.uid() is null then false
    else public.is_room_member(v_room.id, auth.uid())
  end;

  return jsonb_build_object(
    'id', v_room.id,
    'name', v_room.name,
    'code', v_room.code,
    'description', v_room.description,
    'category', v_room.category,
    'avatar', v_room.avatar,
    'createdBy', v_room.created_by,
    'createdByName', (select username from public.profiles where id = v_room.created_by),
    'createdByAvatar', (select avatar from public.profiles where id = v_room.created_by),
    'createdAt', v_room.created_at,
    'members', '[]'::jsonb,
    'memberCount', v_member_count,
    'memberIds', '[]'::jsonb,
    'totalPoops', v_room.total_poops,
    'isPrivate', true,
    'activities', '[]'::jsonb,
    'isVip', v_premium,
    'vipExpiresAt', v_room.premium_current_period_end,
    'maxMembers', case when v_premium then null else 5 end,
    'royalDecree', v_room.royal_decree,
    'isPremium', v_premium,
    'premium', jsonb_build_object(
      'status', v_room.premium_status,
      'plan', v_room.premium_plan,
      'currentPeriodEnd', v_room.premium_current_period_end,
      'cancelAtPeriodEnd', v_room.premium_cancel_at_period_end,
      'polarSubscriptionId', null,
      'polarCustomerId', null,
      'polarProductId', v_room.polar_product_id,
      'startedAt', null,
      'updatedAt', v_room.premium_updated_at
    ),
    'isMember', v_is_member,
    'isFull', (not v_premium and v_member_count >= 5),
    'lastActivityAt', v_room.last_activity_at,
    'isDemo', false
  );
end;
$$;

create or replace function public.create_room(
  p_name text,
  p_description text default '',
  p_category text default 'friends',
  p_avatar text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_room public.rooms%rowtype;
  v_code text;
  v_name text;
  v_description text;
  v_category text;
  v_avatar text;
  attempt integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  perform public.check_rate_limit('create_room', 5, 3600);

  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    insert into public.profiles (id, username)
    values (v_uid, public.unique_username('pooper'))
    returning * into v_profile;
  end if;

  v_name := public.clean_text(p_name, 40);
  if char_length(v_name) < 3 then
    raise exception 'INVALID_ROOM_NAME' using errcode = 'P0001';
  end if;

  v_description := public.clean_text(coalesce(p_description, ''), 140);
  v_category := lower(coalesce(p_category, 'friends'));
  if v_category not in ('friends', 'work', 'school', 'family', 'other') then
    v_category := 'friends';
  end if;
  v_avatar := public.clean_avatar(p_avatar);
  if not public.is_valid_avatar(v_avatar) or v_avatar = '' then
    v_avatar := v_profile.avatar;
  end if;
  if not public.is_valid_avatar(v_avatar) then
    v_avatar := '';
  end if;

  for attempt in 1..5 loop
    begin
      v_code := public.generate_room_code();
      insert into public.rooms (name, code, description, category, avatar, created_by)
      values (v_name, v_code, v_description, v_category, v_avatar, v_uid)
      returning * into v_room;
      exit;
    exception when unique_violation then
      if attempt = 5 then
        raise;
      end if;
    end;
  end loop;

  insert into public.room_members (room_id, user_id, role)
  values (v_room.id, v_uid, 'owner');

  update public.app_stats
  set total_rooms = total_rooms + 1, updated_at = now()
  where id = 1;

  return jsonb_build_object('group', public.sanitize_group(v_room.id));
end;
$$;

create or replace function public.join_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_room public.rooms%rowtype;
  v_member public.room_members%rowtype;
  v_member_count integer;
  v_limit integer;
  v_premium boolean;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  perform public.check_rate_limit('join_room', 20, 3600);

  v_code := upper(regexp_replace(coalesce(p_code, ''), '[^A-Z0-9]', '', 'g'));
  if char_length(v_code) <> 8 then
    raise exception 'INVALID_CODE' using errcode = 'P0001';
  end if;

  select * into v_room from public.rooms where code = v_code for update;
  if not found then
    raise exception 'ROOM_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_member
  from public.room_members
  where room_id = v_room.id and user_id = v_uid;

  if found then
    return jsonb_build_object(
      'group', public.sanitize_group(v_room.id),
      'alreadyMember', true,
      'premium', public.room_is_premium(v_room.id),
      'freeLimit', 5
    );
  end if;

  select count(*) into v_member_count from public.room_members where room_id = v_room.id;
  v_premium := public.room_is_premium(v_room.id);
  v_limit := case when v_premium then 1000000 else 5 end;

  if v_member_count >= v_limit then
    raise exception 'ROOM_FULL' using errcode = 'P0001',
      detail = jsonb_build_object(
        'memberCount', v_member_count,
        'freeLimit', 5,
        'premium', v_premium
      )::text;
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (v_room.id, v_uid, 'member');

  update public.rooms
  set last_activity_at = now(), updated_at = now()
  where id = v_room.id;

  return jsonb_build_object(
    'group', public.sanitize_group(v_room.id),
    'alreadyMember', false,
    'premium', v_premium,
    'freeLimit', 5
  );
end;
$$;

create or replace function public.leave_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_member public.room_members%rowtype;
  v_member_count integer;
  v_deleted boolean := false;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'ROOM_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_member
  from public.room_members
  where room_id = p_room_id and user_id = v_uid;

  if not found then
    raise exception 'NOT_ROOM_MEMBER' using errcode = 'P0001';
  end if;

  if v_member.role = 'owner' then
    select count(*) into v_member_count from public.room_members where room_id = p_room_id;
    if v_member_count > 1 then
      raise exception 'OWNER_CANNOT_LEAVE' using errcode = 'P0001';
    end if;
    delete from public.rooms where id = p_room_id;
    v_deleted := true;
    update public.app_stats
    set total_rooms = greatest(total_rooms - 1, 0),
        premium_rooms = (
          select count(*) from public.rooms
          where premium_status in ('active', 'trialing', 'canceled')
            and (premium_current_period_end is null or premium_current_period_end > now())
        ),
        updated_at = now()
    where id = 1;
  else
    delete from public.room_members where room_id = p_room_id and user_id = v_uid;
    update public.rooms set last_activity_at = now() where id = p_room_id;
  end if;

  return jsonb_build_object('left', true, 'deleted', v_deleted, 'groupId', p_room_id);
end;
$$;

create or replace function public.delete_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'ROOM_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_room.created_by <> v_uid then
    raise exception 'NOT_ROOM_OWNER' using errcode = 'P0001';
  end if;

  delete from public.rooms where id = p_room_id;

  update public.app_stats
  set total_rooms = greatest(total_rooms - 1, 0),
      premium_rooms = (
        select count(*) from public.rooms
        where premium_status in ('active', 'trialing', 'canceled')
          and (premium_current_period_end is null or premium_current_period_end > now())
      ),
      updated_at = now()
  where id = 1;

  return jsonb_build_object('deleted', true, 'groupId', p_room_id);
end;
$$;

create or replace function public.set_decree(p_room_id uuid, p_decree text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_decree text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    raise exception 'ROOM_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_room.created_by <> v_uid then
    raise exception 'NOT_ROOM_OWNER' using errcode = 'P0001';
  end if;

  v_decree := public.clean_text(coalesce(p_decree, ''), 160);
  update public.rooms
  set royal_decree = v_decree, updated_at = now()
  where id = p_room_id;

  return jsonb_build_object('royalDecree', v_decree);
end;
$$;

create or replace function public.log_poop(
  p_room_id uuid default null,
  p_note text default '',
  p_timezone_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_room public.rooms%rowtype;
  v_member public.room_members%rowtype;
  v_today date;
  v_yesterday date;
  v_week_start date;
  v_last_date date;
  v_count_today integer;
  v_count_week integer;
  v_new_streak integer;
  v_new_best integer;
  v_old_rank integer := 0;
  v_new_rank integer := 0;
  v_poop_id uuid;
  v_group jsonb := null;
  v_offset integer;
  v_actor_name text;
  v_actor_avatar text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  v_offset := greatest(least(coalesce(p_timezone_offset, 0), 840), -840);

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    insert into public.profiles (id, username)
    values (v_uid, public.unique_username('pooper'))
    returning * into v_profile;
  end if;

  if v_profile.last_poop_at is not null
     and now() - v_profile.last_poop_at < interval '10 seconds' then
    raise exception 'COOLDOWN' using errcode = 'P0001',
      detail = jsonb_build_object(
        'retryAfterMs', greatest(
          0,
          10000 - floor(extract(epoch from (now() - v_profile.last_poop_at)) * 1000)::integer
        )
      )::text;
  end if;

  v_today := (now() - make_interval(mins => v_offset))::date;
  v_yesterday := v_today - 1;
  v_week_start := v_today - 6;
  v_last_date := case
    when v_profile.last_poop_at is not null
      then (v_profile.last_poop_at - make_interval(mins => v_offset))::date
    else null
  end;

  insert into public.daily_poops (user_id, poop_date, count)
  values (v_uid, v_today, 1)
  on conflict (user_id, poop_date)
  do update set count = public.daily_poops.count + 1
  returning count into v_count_today;

  select coalesce(sum(count), 0)::integer into v_count_week
  from public.daily_poops
  where user_id = v_uid
    and poop_date between v_week_start and v_today;

  v_new_streak := case
    when v_last_date = v_today then greatest(v_profile.current_streak, 1)
    when v_last_date = v_yesterday then v_profile.current_streak + 1
    else 1
  end;
  v_new_best := greatest(v_profile.best_streak, v_new_streak);

  update public.profiles
  set total_poops = v_profile.total_poops + 1,
      poops_today = v_count_today,
      poops_this_week = v_count_week,
      current_streak = v_new_streak,
      best_streak = v_new_best,
      last_poop_at = now(),
      timezone_offset = v_offset,
      updated_at = now()
  where id = v_uid
  returning * into v_profile;

  v_actor_name := v_profile.username;
  v_actor_avatar := v_profile.avatar;

  if p_room_id is not null then
    select * into v_room from public.rooms where id = p_room_id for update;
    if not found then
      raise exception 'ROOM_NOT_FOUND' using errcode = 'P0001';
    end if;

    select * into v_member
    from public.room_members
    where room_id = p_room_id and user_id = v_uid
    for update;
    if not found then
      raise exception 'NOT_ROOM_MEMBER' using errcode = 'P0001';
    end if;

    v_old_rank := 1 + (
      select count(*)
      from public.room_members m
      where m.room_id = p_room_id
        and m.user_id <> v_uid
        and (
          m.group_poops > v_member.group_poops
          or (m.group_poops = v_member.group_poops and m.joined_at < v_member.joined_at)
        )
    );

    update public.room_members
    set group_poops = v_member.group_poops + 1,
        poops_today = v_count_today,
        poops_today_date = v_today,
        poops_this_week = v_count_week,
        poops_this_week_date = v_week_start,
        last_poop_at = now()
    where room_id = p_room_id and user_id = v_uid
    returning * into v_member;

    v_new_rank := 1 + (
      select count(*)
      from public.room_members m
      where m.room_id = p_room_id
        and m.user_id <> v_uid
        and (
          m.group_poops > v_member.group_poops
          or (m.group_poops = v_member.group_poops and m.joined_at < v_member.joined_at)
        )
    );

    update public.rooms
    set total_poops = total_poops + 1,
        last_activity_at = now(),
        updated_at = now()
    where id = p_room_id;

    insert into public.poops (user_id, room_id, note, country, country_code, free)
    values (
      v_uid,
      p_room_id,
      public.clean_text(coalesce(p_note, ''), 120),
      v_profile.country,
      v_profile.country_code,
      true
    )
    returning id into v_poop_id;

    insert into public.notifications (
      user_id, room_id, actor_id, actor_name, actor_avatar,
      title, body, url, tag, data
    )
    select
      m.user_id,
      p_room_id,
      v_uid,
      v_actor_name,
      v_actor_avatar,
      'Nueva cagada de ' || v_actor_name,
      v_actor_name || ' anotó +1 en ' || v_room.name || '.',
      '/?group=' || v_room.code,
      'poop-room-' || p_room_id::text,
      jsonb_build_object(
        'groupId', p_room_id,
        'groupCode', v_room.code,
        'groupName', v_room.name,
        'actorId', v_uid
      )
    from public.room_members m
    where m.room_id = p_room_id and m.user_id <> v_uid;

    insert into public.notification_jobs (
      room_id, actor_id, title, body, url, tag, data
    )
    values (
      p_room_id,
      v_uid,
      'Nueva cagada de ' || v_actor_name,
      v_actor_name || ' anotó +1 en ' || v_room.name || '.',
      '/?group=' || v_room.code,
      'poop-room-' || p_room_id::text,
      jsonb_build_object(
        'groupId', p_room_id,
        'groupCode', v_room.code,
        'groupName', v_room.name,
        'actorId', v_uid
      )
    );

    v_group := public.sanitize_group(p_room_id);
  else
    insert into public.poops (user_id, room_id, note, country, country_code, free)
    values (
      v_uid,
      null,
      public.clean_text(coalesce(p_note, ''), 120),
      v_profile.country,
      v_profile.country_code,
      true
    )
    returning id into v_poop_id;
  end if;

  update public.app_stats
  set total_poops = total_poops + 1,
      poops_today = case when poops_today_date = v_today then poops_today + 1 else 1 end,
      poops_today_date = v_today,
      last_poop_at = now(),
      updated_at = now()
  where id = 1;

  return jsonb_build_object(
    'success', true,
    'poopId', v_poop_id,
    'user', public.profile_json(v_uid, true),
    'group', v_group,
    'previousRank', v_old_rank,
    'newRank', v_new_rank,
    'groupInfo', case
      when p_room_id is null then null
      else jsonb_build_object(
        'groupId', p_room_id,
        'groupName', v_room.name,
        'groupRank', v_new_rank,
        'previousGroupRank', v_old_rank,
        'groupPoops', v_member.group_poops,
        'isGroupKing', v_new_rank = 1,
        'totalMembers', (select count(*) from public.room_members where room_id = p_room_id)
      )
    end
  );
end;
$$;

create or replace function public.get_my_poops(
  p_limit integer default 200,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'userId', p.user_id,
        'username', pr.username,
        'userAvatar', pr.avatar,
        'groupId', p.room_id,
        'note', p.note,
        'free', p.free,
        'createdAt', p.created_at,
        'country', p.country,
        'countryCode', p.country_code
      )
      order by p.created_at desc
    ),
    '[]'::jsonb
  )
  from (
    select *
    from public.poops
    where user_id = auth.uid()
    order by created_at desc
    limit least(greatest(coalesce(p_limit, 200), 1), 500)
    offset greatest(coalesce(p_offset, 0), 0)
  ) p
  join public.profiles pr on pr.id = p.user_id;
$$;

create or replace function public.register_push_subscription(
  p_subscription_id text,
  p_platform text default 'web'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_id text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  v_id := trim(coalesce(p_subscription_id, ''));
  if v_id !~ '^[A-Za-z0-9_-]{10,200}$' then
    raise exception 'INVALID_SUBSCRIPTION' using errcode = 'P0001';
  end if;

  delete from public.push_subscriptions
  where onesignal_subscription_id = v_id and user_id <> v_uid;

  insert into public.push_subscriptions (user_id, onesignal_subscription_id, platform)
  values (v_uid, v_id, left(public.clean_text(coalesce(p_platform, 'web'), 30), 30))
  on conflict (onesignal_subscription_id)
  do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    updated_at = now();

  return jsonb_build_object('subscribed', true);
end;
$$;

create or replace function public.unregister_push_subscription(p_subscription_id text)
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
    and onesignal_subscription_id = trim(coalesce(p_subscription_id, ''));

  return jsonb_build_object('subscribed', false);
end;
$$;

create or replace function public.track_sponsor_click(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_counted boolean := false;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  if p_user_id = v_uid then
    return jsonb_build_object('counted', false);
  end if;

  perform public.check_rate_limit('sponsor_click', 60, 3600);

  update public.profiles
  set sponsor_clicks = sponsor_clicks + 1
  where id = p_user_id and sponsor_url <> '';
  v_counted := found;

  return jsonb_build_object('counted', v_counted);
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_read boolean := false;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  update public.notifications
  set read = true
  where id = p_notification_id and user_id = v_uid;
  v_read := found;

  return jsonb_build_object('read', v_read);
end;
$$;

create or replace function public.expire_room_premium()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.rooms
  set premium_status = 'expired',
      premium_plan = 'free',
      premium_updated_at = now(),
      updated_at = now()
  where premium_status in ('active', 'trialing', 'canceled')
    and premium_current_period_end is not null
    and premium_current_period_end <= now();

  update public.app_stats
  set premium_rooms = (
        select count(*)
        from public.rooms
        where premium_status in ('active', 'trialing', 'canceled')
          and (premium_current_period_end is null or premium_current_period_end > now())
      ),
      updated_at = now()
  where id = 1;
$$;

create or replace function public.refresh_premium_stats()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.app_stats
  set premium_rooms = (
        select count(*)
        from public.rooms
        where premium_status in ('active', 'trialing', 'canceled')
          and (premium_current_period_end is null or premium_current_period_end > now())
      ),
      updated_at = now()
  where id = 1;
$$;

-- Lock down execution. Only authenticated users can call these RPCs, except
-- get_room_by_code, which unauthenticated visitors need for invite previews.
revoke all on function public.ensure_profile(text, text, text, text) from public, anon, authenticated;
revoke all on function public.update_profile(text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.get_my_rooms() from public, anon, authenticated;
revoke all on function public.get_room_by_code(text) from public, anon, authenticated;
revoke all on function public.create_room(text, text, text, text) from public, anon, authenticated;
revoke all on function public.join_room(text) from public, anon, authenticated;
revoke all on function public.leave_room(uuid) from public, anon, authenticated;
revoke all on function public.delete_room(uuid) from public, anon, authenticated;
revoke all on function public.set_decree(uuid, text) from public, anon, authenticated;
revoke all on function public.log_poop(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.get_my_poops(integer, integer) from public, anon, authenticated;
revoke all on function public.register_push_subscription(text, text) from public, anon, authenticated;
revoke all on function public.unregister_push_subscription(text) from public, anon, authenticated;
revoke all on function public.track_sponsor_click(uuid) from public, anon, authenticated;
revoke all on function public.mark_notification_read(uuid) from public, anon, authenticated;
revoke all on function public.expire_room_premium() from public, anon, authenticated;
revoke all on function public.refresh_premium_stats() from public, anon, authenticated;

grant execute on function public.ensure_profile(text, text, text, text) to authenticated;
grant execute on function public.update_profile(text, text, text, text, text, text) to authenticated;
grant execute on function public.get_my_rooms() to authenticated;
grant execute on function public.get_room_by_code(text) to anon, authenticated;
grant execute on function public.create_room(text, text, text, text) to authenticated;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;
grant execute on function public.delete_room(uuid) to authenticated;
grant execute on function public.set_decree(uuid, text) to authenticated;
grant execute on function public.log_poop(uuid, text, integer) to authenticated;
grant execute on function public.get_my_poops(integer, integer) to authenticated;
grant execute on function public.register_push_subscription(text, text) to authenticated;
grant execute on function public.unregister_push_subscription(text) to authenticated;
grant execute on function public.track_sponsor_click(uuid) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.refresh_premium_stats() to service_role;
grant execute on function public.expire_room_premium() to service_role;
