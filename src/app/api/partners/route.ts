import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { writeFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM partners ORDER BY id ASC",
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const stars = formData.get("stars") as string;
    const area = formData.get("area") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const description = formData.get("description") as string;
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
      INSERT INTO partners (name, stars, area, phone, address, description, img) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query<ResultSetHeader>(query, [
      name,
      Number(stars) || 4,
      area,
      phone,
      address || "",
      description || "",
      imagePath || "",
    ]);

    return NextResponse.json({ success: true, insertId: result.insertId });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// PUT: Edit Partner
export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const stars = formData.get("stars") as string;
    const area = formData.get("area") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const description = formData.get("description") as string;
    const file = formData.get("image") as File | null;

    let imageQueryPart = "";
    const queryParams: any[] = [
      name,
      Number(stars) || 4,
      area,
      phone,
      address || "",
      description || "",
    ];

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");
      await writeFile(path.join(uploadDir, filename), buffer);

      imageQueryPart = ", img = ?";
      queryParams.push(`/uploads/${filename}`);
    }

    queryParams.push(id);

    const query = `
      UPDATE partners 
      SET name = ?, stars = ?, area = ?, phone = ?, address = ?, description = ? ${imageQueryPart}
      WHERE id = ?
    `;

    await db.query<ResultSetHeader>(query, queryParams);

    return NextResponse.json({
      success: true,
      message: "Partner berhasil diperbarui",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE: Hapus Partner
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tidak ditemukan" },
        { status: 400 },
      );
    }

    await db.query("DELETE FROM partners WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Partner berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
