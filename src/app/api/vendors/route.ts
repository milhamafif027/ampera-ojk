import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// 1. GET: Mengambil daftar vendor berdasarkan kategori
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = "SELECT id, name, category, phone, address FROM vendors";
    let params: any[] = [];

    if (category && category !== "all") {
      query += " WHERE category = ?";
      params = [category];
    }

    query += " ORDER BY name ASC";

    const [rows] = await db.query<RowDataPacket[]>(query, params);
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

    const query = `
      INSERT INTO vendors (name, category, phone, address)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query<ResultSetHeader>(query, [
      name,
      category,
      phone,
      address || null,
    ]);

    return NextResponse.json({
      success: true,
      message: "Vendor berhasil ditambahkan",
      id: result.insertId,
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

    const query = `
      UPDATE vendors 
      SET name = ?, category = ?, phone = ?, address = ?
      WHERE id = ?
    `;

    await db.query<ResultSetHeader>(query, [
      name,
      category,
      phone,
      address || null,
      id,
    ]);

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

    const query = "DELETE FROM vendors WHERE id = ?";
    await db.query<ResultSetHeader>(query, [id]);

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
