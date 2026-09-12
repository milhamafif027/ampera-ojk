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

    const cleanInput = email.trim();
    const cleanPassword = password.trim();

    const rows: any = await db.$queryRaw`
      SELECT id, name, email, role, nip, current_session_token, last_active_at FROM users 
      WHERE (email = ${cleanInput} OR nip = ${cleanInput}) AND password = ${cleanPassword}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Email/NIP atau kata sandi yang Anda masukkan salah." },
        { status: 401 },
      );
    }

    const user = rows[0];

    // Cek apakah akun sedang aktif di perangkat lain
    if (user.current_session_token && user.last_active_at) {
      const lastActiveTime = new Date(user.last_active_at).getTime();
      const now = new Date().getTime();

      // PERBAIKAN: Turunkan durasi kunci sesi gantung menjadi 2 menit saja (2 * 60 * 1000)
      // agar jika user salah/keluar mendadak, dalam 2 menit bisa langsung login lagi.
      const lockDuration = 2 * 60 * 1000;

      // Tambahkan pengaman tambahan: Jika selisih waktu bernilai negatif (karena beda zona waktu UTC/WIB),
      // abaikan kunci dan langsung izinkan login.
      const timeDifference = now - lastActiveTime;

      if (timeDifference > 0 && timeDifference < lockDuration) {
        return NextResponse.json(
          {
            message:
              "Akun sedang digunakan oleh pengguna lain. Silakan tunggu beberapa saat atau pastikan perangkat sebelumnya sudah keluar.",
          },
          { status: 403 },
        );
      }
    }

    // Buat sesi baru dan timpa sesi lama secara paksa
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
