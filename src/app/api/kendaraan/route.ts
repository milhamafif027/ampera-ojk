import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { writeFile } from "fs/promises";
import path from "path";

// Helper untuk menentukan tabel notifikasi user berdasarkan role
function getUserNotificationTable(role?: string): string {
  const cleanRole = role?.toLowerCase() || "";
  if (cleanRole === "internal") return "notifikasi_internal";
  return "notifikasi_eksternal"; // Default untuk eksternal
}

// 1. GET: Mengambil data kendaraan & riwayat booking
export async function GET() {
  try {
    const [vehicles] = await db.query<RowDataPacket[]>(
      "SELECT * FROM kendaraan ORDER BY id ASC",
    );

    let bookings: any[] = [];
    try {
      const [bookingRows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM vehicle_bookings ORDER BY id DESC",
      );
      bookings = bookingRows;
    } catch (e) {
      bookings = [];
    }

    return NextResponse.json({
      success: true,
      vehicles: vehicles,
      bookings: bookings,
    });
  } catch (error) {
    console.error("Kendaraan API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data kendaraan dari database",
      },
      { status: 500 },
    );
  }
}

// 2. PUT: Menangani penambahan kendaraan baru & persetujuan/penolakan booking
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      name,
      plate_number,
      type,
      driver_name,
      status,
      id,
      total_passengers,
      approval_notes,
    } = body;

    // Aksi untuk menambah kendaraan baru (Admin)
    if (action === "add_vehicle") {
      const query = `
        INSERT INTO kendaraan (name, plate_number, type, driver_name, status)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.query(query, [
        name,
        plate_number,
        type,
        driver_name,
        status || "Tersedia",
      ]);

      return NextResponse.json({
        success: true,
        message: "Kendaraan baru berhasil ditambahkan",
      });
    }

    // Aksi untuk menyetujui / memperbarui status peminjaman kendaraan
    if (action === "approve_booking") {
      const finalStatus = status || "Disetujui";

      // Jika status Ditolak, kita bisa hapus atau update statusnya menjadi Ditolak
      const query = `
        UPDATE vehicle_bookings 
        SET status = ?, total_passengers = ?, approval_notes = ?
        WHERE id = ?
      `;

      await db.query(query, [
        finalStatus,
        total_passengers || 1,
        approval_notes || "",
        id,
      ]);

      // Ambil data detail booking untuk pengiriman notifikasi
      const [bookingRows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM vehicle_bookings WHERE id = ?",
        [id],
      );

      if (bookingRows.length > 0) {
        const booking = bookingRows[0];

        // Dapatkan role user jika memiliki user_id
        let userRole = "eksternal";
        if (booking.user_id) {
          const [userRows] = await db.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ?",
            [booking.user_id],
          );
          if (userRows.length > 0) {
            userRole = userRows[0].role;
          }
        }
        const targetTable = getUserNotificationTable(userRole);

        const notifTitle =
          finalStatus === "Disetujui"
            ? "Peminjaman Kendaraan Disetujui"
            : "Peminjaman Kendaraan Ditolak";
        const notifInfoUser =
          finalStatus === "Disetujui"
            ? `Pengajuan peminjaman kendaraan ${booking.vehicle_name} Anda telah DISETUJUI oleh Admin.`
            : `Mohon maaf, pengajuan peminjaman kendaraan ${booking.vehicle_name} Anda DITOLAK.${approval_notes ? ` Alasan: ${approval_notes}` : ""}`;

        const notifInfoAdmin = `Peminjaman kendaraan "${booking.vehicle_name}" oleh ${booking.borrower} telah ${finalStatus.toUpperCase()}.`;

        // 1. Kirim notifikasi ke user pemohon
        if (booking.user_id) {
          await db.query(
            `INSERT INTO ${targetTable} (user_id, title, type, status, info, is_read, created_at) 
             VALUES (?, ?, 'vehicle', ?, ?, 0, NOW())`,
            [booking.user_id, notifTitle, finalStatus, notifInfoUser],
          );
        }

        // 2. Kirim notifikasi ke Admin (notifikasi_admin)
        await db.query(
          `INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
           VALUES (?, 'vehicle', ?, ?, 0, NOW())`,
          [notifTitle, finalStatus, notifInfoAdmin],
        );
      }

      return NextResponse.json({
        success: true,
        message: `Peminjaman kendaraan berhasil ${finalStatus.toLowerCase()}`,
      });
    }

    return NextResponse.json(
      { success: false, message: "Aksi tidak dikenali" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("PUT Kendaraan Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses data" },
      { status: 500 },
    );
  }
}

// 3. POST: Menambahkan kendaraan via FormData atau Peminjaman via JSON
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const name = formData.get("name") as string;
      const plate = formData.get("plate_number") as string;
      const type = formData.get("type") as string;
      const driver = formData.get("driver_name") as string;
      const status = (formData.get("status") as string) || "Tersedia";
      const file = formData.get("image") as File | null;

      let imagePath = "";
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await writeFile(path.join(uploadDir, filename), buffer);
        imagePath = `/uploads/${filename}`;
      }

      const query = `
        INSERT INTO kendaraan (name, plate_number, type, driver_name, status, img) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query<ResultSetHeader>(query, [
        name,
        plate,
        type,
        driver,
        status,
        imagePath || "",
      ]);

      return NextResponse.json({
        success: true,
        message: "Kendaraan baru berhasil ditambahkan",
        insertId: result.insertId,
      });
    } else {
      const body = await request.json();
      const {
        nama_kendaraan,
        tujuan,
        peminjam,
        satker,
        tanggal_mulai,
        tanggal_selesai,
        status,
        user_id,
        role, // Menerima role dari frontend ("admin", "internal", atau "eksternal")
      } = body;

      const cleanRole = role?.toLowerCase() || "eksternal";

      // ATURAN STATUS OTOMATIS:
      // - Jika yang mengajukan adalah 'admin' atau 'internal', otomatis "Disetujui"
      // - Jika 'eksternal', wajib "Pending" (menunggu verifikasi admin)
      const bookingStatus =
        status ||
        (cleanRole === "admin" || cleanRole === "internal"
          ? "Disetujui"
          : "Pending");

      const query = `
        INSERT INTO vehicle_bookings (vehicle_name, destination, borrower, dept, start_date, end_date, status, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.query(query, [
        nama_kendaraan,
        tujuan,
        peminjam,
        satker,
        tanggal_mulai,
        tanggal_selesai,
        bookingStatus,
        user_id || null,
      ]);

      // --- OTOMATISASI KIRIM NOTIFIKASI KE 3 TABEL TERPISAH ---

      // 1. Kirim notifikasi ke Admin (notifikasi_admin)
      const adminNotifTitle =
        cleanRole === "eksternal"
          ? "Peminjaman Kendaraan Baru"
          : "Peminjaman Kendaraan Otomatis (Internal/Admin)";
      const adminNotifInfo = `Peminjaman ${nama_kendaraan} oleh ${peminjam} (${satker}) menuju ${tujuan} (${tanggal_mulai} s.d ${tanggal_selesai}). Status: ${bookingStatus}`;

      await db.query(
        `INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
         VALUES (?, 'vehicle', ?, ?, 0, NOW())`,
        [adminNotifTitle, bookingStatus, adminNotifInfo],
      );

      // 2. Kirim notifikasi personal ke User (jika user_id tersedia)
      if (user_id) {
        const targetTable = getUserNotificationTable(cleanRole);
        const userNotifTitle =
          bookingStatus === "Disetujui"
            ? "Peminjaman Disetujui Otomatis"
            : "Pengajuan Peminjaman Dikirim";
        const userNotifInfo =
          bookingStatus === "Disetujui"
            ? `Peminjaman kendaraan ${nama_kendaraan} Anda berhasil dan langsung disetujui.`
            : `Pengajuan peminjaman kendaraan ${nama_kendaraan} Anda berhasil dikirim dan menunggu verifikasi Admin.`;

        await db.query(
          `INSERT INTO ${targetTable} (user_id, title, type, status, info, is_read, created_at) 
           VALUES (?, ?, 'vehicle', ?, ?, 0, NOW())`,
          [user_id, userNotifTitle, bookingStatus, userNotifInfo],
        );
      }

      return NextResponse.json({
        success: true,
        message: "Pengajuan peminjaman berhasil disimpan",
        status: bookingStatus,
      });
    }
  } catch (error: any) {
    console.error("Post Kendaraan/Booking Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal memproses data ke database",
      },
      { status: 500 },
    );
  }
}
