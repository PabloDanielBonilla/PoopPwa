import { AppError, ensureProfile, normalizeError } from './api';
import { getAppUrl, getSupabase, isSupabaseConfigured } from './supabase/client';

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    throw new AppError(
      'SUPABASE_NOT_CONFIGURED',
      'Supabase no está configurado. Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
}

export async function signInWithEmail(email: string, password: string) {
  assertConfigured();
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw normalizeError(error);
  return data;
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  username: string;
  country: string;
  countryCode: string;
  avatar?: string;
}) {
  assertConfigured();
  const { data, error } = await getSupabase().auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/`,
      data: {
        username: input.username,
        country: input.country,
        country_code: input.countryCode,
        avatar: input.avatar ?? '',
      },
    },
  });
  if (error) throw normalizeError(error);
  return data;
}

export async function signInWithGoogle() {
  assertConfigured();
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw normalizeError(error);
}

/**
 * Prepared for when the Apple Developer Program credentials are configured in
 * Supabase Auth. The button stays disabled until then.
 */
export async function signInWithApple() {
  assertConfigured();
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=/`,
    },
  });
  if (error) throw normalizeError(error);
}

export async function signOut() {
  assertConfigured();
  const { error } = await getSupabase().auth.signOut();
  if (error) throw normalizeError(error);
}

export async function loadOrCreateProfile(input?: {
  username?: string;
  avatar?: string;
  country?: string;
  countryCode?: string;
}) {
  const profile = await ensureProfile(input);
  return profile.user;
}
