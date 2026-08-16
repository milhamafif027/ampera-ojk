import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const role = searchParams.get("role");

    // Sertakan kembali 'status' dan 'type' agar sinkron dengan frontend
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
    console.error("API GET NOTIFIKASI SAFE ERROR:", error.message);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

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
    console.error("API PUT NOTIFIKASI SAFE ERROR:", error.message);
    return NextResponse.json({ success: true, message: "OK" }, { status: 200 });
  }
}
