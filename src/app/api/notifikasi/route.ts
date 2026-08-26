import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket } from "mysql2";

// Helper untuk menentukan nama tabel berdasarkan role/user
function getTableName(role?: string): string {
  const cleanRole = role?.toLowerCase() || "";
  if (cleanRole === "admin") return "notifikasi_admin";
  if (cleanRole === "internal") return "notifikasi_internal";
  return "notifikasi_eksternal"; // Default untuk eksternal/user biasa
}

// 1. GET: Mengambil daftar notifikasi berdasarkan tabel spesifik role
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const role = searchParams.get("role") || "eksternal";

    const tableName = getTableName(role);
    let query = `SELECT id, ${role?.toLowerCase() === "admin" ? "'' AS user_id" : "user_id"}, title, type, status, info, is_read, created_at FROM ${tableName}`;
    let params: any[] = [];

    // Jika bukan admin, filter berdasarkan user_id miliknya sendiri
    if (role.toLowerCase() !== "admin") {
      if (
        userId &&
        userId !== "undefined" &&
        userId !== "null" &&
        userId !== ""
      ) {
        query += " WHERE user_id = ?";
        params = [userId];
      } else {
        query += " WHERE 1=0"; // Jika tidak ada user_id, jangan kembalikan data sembarangan
      }
    }

    query += " ORDER BY created_at DESC LIMIT 50";

    const [rows] = await db.query<RowDataPacket[]>(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("API GET NOTIFIKASI ERROR:", error.message);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

// 2. POST: Membuat notifikasi baru ke tabel yang bersangkutan
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, role, title, type, status, info } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, message: "Title wajib diisi" },
        { status: 400 },
      );
    }

    const targetRole = role || "eksternal";
    const tableName = getTableName(targetRole);

    if (targetRole.toLowerCase() === "admin") {
      // Input ke tabel khusus admin (tanpa user_id)
      const query = `
        INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, NOW())
      `;
      await db.query(query, [
        title,
        type || "room",
        status || "Pending",
        info || "",
      ]);
    } else {
      // Input ke tabel internal/eksternal (dengan user_id)
      const validUserId = Number(user_id) || 0;
      const query = `
        INSERT INTO ${tableName} (user_id, title, type, status, info, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, NOW())
      `;
      await db.query(query, [
        validUserId,
        title,
        type || "room",
        status || "Pending",
        info || "",
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Notifikasi berhasil ditambahkan ke tabel terpisah",
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

// 3. PUT: Menandai notifikasi telah dibaca berdasarkan tabel role masing-masing
export async function PUT(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { userId, role, notificationId, markAll } = body;
    const targetRole = role || "eksternal";
    const tableName = getTableName(targetRole);

    // A. Tandai semua dibaca (Mark All) pada tabel role tersebut
    if (markAll) {
      let query = `UPDATE ${tableName} SET is_read = 1 WHERE is_read = 0`;
      let params: any[] = [];

      if (targetRole.toLowerCase() !== "admin") {
        if (
          userId &&
          userId !== "undefined" &&
          userId !== "null" &&
          userId !== ""
        ) {
          query += " AND user_id = ?";
          params = [userId];
        } else {
          query += " AND 1=0";
        }
      }

      await db.query(query, params);

      return NextResponse.json({
        success: true,
        message: `Semua notifikasi di ${tableName} berhasil ditandai dibaca.`,
      });
    }

    // B. Tandai satu notifikasi spesifik berdasarkan ID dan tabelnya
    if (notificationId) {
      await db.query(`UPDATE ${tableName} SET is_read = 1 WHERE id = ?`, [
        notificationId,
      ]);
      return NextResponse.json({
        success: true,
        message: "Notifikasi spesifik ditandai dibaca.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Parameter tidak valid" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("API PUT NOTIFIKASI ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
