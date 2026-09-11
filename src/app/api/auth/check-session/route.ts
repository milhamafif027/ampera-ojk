import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { valid: false, message: "Sesi tidak ditemukan." },
        { status: 401 },
      );
    }

    const rows: any = await db.$queryRaw`
      SELECT id, last_active_at FROM users 
      WHERE current_session_token = ${sessionToken}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { valid: false, message: "Sesi tidak valid." },
        { status: 401 },
      );
    }

    const user = rows[0];
    const now = new Date();
    const lastActive = new Date(user.last_active_at);
    const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

    // Jika tidak ada aktivitas selama lebih dari 10 menit, anggap *expired* (inactivity timeout)
    if (diffMinutes > 10) {
      // Hapus token sesi di database karena kedaluwarsa
      await db.$queryRaw`
        UPDATE users SET current_session_token = NULL, last_active_at = NULL 
        WHERE id = ${user.id}
      `;
      return NextResponse.json(
        { valid: false, message: "Sesi habis karena tidak ada aktivitas." },
        { status: 401 },
      );
    }

    // Perbarui waktu aktif terakhir (ping aktivitas)
    await db.$queryRaw`
      UPDATE users SET last_active_at = ${now} WHERE id = ${user.id}
    `;

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("Check Session Error:", error);
    return NextResponse.json(
      { valid: false, message: "Gagal memeriksa sesi.", error: error.message },
      { status: 500 },
    );
  }
}
