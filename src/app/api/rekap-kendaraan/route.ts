import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

// 1. GET: Mengambil seluruh daftar rekap kegiatan dan konversi BigInt ke Number
export async function GET(request: NextRequest) {
  try {
    const rows: any[] = await db.$queryRaw`
      SELECT 
        id, 
        hari_tanggal, 
        no_pol, 
        jam_awal, 
        km_awal, 
        tujuan, 
        keperluan, 
        pengguna, 
        driver, 
        km_akhir, 
        jam_selesai, 
        created_at
      FROM rekap_kendaraan_kopg
      ORDER BY id DESC
    `;

    // Konversi BigInt agar aman diserialisasi ke JSON
    const serializedRows = rows.map((row) => ({
      ...row,
      id: Number(row.id),
      km_awal: Number(row.km_awal),
      km_akhir: Number(row.km_akhir),
    }));

    return NextResponse.json({ success: true, data: serializedRows });
  } catch (error: any) {
    console.error("API GET REKAP KENDARAAN ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 2. POST: Menambah rekap kegiatan dinas baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hari_tanggal,
      no_pol,
      jam_awal,
      km_awal,
      tujuan,
      keperluan,
      pengguna,
      driver,
      km_akhir,
      jam_selesai,
    } = body;

    const kmAwalNum = Number(km_awal) || 0;
    const kmAkhirNum = Number(km_akhir) || 0;
    const jamSelesaiStr =
      jam_selesai && jam_selesai.trim() !== "" ? jam_selesai : "-";

    const result: any = await db.$queryRaw`
      INSERT INTO rekap_kendaraan_kopg (
        hari_tanggal, 
        no_pol, 
        jam_awal, 
        km_awal, 
        tujuan, 
        keperluan, 
        pengguna, 
        driver, 
        km_akhir, 
        jam_selesai
      )
      VALUES (
        ${hari_tanggal}, 
        ${no_pol}, 
        ${jam_awal}, 
        ${kmAwalNum}, 
        ${tujuan}, 
        ${keperluan}, 
        ${pengguna}, 
        ${driver}, 
        ${kmAkhirNum}, 
        ${jamSelesaiStr}
      )
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      insertId: Number(result[0]?.id),
    });
  } catch (error: any) {
    console.error("API POST REKAP KENDARAAN ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 3. DELETE: Menghapus data rekap berdasarkan ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tidak ditemukan" },
        { status: 400 },
      );
    }

    await db.$executeRaw`DELETE FROM rekap_kendaraan_kopg WHERE id = ${Number(id)}`;

    return NextResponse.json({
      success: true,
      message: "Data rekap kegiatan berhasil dihapus",
    });
  } catch (error: any) {
    console.error("API DELETE REKAP KENDARAAN ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
