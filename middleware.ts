import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lowerPath = pathname.toLowerCase();

  // Cek apakah URL yang diakses mengandung kata dashboard atau dashboardutama
  const isDashboardRoute =
    lowerPath.includes("dashboard") ||
    lowerPath.includes("kalender") ||
    lowerPath.includes("agenda") ||
    lowerPath.includes("ruangan");

  if (isDashboardRoute) {
    const sessionToken = request.cookies.get("session_token")?.value;

    // Jika token tidak ada, tendang langsung sebelum halaman dirender sama sekali
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
