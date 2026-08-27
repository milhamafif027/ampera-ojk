import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 1. GET: Mengambil daftar vendor berdasarkan kategori
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let rows: any = [];

    if (category && category !== "all") {
      rows = await db.$queryRaw`
        SELECT id, name, category, phone, address 
        FROM vendors 
        WHERE category = ${category} 
        ORDER BY name ASC
      `;
    } else {
      rows = await db.$queryRaw`
        SELECT id, name, category, phone, address 
        FROM vendors 
        ORDER BY name ASC
      `;
    }

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("API GET VENDORS ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 2. POST: Menambah vendor baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, phone, address } = body;

    if (!name || !category || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama, kategori, dan nomor telepon wajib diisi",
        },
        { status: 400 },
      );
    }

    const result: any = await db.$queryRaw`
      INSERT INTO vendors (name, category, phone, address)
      VALUES (${name}, ${category}, ${phone}, ${address || null})
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      message: "Vendor berhasil ditambahkan",
      id: result[0]?.id,
    });
  } catch (error: any) {
    console.error("API POST VENDORS ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 3. PUT: Memperbarui data vendor
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, category, phone, address } = body;

    if (!id || !name || !category || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "ID, nama, kategori, dan telepon wajib diisi",
        },
        { status: 400 },
      );
    }

    const vendorId = Number(id);

    await db.$executeRaw`
      UPDATE vendors 
      SET name = ${name}, category = ${category}, phone = ${phone}, address = ${address || null}
      WHERE id = ${vendorId}
    `;

    return NextResponse.json({
      success: true,
      message: "Data vendor berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("API PUT VENDORS ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 4. DELETE: Menghapus vendor
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID vendor tidak valid" },
        { status: 400 },
      );
    }

    const vendorId = Number(id);
    await db.$executeRaw`DELETE FROM vendors WHERE id = ${vendorId}`;

    return NextResponse.json({
      success: true,
      message: "Vendor berhasil dihapus",
    });
  } catch (error: any) {
    console.error("API DELETE VENDORS ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
