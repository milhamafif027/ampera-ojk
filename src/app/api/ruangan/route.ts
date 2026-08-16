import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import fs from "fs";
import path from "path";

// 1. GET: Ambil daftar ruangan
export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT * FROM ruangan ORDER BY id DESC",
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("GET Ruangan Error:", error);
    return NextResponse.json(
      { success: false, data: [], error: String(error) },
      { status: 500 },
    );
  }
}

// 2. POST: Tambah ruangan baru
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") || "";

    const rawCapacity = formData.get("capacity") || "0";
    const capacity = parseInt(String(rawCapacity).replace(/\D/g, "")) || 0;

    const description = formData.get("description") || "";
    const type = formData.get("type") || "rapat";
    const floor = formData.get("floor") || "Lantai 2";
    const status = formData.get("status") || "Tersedia";

    const files = formData.getAll("images") as File[];
    const savedImageUrls: string[] = [];

    if (files && files.length > 0) {
      const uploadDir = path.join(process.cwd(), "public/uploads/rooms");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const file of files) {
        if (file && typeof file === "object" && file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, "_")}`;
          const filepath = path.join(uploadDir, filename);

          fs.writeFileSync(filepath, buffer);
          savedImageUrls.push(`/uploads/rooms/${filename}`);
        }
      }
    }

    if (savedImageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ruangan wajib memiliki minimal 1 foto." },
        { status: 400 },
      );
    }

    const imgsJson = JSON.stringify(savedImageUrls);

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO ruangan (name, capacity, description, type, floor, status, imgs) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, capacity, description, type, floor, status, imgsJson],
    );

    return NextResponse.json({
      success: true,
      message: "Berhasil menambahkan ruangan baru!",
      insertId: result.insertId,
    });
  } catch (error: any) {
    console.error("POST Ruangan Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 },
    );
  }
}

// 3. PUT: Update data ruangan
export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get("id");
    const name = formData.get("name") || "";

    const rawCapacity = formData.get("capacity") || "0";
    const capacity = parseInt(String(rawCapacity).replace(/\D/g, "")) || 0;

    const description = formData.get("description") || "";
    const type = formData.get("type") || "rapat";
    const floor = formData.get("floor") || "Lantai 2";
    const status = formData.get("status") || "Tersedia";

    const existingImgsRaw = formData.get("existingImgs");
    let savedImageUrls: string[] = [];
    if (existingImgsRaw) {
      try {
        savedImageUrls = JSON.parse(String(existingImgsRaw)).filter(Boolean);
      } catch {
        savedImageUrls = [];
      }
    }

    const files = formData.getAll("images") as File[];
    if (files && files.length > 0) {
      const uploadDir = path.join(process.cwd(), "public/uploads/rooms");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const file of files) {
        if (file && typeof file === "object" && file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, "_")}`;
          const filepath = path.join(uploadDir, filename);

          fs.writeFileSync(filepath, buffer);
          savedImageUrls.push(`/uploads/rooms/${filename}`);
        }
      }
    }

    if (savedImageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ruangan wajib memiliki minimal 1 foto." },
        { status: 400 },
      );
    }

    const imgsJson = JSON.stringify(savedImageUrls);

    await db.query<ResultSetHeader>(
      "UPDATE ruangan SET name = ?, capacity = ?, description = ?, type = ?, floor = ?, status = ?, imgs = ? WHERE id = ?",
      [name, capacity, description, type, floor, status, imgsJson, id],
    );

    return NextResponse.json({
      success: true,
      message: "Berhasil memperbarui data ruangan!",
    });
  } catch (error: any) {
    console.error("PUT Ruangan Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 },
    );
  }
}
