import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper untuk menentukan tabel notifikasi user berdasarkan role
function getUserNotificationTable(role?: string): string {
  const cleanRole = role?.toLowerCase() || "";
  if (cleanRole === "internal") return "notifikasi_internal";
  return "notifikasi_eksternal";
}

// 1. GET: Ambil data agenda
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const roomParam = searchParams.get("room");

    // PERHATIAN: Perintah DELETE otomatis (DELETE FROM agendas WHERE date < CURRENT_DATE)
    // telah dihapus di sini agar data arsip/jadwal baru tidak terhapus otomatis oleh sistem.

    if (dateParam && roomParam) {
      const rows = await db.$queryRaw`
        SELECT id, title, pic, dept, phone, room_id, room_name, 
               TO_CHAR(date, 'YYYY-MM-DD') AS date, 
               start_time, end_time, layout, notes, status, user_id,
               total_participants, meeting_leader
        FROM agendas 
        WHERE date = ${dateParam}::date AND room_name = ${roomParam}
        ORDER BY date ASC, start_time ASC
      `;
      return NextResponse.json({ success: true, data: rows });
    } else if (dateParam) {
      const rows = await db.$queryRaw`
        SELECT id, title, pic, dept, phone, room_id, room_name, 
               TO_CHAR(date, 'YYYY-MM-DD') AS date, 
               start_time, end_time, layout, notes, status, user_id,
               total_participants, meeting_leader
        FROM agendas 
        WHERE date = ${dateParam}::date
        ORDER BY date ASC, start_time ASC
      `;
      return NextResponse.json({ success: true, data: rows });
    } else if (roomParam) {
      const rows = await db.$queryRaw`
        SELECT id, title, pic, dept, phone, room_id, room_name, 
               TO_CHAR(date, 'YYYY-MM-DD') AS date, 
               start_time, end_time, layout, notes, status, user_id,
               total_participants, meeting_leader
        FROM agendas 
        WHERE room_name = ${roomParam}
        ORDER BY date ASC, start_time ASC
      `;
      return NextResponse.json({ success: true, data: rows });
    } else {
      const rows = await db.$queryRaw`
        SELECT id, title, pic, dept, phone, room_id, room_name, 
               TO_CHAR(date, 'YYYY-MM-DD') AS date, 
               start_time, end_time, layout, notes, status, user_id,
               total_participants, meeting_leader
        FROM agendas 
        ORDER BY date ASC, start_time ASC
      `;
      return NextResponse.json({ success: true, data: rows });
    }
  } catch (error: any) {
    console.error("API GET AGENDAS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || String(error) },
      { status: 500 },
    );
  }
}

// 2. POST: Tambah reservasi
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
      role,
    } = body;

    if (!date || typeof date !== "string" || date.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Tanggal agenda wajib diisi dengan benar." },
        { status: 400 },
      );
    }

    const cleanRole = role?.toLowerCase() || "eksternal";
    const finalStatus =
      cleanRole === "admin" || cleanRole === "internal"
        ? "Disetujui"
        : "Pending";

    const conflicts: any = await db.$queryRaw`
      SELECT id FROM agendas 
      WHERE room_name = ${room_name} AND date = ${date}::date AND status != 'Ditolak'
      AND ((start_time < ${end_time} AND end_time > ${start_time}) 
        OR (start_time >= ${start_time} AND start_time < ${end_time}) 
        OR (end_time > ${start_time} AND end_time <= ${end_time}))
    `;

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

    const result: any = await db.$queryRaw`
      INSERT INTO agendas 
      (title, pic, dept, phone, total_participants, meeting_leader, room_id, room_name, date, start_time, end_time, layout, notes, status, user_id) 
      VALUES (${title}, ${pic}, ${dept}, ${phone || null}, ${Number(total_participants) || 1}, ${meeting_leader || "-"}, ${room_id ? Number(room_id) : null}, ${room_name}, ${date}::date, ${start_time}, ${end_time}, ${layout}, ${notes || ""}, ${finalStatus}, ${user_id ? Number(user_id) : null})
      RETURNING id
    `;

    const insertedId = result[0]?.id;

    const adminNotifTitle =
      cleanRole === "eksternal"
        ? "Pengajuan Ruangan Baru"
        : "Reservasi Otomatis (Internal/Admin)";
    const adminNotifInfo = `Ruangan ${room_name} dipesan oleh ${pic} (${dept}) untuk tanggal ${date} (${start_time} - ${end_time}). Status: ${finalStatus}`;

    await db.$executeRaw`
      INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
      VALUES (${adminNotifTitle}, 'room', ${finalStatus}, ${adminNotifInfo}, 0, CURRENT_TIMESTAMP)
    `;

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

      const uIdNum = Number(user_id);
      if (targetTable === "notifikasi_internal") {
        await db.$executeRaw`
          INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at) 
          VALUES (${uIdNum}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, CURRENT_TIMESTAMP)
        `;
      } else {
        await db.$executeRaw`
          INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at) 
          VALUES (${uIdNum}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, CURRENT_TIMESTAMP)
        `;
      }
    }

    return NextResponse.json({
      success: true,
      insertId: insertedId,
      status: finalStatus,
    });
  } catch (error: any) {
    console.error("API POST AGENDAS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || String(error) },
      { status: 500 },
    );
  }
}

// 3. PUT: Update status dengan aman
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status = "Pending", notes = "" } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID agenda diperlukan untuk update." },
        { status: 400 },
      );
    }

    const agendaId = Number(id);
    const safeStatus = String(status);
    const safeNotes = String(notes || "");

    if (safeStatus === "Ditolak") {
      await db.$executeRaw`DELETE FROM agendas WHERE id = ${agendaId}`;
      return NextResponse.json({ success: true, message: "Ditolak & dihapus" });
    }

    await db.$executeRaw`
      UPDATE agendas 
      SET status = ${safeStatus}, 
          notes = ${safeNotes}
      WHERE id = ${agendaId}
    `;

    return NextResponse.json({ success: true, message: "Agenda diperbarui" });
  } catch (error: any) {
    console.error("API PUT AGENDAS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || String(error) },
      { status: 500 },
    );
  }
}
