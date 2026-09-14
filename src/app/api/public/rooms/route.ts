import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Validasi session_token DIHAPUS agar bisa diakses publik di Landing Page
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
