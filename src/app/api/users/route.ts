import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Mencegah Next.js melakukan caching pada endpoint ini agar data selalu sinkron dengan database
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Ambil semua data pengguna dari tabel users menggunakan query mentah
    const users = await db.$queryRaw`
      SELECT id, name, email, role, nip, password, kata_sandi, sandi 
      FROM users 
      ORDER BY id ASC
    `;

    return NextResponse.json({
      success: true,
      data: users,
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
