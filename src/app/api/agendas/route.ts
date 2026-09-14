import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Helper verifikasi sesi langsung dari tabel users yang sudah ada
async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return null;

  try {
    // Cari user berdasarkan id/token dari cookie langsung di tabel users
    const userSession: any = await db.$queryRaw`
      SELECT id, name, role, dept 
      FROM users 
      WHERE id = ${Number(token) || -1} 
         OR email = ${token}
      LIMIT 1
    `;
    return userSession[0] || null;
  } catch {
    return null;
  }
}

// 1. GET: Ambil data agenda (Bisa diakses untuk render jadwal & cek bentrok)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const roomParam = searchParams.get("room");

    const whereConditions: Prisma.Sql[] = [Prisma.sql`1=1`];

    if (roomParam) {
      whereConditions.push(Prisma.sql`room_name = ${roomParam}`);
    }

    if (dateParam) {
      whereConditions.push(
        Prisma.sql`${dateParam}::date BETWEEN date AND COALESCE(end_date, date)`,
      );
    }

    const whereClause = Prisma.join(whereConditions, " AND ");

    const rows = await db.$queryRaw`
      SELECT id, title, pic, dept, phone, room_id, room_name, 
             TO_CHAR(date, 'YYYY-MM-DD') AS date, 
             TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date, 
             start_time, end_time, layout, notes, status, user_id,
             total_participants, meeting_leader
      FROM agendas 
      WHERE ${whereClause}
      ORDER BY date ASC, start_time ASC
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("API GET AGENDAS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}

// 2. POST: Tambah reservasi
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
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
      end_date,
      start_time,
      end_time,
      layout,
      notes,
    } = body;

    if (!date || typeof date !== "string" || date.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Tanggal mulai agenda wajib diisi." },
        { status: 400 },
      );
    }

    const finalEndDate = end_date && end_date.trim() !== "" ? end_date : date;

    // Tentukan role: prioritaskan authUser jika ada, jika tidak fallback ke penanda pemohon
    const userRole = (authUser?.role || "internal").toLowerCase();
    const isAutoApprove =
      userRole === "admin" || userRole === "internal" || userRole === "pegawai";
    const finalStatus = isAutoApprove ? "Disetujui" : "Pending";

    // Pengecekan Bentrok
    const conflicts: any = await db.$queryRaw`
      SELECT id FROM agendas 
      WHERE room_name = ${room_name} 
        AND status != 'Ditolak'
        AND (date <= ${finalEndDate}::date AND COALESCE(end_date, date) >= ${date}::date)
        AND (start_time < ${end_time} AND end_time > ${start_time})
      LIMIT 1
    `;

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Jadwal bentrok! Ruangan sudah terisi pada tanggal dan jam tersebut.",
        },
        { status: 400 },
      );
    }

    const dateInfoStr =
      date === finalEndDate
        ? `tanggal ${date}`
        : `tanggal ${date} s.d. ${finalEndDate}`;

    const insertedId = await db.$transaction(async (tx) => {
      const insertResult: any = await tx.$queryRaw`
        INSERT INTO agendas 
        (title, pic, dept, phone, total_participants, meeting_leader, room_id, room_name, date, end_date, start_time, end_time, layout, notes, status, user_id) 
        VALUES (
          ${title}, 
          ${pic || authUser?.name || "Pemohon"}, 
          ${dept || authUser?.dept || "-"}, 
          ${phone || null}, 
          ${Number(total_participants) || 1}, 
          ${meeting_leader || "-"}, 
          ${room_id ? Number(room_id) : null}, 
          ${room_name}, 
          ${date}::date, 
          ${finalEndDate}::date, 
          ${start_time}, 
          ${end_time}, 
          ${layout || "-"}, 
          ${notes || ""}, 
          ${finalStatus}, 
          ${authUser?.id ? Number(authUser.id) : null}
        )
        RETURNING id
      `;

      const id = insertResult[0]?.id;

      // Notifikasi Admin
      const adminNotifTitle =
        finalStatus === "Disetujui"
          ? "Reservasi Otomatis (Internal/Admin)"
          : "Pengajuan Ruangan Baru";
      const adminNotifInfo = `Ruangan ${room_name} dipesan oleh ${pic} untuk ${dateInfoStr} (${start_time} - ${end_time}). Status: ${finalStatus}`;

      await tx.$executeRaw`
        INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
        VALUES (${adminNotifTitle}, 'room', ${finalStatus}, ${adminNotifInfo}, 0, CURRENT_TIMESTAMP)
      `;

      // Notifikasi Pemohon (jika user terdaftar)
      if (authUser?.id) {
        const userNotifTitle =
          finalStatus === "Disetujui"
            ? "Reservasi Disetujui Otomatis"
            : "Pengajuan Menunggu Verifikasi";
        const userNotifInfo =
          finalStatus === "Disetujui"
            ? `Reservasi ruangan ${room_name} (${dateInfoStr}) berhasil dan disetujui.`
            : `Pengajuan ruangan ${room_name} (${dateInfoStr}) sedang ditinjau oleh Admin.`;

        if (userRole === "internal") {
          await tx.$executeRaw`
            INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${authUser.id}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, CURRENT_TIMESTAMP)
          `;
        } else {
          await tx.$executeRaw`
            INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${authUser.id}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, CURRENT_TIMESTAMP)
          `;
        }
      }

      return id;
    });

    return NextResponse.json({
      success: true,
      insertId: insertedId,
      status: finalStatus,
    });
  } catch (error: any) {
    console.error("API POST AGENDAS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}

// 3. PUT: Update data agenda
export async function PUT(request: NextRequest) {
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
      status,
      notes = "",
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID agenda diperlukan untuk pembaruan." },
        { status: 400 },
      );
    }

    const agendaId = Number(id);

    const existingAgenda: any = await db.$queryRaw`
      SELECT room_name, date, user_id, status FROM agendas WHERE id = ${agendaId} LIMIT 1
    `;

    if (!existingAgenda || existingAgenda.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data agenda tidak ditemukan." },
        { status: 404 },
      );
    }

    const targetAgenda = existingAgenda[0];
    const finalStatus = status ? String(status) : targetAgenda.status;
    const finalEndDate = end_date ? end_date : date;
    const targetRoomName = room || targetAgenda.room_name;

    await db.$transaction(async (tx) => {
      if (title && date && start_time && end_time && room) {
        const conflicts: any = await tx.$queryRaw`
          SELECT id FROM agendas 
          WHERE room_name = ${room} 
            AND id != ${agendaId}
            AND status != 'Ditolak'
            AND (date <= ${finalEndDate}::date AND COALESCE(end_date, date) >= ${date}::date)
            AND (start_time < ${end_time} AND end_time > ${start_time})
          LIMIT 1
        `;

        if (conflicts.length > 0) {
          throw new Error(
            "Jadwal bentrok dengan agenda lain pada ruangan tersebut.",
          );
        }

        await tx.$executeRaw`
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
              status = ${finalStatus}, 
              notes = ${String(notes)}
          WHERE id = ${agendaId}
        `;
      } else {
        await tx.$executeRaw`
          UPDATE agendas 
          SET status = ${finalStatus}, 
              notes = ${String(notes)}
          WHERE id = ${agendaId}
        `;
      }

      if (status && targetAgenda.user_id) {
        const userRows: any = await tx.$queryRaw`
          SELECT role FROM users WHERE id = ${targetAgenda.user_id} LIMIT 1
        `;
        const ownerRole = (userRows[0]?.role || "eksternal").toLowerCase();
        const userNotifTitle = `Status Reservasi ${finalStatus}`;
        const userNotifInfo = `Reservasi ruangan ${targetRoomName} diubah menjadi: ${finalStatus}.`;

        if (ownerRole === "internal") {
          await tx.$executeRaw`
            INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${targetAgenda.user_id}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, CURRENT_TIMESTAMP)
          `;
        } else {
          await tx.$executeRaw`
            INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${targetAgenda.user_id}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, CURRENT_TIMESTAMP)
          `;
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Agenda berhasil diperbarui.",
    });
  } catch (error: any) {
    console.error("API PUT AGENDAS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan server" },
      { status: 400 },
    );
  }
}

// 4. DELETE: Hapus data agenda
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID agenda diperlukan." },
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
      { success: false, message: error.message || "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
