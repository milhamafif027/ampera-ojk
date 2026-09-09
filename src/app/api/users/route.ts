import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Sertakan kolom password agar terbaca oleh frontend
    const users: any = await db.$queryRaw`
      SELECT id, name, email, role, nip, password 
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
