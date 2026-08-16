import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader } from "mysql2";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // Kita tetap terima userId dan newPassword
    const { userId, newPassword, adminRole } = body;

    // 1. Validasi Keamanan: Pastikan hanya role 'admin' yang bisa masuk
    // Catatan: Di masa depan, sangat disarankan validasi ini menggunakan token (JWT)
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

    // 3. Eksekusi Update: Menggunakan ResultSetHeader untuk hasil yang lebih spesifik
    const query = `UPDATE users SET password = ? WHERE id = ?`;
    const [result] = await db.query<ResultSetHeader>(query, [
      newPassword,
      userId,
    ]);

    // 4. Cek apakah user benar-benar ada di database
    if (result.affectedRows === 0) {
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
