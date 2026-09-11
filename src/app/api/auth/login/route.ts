import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan kata sandi wajib diisi." },
        { status: 400 },
      );
    }

    const rows: any = await db.$queryRaw`
      SELECT id, name, email, role, nip, current_session_token, last_active_at FROM users 
      WHERE email = ${email.trim()} AND password = ${password.trim()}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Email atau kata sandi yang Anda masukkan salah." },
        { status: 401 },
      );
    }

    const user = rows[0];

    // Cek apakah akun sedang aktif di perangkat lain
    // Kita anggap sesi aktif jika last_active_at kurang dari 10 menit yang lalu (600000 ms)
    if (user.current_session_token && user.last_active_at) {
      const lastActiveTime = new Date(user.last_active_at).getTime();
      const now = new Date().getTime();
      const tenMinutes = 10 * 60 * 1000;

      if (now - lastActiveTime < tenMinutes) {
        return NextResponse.json(
          {
            message:
              "Akun sedang digunakan oleh pengguna lain. Silakan tunggu beberapa saat atau pastikan perangkat sebelumnya sudah keluar.",
          },
          { status: 403 }, // Forbidden / Ditolak karena sedang aktif
        );
      }
    }

    // Jika aman (tidak ada sesi aktif / sudah lebih dari 10 menit tidak aktif), buat sesi baru
    const sessionToken = crypto.randomUUID();
    const nowTimestamp = new Date();

    await db.$queryRaw`
      UPDATE users 
      SET current_session_token = ${sessionToken}, last_active_at = ${nowTimestamp} 
      WHERE id = ${user.id}
    `;

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        nip: user.nip,
      },
    });

    response.cookies.set({
      name: "session_token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { message: "Gagal terhubung ke database.", error: error.message },
      { status: 500 },
    );
  }
}
