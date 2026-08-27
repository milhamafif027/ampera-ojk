import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
    const cleanRole = role.toLowerCase();

    // Validasi nama tabel agar aman dari SQL Injection string interpolation
    const tableName = getTableName(cleanRole);

    let rows: any = [];

    if (cleanRole === "admin") {
      if (tableName === "notifikasi_admin") {
        rows = await db.$queryRaw`
          SELECT id, '' AS user_id, title, type, status, info, is_read, created_at 
          FROM notifikasi_admin 
          ORDER BY created_at DESC LIMIT 50
        `;
      }
    } else {
      const validUserId =
        userId && userId !== "undefined" && userId !== "null" && userId !== ""
          ? Number(userId)
          : null;

      if (!validUserId) {
        return NextResponse.json({ success: true, data: [] });
      }

      if (tableName === "notifikasi_internal") {
        rows = await db.$queryRaw`
          SELECT id, user_id, title, type, status, info, is_read, created_at 
          FROM notifikasi_internal 
          WHERE user_id = ${validUserId} 
          ORDER BY created_at DESC LIMIT 50
        `;
      } else {
        rows = await db.$queryRaw`
          SELECT id, user_id, title, type, status, info, is_read, created_at 
          FROM notifikasi_eksternal 
          WHERE user_id = ${validUserId} 
          ORDER BY created_at DESC LIMIT 50
        `;
      }
    }

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

    const targetRole = (role || "eksternal").toLowerCase();
    const tableName = getTableName(targetRole);

    if (tableName === "notifikasi_admin") {
      await db.$executeRaw`
        INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at)
        VALUES (${title}, ${type || "room"}, ${status || "Pending"}, ${info || ""}, 0, NOW())
      `;
    } else if (tableName === "notifikasi_internal") {
      const validUserId = Number(user_id) || 0;
      await db.$executeRaw`
        INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at)
        VALUES (${validUserId}, ${title}, ${type || "room"}, ${status || "Pending"}, ${info || ""}, 0, NOW())
      `;
    } else {
      const validUserId = Number(user_id) || 0;
      await db.$executeRaw`
        INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at)
        VALUES (${validUserId}, ${title}, ${type || "room"}, ${status || "Pending"}, ${info || ""}, 0, NOW())
      `;
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
    const targetRole = (role || "eksternal").toLowerCase();
    const tableName = getTableName(targetRole);

    // A. Tandai semua dibaca (Mark All) pada tabel role tersebut
    if (markAll) {
      if (tableName === "notifikasi_admin") {
        await db.$executeRaw`
          UPDATE notifikasi_admin SET is_read = 1 WHERE is_read = 0
        `;
      } else {
        const validUserId =
          userId && userId !== "undefined" && userId !== "null" && userId !== ""
            ? Number(userId)
            : null;

        if (!validUserId) {
          return NextResponse.json(
            {
              success: false,
              message: "User ID tidak valid untuk mark all.",
            },
            { status: 400 },
          );
        }

        if (tableName === "notifikasi_internal") {
          await db.$executeRaw`
            UPDATE notifikasi_internal SET is_read = 1 WHERE is_read = 0 AND user_id = ${validUserId}
          `;
        } else {
          await db.$executeRaw`
            UPDATE notifikasi_eksternal SET is_read = 1 WHERE is_read = 0 AND user_id = ${validUserId}
          `;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Semua notifikasi di ${tableName} berhasil ditandai dibaca.`,
      });
    }

    // B. Tandai satu notifikasi spesifik berdasarkan ID dan tabelnya
    if (notificationId) {
      const idNum = Number(notificationId);
      if (tableName === "notifikasi_admin") {
        await db.$executeRaw`
          UPDATE notifikasi_admin SET is_read = 1 WHERE id = ${idNum}
        `;
      } else if (tableName === "notifikasi_internal") {
        await db.$executeRaw`
          UPDATE notifikasi_internal SET is_read = 1 WHERE id = ${idNum}
        `;
      } else {
        await db.$executeRaw`
          UPDATE notifikasi_eksternal SET is_read = 1 WHERE id = ${idNum}
        `;
      }

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
