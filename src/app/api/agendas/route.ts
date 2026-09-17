import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Helper verifikasi sesi langsung dari tabel users yang sudah ada
async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return null;

  try {
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

// 1. GET: Ambil data agenda (Bisa diakses untuk render kalender & cek bentrok)
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

// 2. POST: Tambah reservasi (Auto-Approve untuk Internal/Admin, Pending untuk Eksternal)
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
      role: clientRole,
      user_id: clientUserId,
    } = body;

    if (!date || typeof date !== "string" || date.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Tanggal mulai agenda wajib diisi." },
        { status: 400 },
      );
    }

    const cleanStartDate = date.slice(0, 10);
    const finalEndDate =
      end_date && typeof end_date === "string" && end_date.trim() !== ""
        ? end_date.slice(0, 10)
        : cleanStartDate;

    const participantsNum = Number(total_participants) || 1;
    const targetRoomName = room_name || "Ruang Rapat OJK";
    const targetRoomLower = targetRoomName.toLowerCase();
    const targetLayoutLower = (layout || "").toLowerCase();

    const isTargetBallroom =
      targetRoomLower.includes("ballroom") ||
      targetRoomLower.includes("sriwidjaya");
    const isTargetKomunal = targetRoomLower.includes("komunal");
    const isRoundTable = targetLayoutLower.includes("round table");

    // Validasi mutlak kapasitas maksimal Ballroom Round Table tidak boleh > 250
    if (isTargetBallroom && isRoundTable && participantsNum > 250) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kapasitas maksimal Ballroom untuk layout 'Round Table' adalah 250 orang.",
        },
        { status: 400 },
      );
    }

    // Evaluasi Role Pemohon
    const effectiveRole = (
      authUser?.role ||
      clientRole ||
      "eksternal"
    ).toLowerCase();
    const effectiveUserId = authUser?.id || clientUserId || null;

    const isAutoApprove =
      effectiveRole === "admin" ||
      effectiveRole === "internal" ||
      effectiveRole === "pegawai";

    const finalStatus = isAutoApprove ? "Disetujui" : "Pending";

    // =========================================================================
    // PENGECEKAN BENTROK JADWAL
    // =========================================================================
    let conflictQuery;

    if (isTargetKomunal && isRoundTable) {
      conflictQuery = await db.$queryRaw`
        SELECT id FROM agendas 
        WHERE status != 'Ditolak'
          AND (date <= ${finalEndDate}::date AND COALESCE(end_date, date) >= ${cleanStartDate}::date)
          AND (start_time < ${end_time} AND end_time > ${start_time})
          AND LOWER(room_name) LIKE '%ballroom%'
          AND LOWER(layout) LIKE '%round table%'
          AND total_participants >= 200
        LIMIT 1
      `;
    } else if (
      isTargetBallroom &&
      isRoundTable &&
      participantsNum >= 200 &&
      participantsNum <= 250
    ) {
      conflictQuery = await db.$queryRaw`
        SELECT id FROM agendas 
        WHERE status != 'Ditolak'
          AND (date <= ${finalEndDate}::date AND COALESCE(end_date, date) >= ${cleanStartDate}::date)
          AND (start_time < ${end_time} AND end_time > ${start_time})
          AND LOWER(room_name) LIKE '%komunal%'
          AND LOWER(layout) LIKE '%round table%'
        LIMIT 1
      `;
    } else {
      conflictQuery = await db.$queryRaw`
        SELECT id FROM agendas 
        WHERE room_name = ${targetRoomName} 
          AND status != 'Ditolak'
          AND (date <= ${finalEndDate}::date AND COALESCE(end_date, date) >= ${cleanStartDate}::date)
          AND (start_time < ${end_time} AND end_time > ${start_time})
        LIMIT 1
      `;
    }

    const conflicts: any = conflictQuery;

    if (conflicts.length > 0) {
      let customMessage =
        "Jadwal bentrok! Ruangan sudah terisi pada rentang tanggal dan jam tersebut.";
      if (isTargetKomunal && isRoundTable) {
        customMessage =
          "Layout 'Round Table' di Ruangan Komunal tidak dapat dipesan karena Ballroom sedang menggunakan 'Round Table' kapasitas besar (>= 200 orang).";
      } else if (isTargetBallroom && isRoundTable && participantsNum >= 200) {
        customMessage =
          "Ballroom dengan layout 'Round Table' (200 - 250 orang) tidak dapat dipesan karena Ruangan Komunal sudah terisi layout 'Round Table'.";
      }

      return NextResponse.json(
        { success: false, message: customMessage },
        { status: 400 },
      );
    }

    const dateInfoStr =
      cleanStartDate === finalEndDate
        ? `tanggal ${cleanStartDate}`
        : `tanggal ${cleanStartDate} s.d. ${finalEndDate}`;

    // Eksekusi mutasi sebagai 1 record utuh
    const insertedId = await db.$transaction(async (tx) => {
      const insertResult: any = await tx.$queryRaw`
        INSERT INTO agendas 
        (title, pic, dept, phone, total_participants, meeting_leader, room_id, room_name, date, end_date, start_time, end_time, layout, notes, status, user_id) 
        VALUES (
          ${title}, 
          ${pic || authUser?.name || "Pemohon"}, 
          ${dept || authUser?.dept || "-"}, 
          ${phone || null}, 
          ${participantsNum}, 
          ${meeting_leader || "-"}, 
          ${room_id ? Number(room_id) : null}, 
          ${targetRoomName}, 
          ${cleanStartDate}::date, 
          ${finalEndDate}::date, 
          ${start_time}, 
          ${end_time}, 
          ${layout || "-"}, 
          ${notes || ""}, 
          ${finalStatus}, 
          ${effectiveUserId ? Number(effectiveUserId) : null}
        )
        RETURNING id
      `;

      const id = insertResult[0]?.id;

      // Notifikasi Admin & Pemohon Berdasarkan Status (Disetujui Otomatis vs Pending)
      const adminNotifTitle = isAutoApprove
        ? "Reservasi Ruangan Baru (Disetujui Otomatis)"
        : "Pengajuan Ruangan Baru (Menunggu Verifikasi)";
      const adminNotifInfo = isAutoApprove
        ? `Reservasi ${targetRoomName} oleh ${pic || authUser?.name} (${dept || authUser?.dept}) untuk ${dateInfoStr} (${start_time} - ${end_time}) telah disetujui otomatis.`
        : `Request ruangan oleh ${pic || authUser?.name} (${dept || authUser?.dept}) untuk ${dateInfoStr} (${start_time} - ${end_time}).`;

      await tx.$executeRaw`
        INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
        VALUES (${adminNotifTitle}, 'room', ${finalStatus}, ${adminNotifInfo}, 0, CURRENT_TIMESTAMP)
      `;

      // Notifikasi Pemohon
      if (effectiveUserId) {
        const targetTable =
          effectiveRole === "internal" || effectiveRole === "admin"
            ? "notifikasi_internal"
            : "notifikasi_eksternal";

        const userNotifTitle = isAutoApprove
          ? "Reservasi Ruangan Disetujui"
          : "Pengajuan Berhasil Dikirim";
        const userNotifInfo = isAutoApprove
          ? `Reservasi ruangan ${targetRoomName} (${dateInfoStr}) berhasil dan langsung disetujui.`
          : `Pengajuan ruangan (${dateInfoStr}) berhasil dikirim dan menunggu verifikasi Admin.`;

        if (targetTable === "notifikasi_internal") {
          await tx.$executeRaw`
            INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${Number(effectiveUserId)}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, CURRENT_TIMESTAMP)
          `;
        } else {
          await tx.$executeRaw`
            INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${Number(effectiveUserId)}, ${userNotifTitle}, 'room', ${finalStatus}, ${userNotifInfo}, 0, CURRENT_TIMESTAMP)
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
      room_name,
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
    const targetRoom = room || room_name || targetAgenda.room_name;

    await db.$transaction(async (tx) => {
      if (
        title &&
        date &&
        start_time &&
        end_time &&
        targetRoom &&
        targetRoom !== "Menunggu Plotting Admin"
      ) {
        const conflicts: any = await tx.$queryRaw`
          SELECT id FROM agendas 
          WHERE room_name = ${targetRoom} 
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
              room_name = ${targetRoom},
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
          SET room_name = ${targetRoom},
              status = ${finalStatus}, 
              notes = ${String(notes)}
          WHERE id = ${agendaId}
        `;
      }

      // Kirim Notifikasi ke Pemohon jika status atau ruangan di-update
      if (targetAgenda.user_id) {
        const userRows: any = await tx.$queryRaw`
          SELECT role FROM users WHERE id = ${targetAgenda.user_id} LIMIT 1
        `;
        const ownerRole = (userRows[0]?.role || "eksternal").toLowerCase();
        const userNotifTitle = `Pembaruan Reservasi: ${finalStatus}`;
        const userNotifInfo = `Reservasi Anda di ruangan ${targetRoom} telah ${finalStatus}.`;

        if (ownerRole === "internal" || ownerRole === "admin") {
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
      success: true, // Hanya satu saja yang bernilai true
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
