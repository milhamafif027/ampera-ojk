import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Helper untuk menentukan tabel notifikasi user berdasarkan role
function getUserNotificationTable(role?: string): string {
  const cleanRole = role?.toLowerCase() || "";
  if (cleanRole === "internal") return "notifikasi_internal";
  return "notifikasi_eksternal"; // Default untuk eksternal
}

// 1. GET: Ambil data agenda
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const roomParam = searchParams.get("room");

    const d = new Date();
    const today = d.toISOString().split("T")[0];

    // Hapus data yang tanggalnya sudah lewat
    await db.query("DELETE FROM agendas WHERE date < ?", [today]);

    let query = `
      SELECT id, title, pic, dept, phone, room_id, room_name, 
             DATE_FORMAT(date, '%Y-%m-%d') AS date, 
             start_time, end_time, layout, notes, status, user_id,
             total_participants, meeting_leader
      FROM agendas WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (dateParam) {
      query += " AND date = ?";
      queryParams.push(dateParam);
    }
    if (roomParam) {
      query += " AND room_name = ?";
      queryParams.push(roomParam);
    }

    query += " ORDER BY date ASC, start_time ASC";
    const [rows] = await db.query<RowDataPacket[]>(query, queryParams);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("API GET AGENDAS ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 2. POST: Tambah reservasi & Otomatisasi Status & 3 Tabel Notifikasi
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      pic,
      dept,
      phone,
      total_participants,
      meeting_leader,
      room_id,
      room_name,
      date,
      start_time,
      end_time,
      layout,
      notes,
      user_id,
      role, // Menerima role dari frontend ("admin", "internal", atau "eksternal")
    } = body;

    const cleanRole = role?.toLowerCase() || "eksternal";

    // ATURAN STATUS:
    // - Jika Admin atau Internal, otomatis "Disetujui" (selama tidak bentrok)
    // - Jika Eksternal, wajib "Pending" (menunggu verifikasi admin)
    const finalStatus =
      cleanRole === "admin" || cleanRole === "internal"
        ? "Disetujui"
        : "Pending";

    // Proteksi Bentrok Jadwal
    const [conflicts] = await db.query<RowDataPacket[]>(
      `
      SELECT id FROM agendas 
      WHERE room_name = ? AND date = ? AND status != 'Ditolak'
      AND ((start_time < ? AND end_time > ?) OR (start_time >= ? AND start_time < ?) OR (end_time > ? AND end_time <= ?))
    `,
      [
        room_name,
        date,
        end_time,
        start_time,
        start_time,
        end_time,
        start_time,
        end_time,
      ],
    );

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Jadwal bentrok! Ruangan sudah dipesan pada rentang waktu tersebut.",
        },
        { status: 400 },
      );
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO agendas 
      (title, pic, dept, phone, total_participants, meeting_leader, room_id, room_name, date, start_time, end_time, layout, notes, status, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        pic,
        dept,
        phone || null,
        total_participants || 1,
        meeting_leader || "-",
        room_id || null,
        room_name,
        date,
        start_time,
        end_time,
        layout,
        notes || "",
        finalStatus,
        user_id || null,
      ],
    );

    // --- INTEGRASI 3 TABEL NOTIFIKASI ---

    // 1. Kirim notifikasi ke tabel khusus Admin (notifikasi_admin)
    const adminNotifTitle =
      cleanRole === "eksternal"
        ? "Pengajuan Ruangan Baru"
        : "Reservasi Otomatis (Internal/Admin)";
    const adminNotifInfo = `Ruangan ${room_name} dipesan oleh ${pic} (${dept}) untuk tanggal ${date} (${start_time} - ${end_time}). Status: ${finalStatus}`;

    await db.query(
      `INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
       VALUES (?, 'room', ?, ?, 0, NOW())`,
      [adminNotifTitle, finalStatus, adminNotifInfo],
    );

    // 2. Kirim notifikasi personal ke tabel User (notifikasi_internal atau notifikasi_eksternal)
    if (user_id) {
      const targetTable = getUserNotificationTable(cleanRole);
      const userNotifTitle =
        finalStatus === "Disetujui"
          ? "Reservasi Disetujui Otomatis"
          : "Pengajuan Menunggu Verifikasi";
      const userNotifInfo =
        finalStatus === "Disetujui"
          ? `Reservasi ruangan ${room_name} tanggal ${date} berhasil dan langsung disetujui.`
          : `Pengajuan ruangan ${room_name} Anda telah dikirim dan sedang ditinjau oleh Admin.`;

      await db.query(
        `INSERT INTO ${targetTable} (user_id, title, type, status, info, is_read, created_at) 
         VALUES (?, ?, 'room', ?, ?, 0, NOW())`,
        [user_id, userNotifTitle, finalStatus, userNotifInfo],
      );
    }

    return NextResponse.json({
      success: true,
      insertId: result.insertId,
      status: finalStatus,
    });
  } catch (error: any) {
    console.error("API POST AGENDAS ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 3. PUT: Update status (Approve/Reject) & Notifikasi Ganda ke 3 Tabel Terpisah
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      date,
      start_time,
      end_time,
      pic,
      phone,
      status,
      notes,
      total_participants,
      meeting_leader,
    } = body;
    let { user_id } = body;

    // Jika user_id tidak dikirim dari frontend, ambil dari database berdasarkan id agenda
    if (!user_id && id) {
      const [agendaRows] = await db.query<RowDataPacket[]>(
        "SELECT user_id, title, date, room_name FROM agendas WHERE id = ?",
        [id],
      );
      if (agendaRows.length > 0) {
        user_id = agendaRows[0].user_id;
      }
    }

    // Ambil data detail role user pemohon jika ada user_id
    let userRole = "eksternal";
    if (user_id) {
      const [userRows] = await db.query<RowDataPacket[]>(
        "SELECT role FROM users WHERE id = ?",
        [user_id],
      );
      if (userRows.length > 0) {
        userRole = userRows[0].role;
      }
    }
    const targetTable = getUserNotificationTable(userRole);

    // Jika status Ditolak, hapus dari database dan kirim notifikasi penolakan
    if (status === "Ditolak") {
      await db.query("DELETE FROM agendas WHERE id = ?", [id]);

      const notifInfoUser = `Reservasi ${title || "Agenda"} pada tanggal ${date || ""} ditolak oleh admin. ${notes ? `Alasan: ${notes}` : ""}`;
      const notifInfoAdmin = `Reservasi "${title || "Agenda"}" oleh ${pic || "Pemohon"} pada tanggal ${date || ""} telah DITOLAK.`;

      // 1. Notifikasi untuk User Pemohon (tabel internal/eksternal)
      if (user_id) {
        await db.query(
          `INSERT INTO ${targetTable} (user_id, title, type, status, info, is_read, created_at) 
           VALUES (?, 'Reservasi Ditolak', 'room', 'Ditolak', ?, 0, NOW())`,
          [user_id, notifInfoUser],
        );
      }

      // 2. Notifikasi untuk Admin (tabel notifikasi_admin)
      await db.query(
        `INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
         VALUES ('Reservasi Ditolak', 'room', 'Ditolak', ?, 0, NOW())`,
        [notifInfoAdmin],
      );

      return NextResponse.json({ success: true, message: "Ditolak & dihapus" });
    }

    // Update status selain ditolak (Disetujui / Pending)
    await db.query(
      `UPDATE agendas 
       SET title = ?, date = ?, start_time = ?, end_time = ?, pic = ?, phone = ?, status = ?, notes = ?, total_participants = ?, meeting_leader = ? 
       WHERE id = ?`,
      [
        title,
        date,
        start_time,
        end_time,
        pic,
        phone || null,
        status,
        notes || "",
        total_participants || 1,
        meeting_leader || "-",
        id,
      ],
    );

    // Kirim notifikasi jika status Disetujui oleh Admin
    if (status === "Disetujui") {
      const notifInfoUser = `Reservasi ${title} tanggal ${date} telah disetujui oleh admin.`;
      const notifInfoAdmin = `Reservasi "${title}" oleh ${pic} tanggal ${date} telah DISETUJUI.`;

      // 1. Notifikasi untuk User Pemohon (tabel internal/eksternal)
      if (user_id) {
        await db.query(
          `INSERT INTO ${targetTable} (user_id, title, type, status, info, is_read, created_at) 
           VALUES (?, 'Reservasi Disetujui', 'room', 'Disetujui', ?, 0, NOW())`,
          [user_id, notifInfoUser],
        );
      }

      // 2. Notifikasi untuk Admin (tabel notifikasi_admin)
      await db.query(
        `INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
         VALUES ('Reservasi Disetujui', 'room', 'Disetujui', ?, 0, NOW())`,
        [notifInfoAdmin],
      );
    }

    return NextResponse.json({ success: true, message: "Agenda diperbarui" });
  } catch (error: any) {
    console.error("API PUT AGENDAS ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 4. DELETE: Hapus agenda manual
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await db.query("DELETE FROM agendas WHERE id = ?", [id]);
    return NextResponse.json({
      success: true,
      message: "Agenda berhasil dihapus",
    });
  } catch (error: any) {
    console.error("API DELETE AGENDAS ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
