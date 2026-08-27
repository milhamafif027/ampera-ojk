import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan kata sandi wajib diisi." },
        { status: 400 },
      );
    }

    // Menggunakan $queryRaw dari Prisma untuk PostgreSQL
    const rows: any = await db.$queryRaw`
      SELECT id, name, email, role, nip FROM users 
      WHERE email = ${email.trim()} AND password = ${password.trim()}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Email atau kata sandi yang Anda masukkan salah." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      user: rows[0],
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { message: "Gagal terhubung ke database.", error: error.message },
      { status: 500 },
    );
  }
}
