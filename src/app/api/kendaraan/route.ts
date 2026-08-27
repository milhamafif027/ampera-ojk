import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
    const vehicles: any = await db.$queryRaw`
      SELECT * FROM kendaraan ORDER BY id ASC
    `;

    let bookings: any[] = [];
    try {
      const bookingRows: any = await db.$queryRaw`
        SELECT * FROM vehicle_bookings ORDER BY id DESC
      `;
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
      await db.$executeRaw`
        INSERT INTO kendaraan (name, plate_number, type, driver_name, status)
        VALUES (${name}, ${plate_number}, ${type}, ${driver_name}, ${status || "Tersedia"})
      `;

      return NextResponse.json({
        success: true,
        message: "Kendaraan baru berhasil ditambahkan",
      });
    }

    // Aksi untuk menyetujui / memperbarui status peminjaman kendaraan
    if (action === "approve_booking") {
      const finalStatus = status || "Disetujui";

      await db.$executeRaw`
        UPDATE vehicle_bookings 
        SET status = ${finalStatus}, total_passengers = ${total_passengers || 1}, approval_notes = ${approval_notes || ""}
        WHERE id = ${Number(id)}
      `;

      // Ambil data detail booking untuk pengiriman notifikasi
      const bookingRows: any = await db.$queryRaw`
        SELECT * FROM vehicle_bookings WHERE id = ${Number(id)}
      `;

      if (bookingRows.length > 0) {
        const booking = bookingRows[0];

        // Dapatkan role user jika memiliki user_id
        let userRole = "eksternal";
        if (booking.user_id) {
          const userRows: any = await db.$queryRaw`
            SELECT role FROM users WHERE id = ${Number(booking.user_id)}
          `;
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
          if (targetTable === "notifikasi_internal") {
            await db.$executeRaw`
              INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at) 
              VALUES (${Number(booking.user_id)}, ${notifTitle}, 'vehicle', ${finalStatus}, ${notifInfoUser}, 0, NOW())
            `;
          } else {
            await db.$executeRaw`
              INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at) 
              VALUES (${Number(booking.user_id)}, ${notifTitle}, 'vehicle', ${finalStatus}, ${notifInfoUser}, 0, NOW())
            `;
          }
        }

        // 2. Kirim notifikasi ke Admin (notifikasi_admin)
        await db.$executeRaw`
          INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
          VALUES (${notifTitle}, 'vehicle', ${finalStatus}, ${notifInfoAdmin}, 0, NOW())
        `;
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

      const result: any = await db.$queryRaw`
        INSERT INTO kendaraan (name, plate_number, type, driver_name, status, img) 
        VALUES (${name}, ${plate}, ${type}, ${driver}, ${status}, ${imagePath || ""})
        RETURNING id
      `;

      return NextResponse.json({
        success: true,
        message: "Kendaraan baru berhasil ditambahkan",
        insertId: result[0]?.id,
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
        role,
      } = body;

      const cleanRole = role?.toLowerCase() || "eksternal";

      const bookingStatus =
        status ||
        (cleanRole === "admin" || cleanRole === "internal"
          ? "Disetujui"
          : "Pending");

      await db.$executeRaw`
        INSERT INTO vehicle_bookings (vehicle_name, destination, borrower, dept, start_date, end_date, status, user_id)
        VALUES (${nama_kendaraan}, ${tujuan}, ${peminjam}, ${satker}, ${tanggal_mulai}::date, ${tanggal_selesai}::date, ${bookingStatus}, ${user_id ? Number(user_id) : null})
      `;

      // --- OTOMATISASI KIRIM NOTIFIKASI ---
      const adminNotifTitle =
        cleanRole === "eksternal"
          ? "Peminjaman Kendaraan Baru"
          : "Peminjaman Kendaraan Otomatis (Internal/Admin)";
      const adminNotifInfo = `Peminjaman ${nama_kendaraan} oleh ${peminjam} (${satker}) menuju ${tujuan} (${tanggal_mulai} s.d ${tanggal_selesai}). Status: ${bookingStatus}`;

      await db.$executeRaw`
        INSERT INTO notifikasi_admin (title, type, status, info, is_read, created_at) 
        VALUES (${adminNotifTitle}, 'vehicle', ${bookingStatus}, ${adminNotifInfo}, 0, NOW())
      `;

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

        if (targetTable === "notifikasi_internal") {
          await db.$executeRaw`
            INSERT INTO notifikasi_internal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${Number(user_id)}, ${userNotifTitle}, 'vehicle', ${bookingStatus}, ${userNotifInfo}, 0, NOW())
          `;
        } else {
          await db.$executeRaw`
            INSERT INTO notifikasi_eksternal (user_id, title, type, status, info, is_read, created_at) 
            VALUES (${Number(user_id)}, ${userNotifTitle}, 'vehicle', ${bookingStatus}, ${userNotifInfo}, 0, NOW())
          `;
        }
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
