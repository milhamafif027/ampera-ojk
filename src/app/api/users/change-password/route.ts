import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, newPassword, adminRole } = body;

    // 1. Validasi Keamanan: Pastikan hanya role 'admin' yang bisa masuk
    if (adminRole !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Tidak memiliki wewenang admin.",
        },
        { status: 403 },
      );
    }

    // 2. Validasi Input: Pastikan password tidak kosong dan panjangnya cukup
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

    // 3. Eksekusi Update menggunakan Prisma $executeRaw
    const affectedRows = await db.$executeRaw`
      UPDATE users SET password = ${newPassword} WHERE id = ${uId}
    `;

    // 4. Cek apakah user benar-ar ada di database (jika affectedRows bernilai 0)
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
