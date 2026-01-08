import { NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "./supabase/middleware";

const protectedRoutes = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/groups",
  "/events",
  "/recommendations",
];

export async function middleware(req) {
  const res = NextResponse.next();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return res;
  }
  const supabase = createSupabaseMiddlewareClient(req, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;
  const isProtected = protectedRoutes.some((path) => pathname.startsWith(path));
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!session && isProtected) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
