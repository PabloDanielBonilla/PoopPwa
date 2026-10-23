-- poop.lol — Rate limit for the authenticated push demo.
-- The Edge Function calls this with the authenticated user id using the
-- service role. The browser can never choose another user's id.

create or replace function public.consume_push_demo_limit(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window timestamptz := date_trunc('hour', now());
  v_count integer;
begin
  if p_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  insert into public.rate_limits (user_id, action, window_start, count)
  values (p_user_id, 'push_demo', v_window, 1)
  on conflict (user_id, action, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  return v_count;
end;
$$;

revoke all on function public.consume_push_demo_limit(uuid) from public, anon, authenticated;
grant execute on function public.consume_push_demo_limit(uuid) to service_role;
