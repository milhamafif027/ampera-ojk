import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Validasi sesi aktif
    const sessionCookie = req.cookies.get("session_token")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    // Menggunakan $queryRaw dari Prisma untuk mengambil data dari tabel ruangan
    const rows = await db.$queryRaw`
      SELECT * FROM ruangan ORDER BY id ASC
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("DETAIL ERROR API PUBLIC ROOMS:", error.message);
    return NextResponse.json(
      { success: false, message: error.message, data: [] },
      { status: 500 },
    );
  }
}
