import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static files, api routes, and _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Only create Supabase client if we have the env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // If env vars missing, just let the request through
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: request.headers } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.cookies.set(name, value, options as any);
      },
      remove(name: string, options: Record<string, unknown>) {
        request.cookies.set(name, '');
        response = NextResponse.next({ request: { headers: request.headers } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.cookies.set(name, '', options as any);
      },
    },
  });

  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch {
    // If session check fails, treat as unauthenticated
    session = null;
  }

  // Redirect authenticated users away from /login
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard/files', request.url));
  }

  // Redirect unauthenticated users away from /dashboard
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect root to appropriate page
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard/files', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  // Do NOT include /login in matcher to avoid redirect loops
  matcher: ['/', '/dashboard/:path*'],
};
