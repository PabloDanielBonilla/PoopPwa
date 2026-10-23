'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-anon-key';

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server components must use createSupabaseServerClient() instead. This
    // fallback exists only so module evaluation during build does not fail.
    if (!browserClient) {
      browserClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY
      );
    }
    return browserClient;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY
    );
  }

  return browserClient;
}

export function getAppUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://poop.lol').replace(/\/$/, '');
}
