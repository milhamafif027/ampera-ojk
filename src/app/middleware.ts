import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Tentukan rute-rute apa saja yang ingin diproteksi (misal: semua yang berawalan /dashboard)
  const isDashboardRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/dashboardUtama");

  if (isDashboardRoute) {
    // Cek keberadaan cookie sesi yang Anda gunakan untuk autentikasi
    // Sesuaikan nama cookie-nya dengan yang Anda set saat proses login di backend
    const sessionCookie = request.cookies.get("session_token")?.value;

    // Jika cookie sesi tidak ada, langsung tendang (redirect) ke halaman login
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Konfigurasi path rute yang akan dipantau oleh middleware
export const config = {
  matcher: ["/dashboard/:path*", "/dashboardUtama/:path*"],
};
