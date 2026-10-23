-- Supabase copies auth.users.raw_user_meta_data into the user's JWT/session.
-- @supabase/ssr then stores that session in cookies, so large inline avatar
-- data URIs can push the Cookie request header past Vercel's 16 KB limit and
-- cause 494 REQUEST_HEADER_TOO_LARGE.
--
-- Avatars belong in public.profiles (or Supabase Storage). Remove only the
-- oversized/inline avatar value from auth metadata; the profile row is kept.
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'avatar'
where raw_user_meta_data ? 'avatar'
  and (
    raw_user_meta_data->>'avatar' like 'data:%'
    or length(raw_user_meta_data->>'avatar') > 2048
  );
