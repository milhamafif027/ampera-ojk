import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 1. GET: Mengambil daftar notifikasi berdasarkan user atau admin
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const role = searchParams.get("role");

    let query =
      "SELECT id, user_id, title, type, status, info, is_read, created_at FROM notifikasi";
    let params: any[] = [];

    if (
      role &&
      role !== "admin" &&
      userId &&
      userId !== "undefined" &&
      userId !== "null"
    ) {
      query += " WHERE user_id = ?";
      params = [userId];
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await db.query(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("API GET NOTIFIKASI ERROR:", error.message);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

// 2. POST: Membuat notifikasi baru (Misal: saat booking kendaraan / ruangan / approval)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, title, type, status, info } = body;

    if (!user_id || !title) {
      return NextResponse.json(
        { success: false, message: "user_id dan title wajib diisi" },
        { status: 400 },
      );
    }

    const query = `
      INSERT INTO notifikasi (user_id, title, type, status, info, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, NOW())
    `;

    await db.query(query, [
      user_id,
      title,
      type || "info",
      status || "Pending",
      info || "",
    ]);

    return NextResponse.json({
      success: true,
      message: "Notifikasi berhasil ditambahkan",
    });
  } catch (error: any) {
    console.error("API POST NOTIFIKASI ERROR:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal menyimpan notifikasi",
      },
      { status: 500 },
    );
  }
}

// 3. PUT: Menandai notifikasi telah dibaca (is_read = 1)
export async function PUT(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const userId = body.user_id;
    const role = body.role;

    let query = "UPDATE notifikasi SET is_read = 1";
    let params: any[] = [];

    if (
      role &&
      role !== "admin" &&
      role !== "Admin" &&
      userId &&
      userId !== "undefined" &&
      userId !== "null"
    ) {
      query += " WHERE user_id = ?";
      params = [userId];
    }

    await db.query(query, params);

    return NextResponse.json({
      success: true,
      message: "Semua notifikasi berhasil ditandai dibaca.",
    });
  } catch (error: any) {
    console.error("API PUT NOTIFIKASI ERROR:", error.message);
    return NextResponse.json({ success: true, message: "OK" }, { status: 200 });
  }
}
