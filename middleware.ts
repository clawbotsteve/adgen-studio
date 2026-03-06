import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireSupabasePublic } from "@/lib/env";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/auth/callback", "/error"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  const cfg = requireSupabasePublic();

  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>,
      ) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const isApi = pathname.startsWith("/api/");

  // Let API routes handle their own auth (they return 401, not redirects)
  if (isApi) return response;

  // Unauthenticated user hitting a protected page → /login
  if (!user && !isPublic) {
    console.log("[middleware] No session, redirecting to /login from", pathname);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting /login → /dashboard (prevent loop)
  if (user && pathname === "/login") {
    console.log(
      "[middleware] Authenticated user on /login, redirecting to /dashboard",
    );
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
