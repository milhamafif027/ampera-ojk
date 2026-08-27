import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    // Hapus data yang tanggalnya sudah lewat menggunakan $executeRaw
    await db.$executeRaw`DELETE FROM agendas WHERE date < ${today}::date`;

    // Ambil data menggunakan $queryRaw
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
      role,
    } = body;

    const cleanRole = role?.toLowerCase() || "eksternal";

    const finalStatus =
      cleanRole === "admin" || cleanRole === "internal"
        ? "Disetujui"
        : "Pending";

    // Proteksi Bentrok Jadwal menggunakan $queryRaw
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

    // Insert Agenda menggunakan $queryRaw untuk mengambil id yang baru dibuat (RETURNING id)
    const result: any = await db.$queryRaw`
      INSERT INTO agendas 
      (title, pic, dept, phone, total_participants, meeting_leader, room_id, room_name, date, start_time, end_time, layout, notes, status, user_id) 
      VALUES (${title}, ${pic}, ${dept}, ${phone || null}, ${total_participants || 1}, ${meeting_leader || "-"}, ${room_id ? Number(room_id) : null}, ${room_name}, ${date}::date, ${start_time}, ${end_time}, ${layout}, ${notes || ""}, ${finalStatus}, ${user_id ? Number(user_id) : null})
      RETURNING id
    `;

    const insertedId = result[0]?.id;

    // --- INTEGRASI NOTIFIKASI ---
    const adminNotifTitle =
      cleanRole === "eksternal"
        ? "Pengajuan Ruangan Baru"
        : "Reservasi Otomatis (Internal/Admin)";
    const adminNotifInfo = `Ruangan ${room_name} dipesan oleh ${pic} (${dept}) untuk tanggal ${date} (${start_time} - ${end_time}). Status: ${finalStatus}`;

    await db.$executeRaw`
      INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
      VALUES (${adminNotifTitle}, 'room', ${finalStatus}, ${adminNotifInfo}, 0, NOW())
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

      // Catatan: Karena penamaan tabel dinamis, kita eksekusi menggunakan query aman
      if (targetTable === "notifikasi_internal") {
        await db.$executeRaw`
          INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at) 
          VALUES (${Number(user_id)}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, NOW())
        `;
      } else {
        await db.$executeRaw`
          INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at) 
          VALUES (${Number(user_id)}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, NOW())
        `;
      }
    }

    return NextResponse.json({
      success: true,
      insertId: insertedId,
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

// 3. PUT: Update status (Approve/Reject)
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

    if (!user_id && id) {
      const agendaRows: any = await db.$queryRaw`
        SELECT user_id, title, date, room_name FROM agendas WHERE id = ${Number(id)}
      `;
      if (agendaRows.length > 0) {
        user_id = agendaRows[0].user_id;
      }
    }

    let userRole = "eksternal";
    if (user_id) {
      const userRows: any = await db.$queryRaw`
        SELECT role FROM users WHERE id = ${Number(user_id)}
      `;
      if (userRows.length > 0) {
        userRole = userRows[0].role;
      }
    }
    const targetTable = getUserNotificationTable(userRole);

    if (status === "Ditolak") {
      await db.$executeRaw`DELETE FROM agendas WHERE id = ${Number(id)}`;

      const notifInfoUser = `Reservasi ${title || "Agenda"} pada tanggal ${date || ""} ditolak oleh admin. ${notes ? `Alasan: ${notes}` : ""}`;
      const notifInfoAdmin = `Reservasi "${title || "Agenda"}" oleh ${pic || "Pemohon"} pada tanggal ${date || ""} telah DITOLAK.`;

      if (user_id) {
        if (targetTable === "notifikasi_internal") {
          await db.$executeRaw`
            INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${Number(user_id)}, 'Reservasi Ditolak', 'room', 'Ditolak', ${notifInfoUser}, 0, NOW())
          `;
        } else {
          await db.$executeRaw`
            INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${Number(user_id)}, 'Reservasi Ditolak', 'room', 'Ditolak', ${notifInfoUser}, 0, NOW())
          `;
        }
      }

      await db.$executeRaw`
        INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
        VALUES ('Reservasi Ditolak', 'room', 'Ditolak', ${notifInfoAdmin}, 0, NOW())
      `;

      return NextResponse.json({ success: true, message: "Ditolak & dihapus" });
    }

    await db.$executeRaw`
      UPDATE agendas 
      SET title = ${title}, date = ${date}::date, start_time = ${start_time}, end_time = ${end_time}, 
          pic = ${pic}, phone = ${phone || null}, status = ${status}, notes = ${notes || ""}, 
          total_participants = ${total_participants || 1}, meeting_leader = ${meeting_leader || "-"} 
      WHERE id = ${Number(id)}
    `;

    if (status === "Disetujui") {
      const notifInfoUser = `Reservasi ${title} tanggal ${date} telah disetujui oleh admin.`;
      const notifInfoAdmin = `Reservasi "${title}" oleh ${pic} tanggal ${date} telah DISETUJUI.`;

      if (user_id) {
        if (targetTable === "notifikasi_internal") {
          await db.$executeRaw`
            INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${Number(user_id)}, 'Reservasi Disetujui', 'room', 'Disetujui', ${notifInfoUser}, 0, NOW())
          `;
        } else {
          await db.$executeRaw`
            INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${Number(user_id)}, 'Reservasi Disetujui', 'room', 'Disetujui', ${notifInfoUser}, 0, NOW())
          `;
        }
      }

      await db.$executeRaw`
        INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
        VALUES ('Reservasi Disetujui', 'room', 'Disetujui', ${notifInfoAdmin}, 0, NOW())
      `;
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
    await db.$executeRaw`DELETE FROM agendas WHERE id = ${Number(id)}`;
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
