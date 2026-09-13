import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ubah ke lowercase agar aman dari perbedaan huruf besar/kecil pada URL
  const lowerPath = pathname.toLowerCase();

  // Cek apakah rute berawalan dashboard atau dashboardutama
  const isDashboardRoute =
    lowerPath.startsWith("/dashboard") ||
    lowerPath.startsWith("/dashboardutama");

  if (isDashboardRoute) {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Perbarui matcher agar menangkap halaman utama DAN sub-path-nya sekaligus
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/dashboardutama/:path*",
    "/dashboardutama",
  ],
};
