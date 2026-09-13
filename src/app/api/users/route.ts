import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // 1. Ambil cookie sesi dari request
    const sessionCookie = request.cookies.get("session_token")?.value;

    // 2. Jika tidak ada cookie sesi, tolak akses dengan 401 Unauthorized
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    // 3. (Opsional tapi disarankan) Validasi token/sesi dari database atau pastikan user adalah admin
    // Contoh sederhana: Cek apakah sessionToken tersimpan di database atau valid
    // const sessionValid = ... (lakukan verifikasi token sessionCookie di sini jika ada tabel sessions)

    // Ambil kolom utama termasuk password agar terbaca oleh frontend
    const users: any = await db.$queryRaw`
      SELECT id, name, email, role, password 
      FROM users 
      ORDER BY id ASC
    `;

    // Mapping untuk memastikan properti password tersedia
    const sanitizedUsers = users.map((u: any) => ({
      ...u,
      password: u.password || "••••••••••••",
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal mengambil data pengguna",
      },
      { status: 500 },
    );
  }
}
