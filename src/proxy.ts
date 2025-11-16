import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow internal Next.js and public asset routes to proceed immediately:
  // - _next and static internals
  // - the image optimizer route /_next/image
  // - API routes and auth routes
  // - favicon/robots and typical public asset file extensions (jpg/png/svg/css/js/json/etc)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_next/image") || // important: allow optimizer requests
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/api/auth") || // next-auth routes
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/login" ||
    // allow files with common static extensions (so /logos/*.jpg etc. are allowed)
    pathname.match(/\.(jpg|jpeg|png|svg|gif|webp|ico|css|js|json|txt|pdf)$/i)
  ) {
    return NextResponse.next();
  }

  // For everything else, check user token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If logged in and tries to access /login or /, redirect to the correct accounts
  if (token && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  // Optional: enable temporary logging while debugging (remove/disable in prod)
  // console.log("middleware:", pathname, "hasToken:", Boolean(token));

  // If user hits /login and is already authenticated, redirect them to home
  if (token && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/accounts";
    return NextResponse.redirect(url);
  }

  // If no token, redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated -> continue
  return NextResponse.next();
}

export const config = {
  // Keep excluding _next, static and api from matcher to avoid running the middleware for internals,
  // but the code also guards against specific static/file requests — double protection.
  matcher: ["/((?!_next|static|api|favicon.ico).*)"],
};
