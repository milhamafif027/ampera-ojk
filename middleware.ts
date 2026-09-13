import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek apakah rute yang diakses adalah area dashboard/admin
  const isDashboardRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/dashboardutama");

  if (isDashboardRoute) {
    // Ambil cookie session_token dari browser
    const sessionToken = request.cookies.get("session_token")?.value;

    // Jika token tidak ada di cookie, langsung tendang ke /login dari server (0 detik)
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Pastikan matcher mencakup semua variasi penulisan URL dashboard Anda
export const config = {
  matcher: ["/dashboard/:path*", "/dashboardutama/:path*"],
};
