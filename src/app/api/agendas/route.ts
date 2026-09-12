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

    if (dateParam && roomParam) {
      const rows = await db.$queryRaw`
        SELECT id, title, pic, dept, phone, room_id, room_name, 
               TO_CHAR(date, 'YYYY-MM-DD') AS date, 
               TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date, 
               start_time, end_time, layout, notes, status, user_id,
               total_participants, meeting_leader
        FROM agendas 
        WHERE room_name = ${roomParam} 
          AND ${dateParam}::date BETWEEN date AND COALESCE(end_date, date)
        ORDER BY date ASC, start_time ASC
      `;
      return NextResponse.json({ success: true, data: rows });
    } else if (dateParam) {
      const rows = await db.$queryRaw`
        SELECT id, title, pic, dept, phone, room_id, room_name, 
               TO_CHAR(date, 'YYYY-MM-DD') AS date, 
               TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date, 
               start_time, end_time, layout, notes, status, user_id,
               total_participants, meeting_leader
        FROM agendas 
        WHERE ${dateParam}::date BETWEEN date AND COALESCE(end_date, date)
        ORDER BY date ASC, start_time ASC
      `;
      return NextResponse.json({ success: true, data: rows });
    } else if (roomParam) {
      const rows = await db.$queryRaw`
        SELECT id, title, pic, dept, phone, room_id, room_name, 
               TO_CHAR(date, 'YYYY-MM-DD') AS date, 
               TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date, 
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
               TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date, 
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

// 2. POST: Tambah reservasi dengan dukungan Multi-Hari & validasi bentrok ketat
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
      date, // Tanggal Mulai
      end_date, // Tanggal Selesai (opsional dari frontend)
      start_time,
      end_time,
      layout,
      notes,
      user_id,
      role,
    } = body;

    if (!date || typeof date !== "string" || date.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Tanggal mulai agenda wajib diisi dengan benar.",
        },
        { status: 400 },
      );
    }

    // Jika end_date tidak diisi / kosong, samakan dengan date (1 hari)
    const finalEndDate =
      end_date && typeof end_date === "string" && end_date.trim() !== ""
        ? end_date
        : date;

    const cleanRole = role?.toLowerCase() || "";

    const isAutoApprove =
      cleanRole === "admin" ||
      cleanRole === "internal" ||
      cleanRole === "pegawai" ||
      (user_id && cleanRole !== "eksternal");

    const finalStatus = isAutoApprove ? "Disetujui" : "Pending";

    // Pengecekan Bentrok Multi-Hari & Jam
    // Rumus overlap rentang tanggal: (StartDateA <= EndDateB) AND (EndDateA >= StartDateB)
    // Serta overlap jam: (start_time < end_time) AND (end_time > start_time)
    const conflicts: any = await db.$queryRaw`
      SELECT id FROM agendas 
      WHERE room_name = ${room_name} 
        AND status != 'Ditolak'
        AND (date <= ${finalEndDate}::date AND COALESCE(end_date, date) >= ${date}::date)
        AND (start_time < ${end_time} AND end_time > ${start_time})
    `;

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Jadwal bentrok! Ruangan sudah dipesan pada rentang tanggal dan waktu tersebut.",
        },
        { status: 400 },
      );
    }

    const result: any = await db.$queryRaw`
      INSERT INTO agendas 
      (title, pic, dept, phone, total_participants, meeting_leader, room_id, room_name, date, end_date, start_time, end_time, layout, notes, status, user_id) 
      VALUES (${title}, ${pic}, ${dept}, ${phone || null}, ${Number(total_participants) || 1}, ${meeting_leader || "-"}, ${room_id ? Number(room_id) : null}, ${room_name}, ${date}::date, ${finalEndDate}::date, ${start_time}, ${end_time}, ${layout}, ${notes || ""}, ${finalStatus}, ${user_id ? Number(user_id) : null})
      RETURNING id
    `;

    const insertedId = result[0]?.id;

    const adminNotifTitle =
      finalStatus === "Disetujui"
        ? "Reservasi Otomatis (Internal/Admin)"
        : "Pengajuan Ruangan Baru";
    const dateInfoStr =
      date === finalEndDate
        ? `tanggal ${date}`
        : `tanggal ${date} s.d. ${finalEndDate}`;
    const adminNotifInfo = `Ruangan ${room_name} dipesan oleh ${pic} (${dept}) untuk ${dateInfoStr} (${start_time} - ${end_time}). Status: ${finalStatus}`;

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
          ? `Reservasi ruangan ${room_name} (${dateInfoStr}) berhasil dan langsung disetujui.`
          : `Pengajuan ruangan ${room_name} (${dateInfoStr}) Anda telah dikirim dan sedang ditinjau oleh Admin.`;

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

// 3. PUT: Update data agenda (Mendukung rentang tanggal baru)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      date,
      end_date,
      start_time,
      end_time,
      room,
      pic,
      dept,
      layout,
      status = "Pending",
      notes = "",
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID agenda diperlukan untuk update." },
        { status: 400 },
      );
    }

    const agendaId = Number(id);
    const safeStatus = String(status);
    const safeNotes = String(notes || "");
    const finalEndDate = end_date ? end_date : date;

    if (title && date && start_time && end_time && room) {
      const conflicts: any = await db.$queryRaw`
        SELECT id FROM agendas 
        WHERE room_name = ${room} 
          AND id != ${agendaId}
          AND status != 'Ditolak'
          AND (date <= ${finalEndDate}::date AND COALESCE(end_date, date) >= ${date}::date)
          AND (start_time < ${end_time} AND end_time > ${start_time})
      `;

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal memperbarui: Jadwal bentrok dengan agenda lain pada ruangan dan rentang waktu tersebut.",
          },
          { status: 400 },
        );
      }

      await db.$executeRaw`
        UPDATE agendas 
        SET title = ${title},
            date = ${date}::date,
            end_date = ${finalEndDate}::date,
            start_time = ${start_time},
            end_time = ${end_time},
            room_name = ${room},
            pic = ${pic || "-"},
            dept = ${dept || "-"},
            layout = ${layout || "-"},
            status = ${safeStatus}, 
            notes = ${safeNotes}
        WHERE id = ${agendaId}
      `;
    } else {
      if (safeStatus === "Ditolak" && !title) {
        await db.$executeRaw`DELETE FROM agendas WHERE id = ${agendaId}`;
        return NextResponse.json({
          success: true,
          message: "Ditolak & dihapus",
        });
      }

      await db.$executeRaw`
        UPDATE agendas 
        SET status = ${safeStatus}, 
            notes = ${safeNotes}
        WHERE id = ${agendaId}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Agenda berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("API PUT AGENDAS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || String(error) },
      { status: 500 },
    );
  }
}

// 4. DELETE: Hapus data agenda secara permanen
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID agenda diperlukan untuk menghapus." },
        { status: 400 },
      );
    }

    const agendaId = Number(id);

    await db.$executeRaw`
      DELETE FROM agendas WHERE id = ${agendaId}
    `;

    return NextResponse.json({
      success: true,
      message: "Agenda berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("API DELETE AGENDAS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || String(error) },
      { status: 500 },
    );
  }
}
