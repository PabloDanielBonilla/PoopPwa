import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Supabase splits large session cookies into sb-<ref>-auth-token.0, .1, ...
// When a session shrinks, old chunks can survive and every page request grows
// until Vercel rejects it with 494 REQUEST_HEADER_TOO_LARGE.
const AUTH_TOKEN_COOKIE = /^sb-.*-auth-token(?:\.\d+)?$/;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  let touchedAuthToken = false;
  const writtenAuthCookies = new Set<string>();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookieEncoding: 'raw',
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
            if (AUTH_TOKEN_COOKIE.test(name)) {
              touchedAuthToken = true;
              writtenAuthCookies.add(name);
            }
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  if (touchedAuthToken) {
    for (const cookie of request.cookies.getAll()) {
      if (AUTH_TOKEN_COOKIE.test(cookie.name) && !writtenAuthCookies.has(cookie.name)) {
        response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
      }
    }
  }

  return response;
}
