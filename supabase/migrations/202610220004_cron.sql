-- Expire Premium rooms daily. Expired rooms keep their existing members;
-- join_room() blocks new joins while the room has 5 or more members.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron';

    if not exists (select 1 from cron.job where jobname = 'expire-room-premium') then
      execute $sql$
        select cron.schedule(
          'expire-room-premium',
          '0 3 * * *',
          'select public.expire_room_premium()'
        )
      $sql$;
    end if;
  else
    raise notice 'pg_cron is not available. Enable it in Supabase Dashboard → Database → Extensions.';
  end if;
end $$;
