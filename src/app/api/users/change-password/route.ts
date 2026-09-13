import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    // 1. Validasi Sesi Server-Side: Pastikan ada cookie session_token yang sah
    const sessionCookie = request.cookies.get("session_token")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { userId, newPassword, adminRole } = body;

    // 2. Validasi Keamanan Role: Pastikan hanya role 'admin' yang memiliki wewenang
    if (adminRole !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Tidak memiliki wewenang admin.",
        },
        { status: 403 },
      );
    }

    // 3. Validasi Input: Pastikan password tidak kosong dan panjangnya cukup
    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "ID User wajib ada dan Password minimal 6 karakter.",
        },
        { status: 400 },
      );
    }

    const uId = Number(userId);

    // 4. Eksekusi Update menggunakan Prisma $executeRaw
    const affectedRows = await db.$executeRaw`
      UPDATE users SET password = ${newPassword} WHERE id = ${uId}
    `;

    // 5. Cek apakah user benar-benar ada di database (jika affectedRows bernilai 0)
    if (Number(affectedRows) === 0) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password pengguna berhasil diperbarui.",
    });
  } catch (error: any) {
    console.error("Admin Change Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
