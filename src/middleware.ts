import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session_user");
  const { pathname } = request.nextUrl;

  // 1. PUBLIC ROUTE: Dashboard landing
  if (pathname === "/") return NextResponse.next();

  // 2. AUTH ROUTES: Allow access to login/register
  if (pathname.startsWith("/login") || pathname.startsWith("/register-user")) {
    return NextResponse.next();
  }

  // 3. PRIVATE ROUTES: Redirect to login if no session cookie
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Protect all routes except static files
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};