import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// 1. GET: Ambil data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const roomParam = searchParams.get("room");

    const d = new Date();
    const today = d.toISOString().split("T")[0];

    // Hapus data yang sudah lewat
    await db.query("DELETE FROM agendas WHERE date < ?", [today]);

    let query = `
      SELECT id, title, pic, dept, room_id, room_name, 
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
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 2. POST: Tambah reservasi & Notifikasi Otomatis
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      pic,
      dept,
      total_participants,
      meeting_leader,
      room_id,
      room_name,
      date,
      start_time,
      end_time,
      layout,
      notes,
      status,
      user_id,
    } = body;

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
      (title, pic, dept, total_participants, meeting_leader, room_id, room_name, date, start_time, end_time, layout, notes, status, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        pic,
        dept,
        total_participants || 1,
        meeting_leader || "-",
        room_id || null,
        room_name,
        date,
        start_time,
        end_time,
        layout,
        notes,
        status,
        user_id || null,
      ],
    );

    // INSERT NOTIFIKASI
    if (user_id) {
      await db.query(
        "INSERT INTO notifikasi (user_id, title, type, status, info, is_read) VALUES (?, ?, 'room', 'Pending', ?, 0)",
        [
          user_id,
          "Reservasi Diajukan",
          `Reservasi ${room_name} tanggal ${date} sedang diproses.`,
        ],
      );
    }

    return NextResponse.json({ success: true, insertId: result.insertId });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 3. PUT: Update status & Notifikasi (Dengan Fallback Pencarian user_id)
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
      status,
      notes,
      total_participants,
      meeting_leader,
    } = body;
    let { user_id } = body;

    // Jika user_id tidak dikirim dari frontend, ambil langsung dari database berdasarkan id agenda
    if (!user_id && id) {
      const [agendaRows] = await db.query<RowDataPacket[]>(
        "SELECT user_id, title, date FROM agendas WHERE id = ?",
        [id],
      );
      if (agendaRows.length > 0) {
        user_id = agendaRows[0].user_id;
      }
    }

    // Jika status Ditolak, hapus dari database dan kirim notifikasi
    if (status === "Ditolak") {
      await db.query("DELETE FROM agendas WHERE id = ?", [id]);

      if (user_id) {
        await db.query(
          "INSERT INTO notifikasi (user_id, title, type, status, info, is_read) VALUES (?, ?, 'room', 'Ditolak', ?, 0)",
          [
            user_id,
            "Reservasi Ditolak",
            `Reservasi ${title || "Agenda"} pada ${date || ""} ditolak oleh admin.`,
          ],
        );
      }
      return NextResponse.json({ success: true, message: "Ditolak & dihapus" });
    }

    // Update status selain ditolak (termasuk total_participants & meeting_leader)
    await db.query(
      `UPDATE agendas 
       SET title = ?, date = ?, start_time = ?, end_time = ?, pic = ?, status = ?, notes = ?, total_participants = ?, meeting_leader = ? 
       WHERE id = ?`,
      [
        title,
        date,
        start_time,
        end_time,
        pic,
        status,
        notes || "",
        total_participants || 1,
        meeting_leader || "-",
        id,
      ],
    );

    // Kirim notifikasi jika status Disetujui
    if (status === "Disetujui" && user_id) {
      await db.query(
        "INSERT INTO notifikasi (user_id, title, type, status, info, is_read) VALUES (?, ?, 'room', 'Disetujui', ?, 0)",
        [
          user_id,
          "Reservasi Disetujui",
          `Reservasi ${title} tanggal ${date} telah disetujui.`,
        ],
      );
    }

    return NextResponse.json({ success: true, message: "Agenda diperbarui" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 4. DELETE
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
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
