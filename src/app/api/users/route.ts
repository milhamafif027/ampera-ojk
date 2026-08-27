import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Menggunakan $queryRaw dari Prisma untuk mengambil data user termasuk password
    const rows = await db.$queryRaw`
      SELECT id, name, email, role, nip, password FROM users ORDER BY id ASC
    `;

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    console.error("Get Users API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data pengguna dari database.",
      },
      { status: 500 },
    );
  }
}
