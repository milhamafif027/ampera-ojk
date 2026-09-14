import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Helper untuk menentukan nama tabel database berdasarkan role
function getUserNotificationTable(role?: string): string {
  const cleanRole = role?.toLowerCase() || "";
  if (cleanRole === "admin") return "notifikasi_admin";
  if (cleanRole === "internal") return "notifikasi_internal";
  return "notifikasi_eksternal"; // Default untuk eksternal/user biasa
}

// 1. GET: Mengambil daftar notifikasi berdasarkan role & user_id (Dengan Filter Ketat)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const role = searchParams.get("role") || "eksternal";
    const cleanRole = role.toLowerCase();

    let rows: any[] = [];

    if (cleanRole === "admin") {
      // ADMIN: Hanya membaca notifikasi yang ditujukan untuk admin
      // Filter out notifikasi konfirmasi pemohon jika tidak sengaja masuk
      rows = await db.$queryRaw`
        SELECT id, '' AS user_id, title, type, status, info, is_read, created_at 
        FROM notifikasi_admin 
        WHERE title NOT LIKE '%Pengajuan Peminjaman Dikirim%'
          AND title NOT LIKE '%Pengajuan Menunggu Verifikasi%'
        ORDER BY created_at DESC 
        LIMIT 50
      `;
    } else {
      const validUserId =
        userId && userId !== "undefined" && userId !== "null" && userId !== ""
          ? Number(userId)
          : null;

      if (!validUserId) {
        return NextResponse.json({ success: true, data: [] });
      }

      if (cleanRole === "internal") {
        // INTERNAL: Hanya notifikasi untuk user pemohon internal (Saring keluar notifikasi admin)
        rows = await db.$queryRaw`
          SELECT id, user_id, title, type, status, info, is_read, created_at 
          FROM notifikasi_internal 
          WHERE user_id = ${validUserId}
            AND title NOT LIKE 'Pengajuan Kendaraan Baru%'
            AND title NOT LIKE 'Pengajuan Ruangan Baru%'
          ORDER BY created_at DESC 
          LIMIT 50
        `;
      } else {
        // EKSTERNAL: Hanya notifikasi untuk user pemohon eksternal (Saring keluar notifikasi admin)
        rows = await db.$queryRaw`
          SELECT id, user_id, title, type, status, info, is_read, created_at 
          FROM notifikasi_eksternal 
          WHERE user_id = ${validUserId}
            AND title NOT LIKE 'Pengajuan Kendaraan Baru%'
            AND title NOT LIKE 'Pengajuan Ruangan Baru%'
          ORDER BY created_at DESC 
          LIMIT 50
        `;
      }
    }

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("API GET NOTIFIKASI ERROR:", error.message);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

// 2. POST: Membuat notifikasi baru ke tabel spesifik
export async function POST(req: NextRequest) {
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
    const tableName = getUserNotificationTable(targetRole);

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

// 3. PUT: Menandai notifikasi telah dibaca (Berdasarkan role & ID user)
export async function PUT(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { userId, role, notificationId, markAll } = body;
    const targetRole = (role || "eksternal").toLowerCase();
    const tableName = getUserNotificationTable(targetRole);

    // A. Tandai semua dibaca (Mark All)
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

    // B. Tandai satu notifikasi spesifik berdasarkan ID
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
        message: "Notifikasi berhasil ditandai dibaca.",
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
