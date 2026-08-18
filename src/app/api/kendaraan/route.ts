import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { writeFile } from "fs/promises";
import path from "path";

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

// 2. PUT: Menangani penambahan kendaraan baru & persetujuan booking
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

    // Aksi untuk menyetujui peminjaman kendaraan
    if (action === "approve_booking") {
      const query = `
        UPDATE vehicle_bookings 
        SET status = ?, total_passengers = ?, approval_notes = ?
        WHERE id = ?
      `;

      await db.query(query, [
        status || "Disetujui",
        total_passengers || 1,
        approval_notes || "",
        id,
      ]);

      return NextResponse.json({
        success: true,
        message: "Peminjaman kendaraan berhasil disetujui",
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
        user_id, // Ditangkap dari frontend
      } = body;

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
        status || "Pending",
        user_id || null, // Disimpan ke database
      ]);

      return NextResponse.json({
        success: true,
        message: "Pengajuan peminjaman berhasil disimpan",
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
