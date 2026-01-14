import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMINROLES } from "./lib/types/role";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow internal Next.js and public asset routes to proceed immediately (but NOT /login!):
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    // allow files with common static extensions
    pathname.startsWith("/nxtlottotest") ||
    pathname.startsWith("/droplet") ||
    pathname.startsWith("/payment") ||
    pathname.match(/\.(jpg|jpeg|png|svg|gif|webp|ico|css|js|json|txt|pdf)$/i)
  ) {
    return NextResponse.next();
  }

  // Allow banking route without authentication
  if (pathname.startsWith("/banking")) {
    return NextResponse.next();
  }

  // Check user token for protected routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const casinoGroup = (token?.casinoGroups?.[0]?.name || "").toLowerCase();

  // If logged in and tries to access /login or /, redirect to accounts
  if (token && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(
      new URL(`/${casinoGroup}/cash-outs`, request.url)
    );
  }

  // Redirect /network exactly to /network/accounts
  if (pathname === "/network") {
    return NextResponse.redirect(
      new URL(`${casinoGroup}/network/accounts`, request.url)
    );
  }

  // Redirect /network exactly to /network/accounts
  if (
    pathname.startsWith("/accounts") &&
    token?.role !== ADMINROLES.ADMIN &&
    token?.role !== ADMINROLES.SUPERADMIN
  ) {
    // Not an admin, redirect to unauthorized or home or custom page
    return NextResponse.redirect(new URL("/", request.url));
    // or e.g. new URL("/unauthorized", request.url)
  }

  // If not logged in and not on login, redirect to login
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Let them through for login if not authenticated
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|api|favicon.ico).*)"],
};
