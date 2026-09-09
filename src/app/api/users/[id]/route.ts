import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Gunakan await untuk mengambil id dari params karena berupa Promise di Next.js terbaru
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const body = await req.json();
    const { name, email, role, nip } = body;

    if (!userId || !name || !email || !role) {
      return NextResponse.json(
        { success: false, message: "ID, Nama, Email, dan Role wajib diisi." },
        { status: 400 },
      );
    }

    const uId = Number(userId);

    // Eksekusi Update menggunakan Prisma $executeRaw ke tabel users
    const affectedRows = await db.$executeRaw`
      UPDATE users 
      SET name = ${name}, email = ${email}, role = ${role}, nip = ${nip || null} 
      WHERE id = ${uId}
    `;

    if (Number(affectedRows) === 0) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Informasi akun berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Update User Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal memperbarui data akun",
      },
      { status: 500 },
    );
  }
}
