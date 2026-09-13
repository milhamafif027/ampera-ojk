import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lowerPath = pathname.toLowerCase();

  const protectedPrefixes = [
    "/dashboard",
    "/dashboardutama",
    "/kalender",
    "/agenda",
    "/ruangan",
    "/kendaraan",
    "/partner",
    "/bantuan",
    "/kelolaakun",
  ];

  const isProtected = protectedPrefixes.some((prefix) =>
    lowerPath.startsWith(prefix),
  );

  if (isProtected) {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/dashboardutama/:path*",
    "/dashboardutama",
    "/kalender/:path*",
    "/agenda/:path*",
    "/ruangan/:path*",
    "/kendaraan/:path*",
    "/partner/:path*",
    "/bantuan/:path*",
    "/kelolaakun/:path*",
  ],
};
