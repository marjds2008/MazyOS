import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type AdminRole = "admin" | "operador" | "parceiro";

const ROUTE_ROLES: Record<string, AdminRole[]> = {
  "/configuracoes": ["admin"],
  "/parceiros":     ["admin", "parceiro"],
  "/campanhas":     ["admin", "parceiro"],
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (pathname === "/login") return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role check for protected routes
  const requiredRoles = Object.entries(ROUTE_ROLES).find(([route]) =>
    pathname === route || pathname.startsWith(route + "/")
  )?.[1];

  if (requiredRoles) {
    const { data: profile } = await supabase.rpc("get_my_admin_profile");
    const role: AdminRole = profile?.role ?? "operador";
    if (!requiredRoles.includes(role)) {
      if (isApiRoute) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/auth).*)"],
};
