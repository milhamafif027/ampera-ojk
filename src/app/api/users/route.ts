import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    // Menambahkan 'password' ke dalam kolom yang dipilih dari database
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, name, email, role, nip, password FROM users ORDER BY id ASC",
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    console.error("Get Users API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data pengguna dari database.",
      },
      { status: 500 },
    );
  }
}
