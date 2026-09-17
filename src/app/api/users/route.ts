import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 1. GET: Mengambil daftar seluruh pengguna
export async function GET(request: NextRequest) {
  try {
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

    // Mengambil kolom murni sesuai tabel database Anda
    const users: any = await db.$queryRaw`
      SELECT id, name, email, role, password, created_at 
      FROM users 
      ORDER BY id ASC
    `;

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

// 2. POST: Menambahkan akun pengguna baru (Tanpa NIP)
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session_token")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Sesi tidak valid." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama, email, password, dan role wajib diisi.",
        },
        { status: 400 },
      );
    }

    const existing: any = await db.$queryRaw`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar di sistem." },
        { status: 400 },
      );
    }

    // Insert tanpa kolom nip
    await db.$executeRaw`
      INSERT INTO users (name, email, password, role, created_at)
      VALUES (${name}, ${email}, ${password}, ${role}, NOW())
    `;

    return NextResponse.json({
      success: true,
      message: "Akun baru berhasil ditambahkan ke sistem.",
    });
  } catch (error: any) {
    console.error("API POST USERS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menambahkan akun." },
      { status: 500 },
    );
  }
}
