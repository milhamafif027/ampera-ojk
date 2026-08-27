import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

// Helper untuk menangani proses upload file gambar ruangan
async function handleImageUploads(formData: FormData): Promise<string[]> {
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
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, "_")}`;
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);
        savedImageUrls.push(`/uploads/rooms/${filename}`);
      }
    }
  }

  return savedImageUrls;
}

// 1. GET: Ambil daftar ruangan
export async function GET() {
  try {
    const rows = await db.$queryRaw`
      SELECT * FROM ruangan ORDER BY id DESC
    `;
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
    const name = String(formData.get("name") || "");

    const rawCapacity = formData.get("capacity") || "0";
    const capacity = parseInt(String(rawCapacity).replace(/\D/g, "")) || 0;

    const description = String(formData.get("description") || "");
    const type = String(formData.get("type") || "rapat");
    const floor = String(formData.get("floor") || "Lantai 2");
    const status = String(formData.get("status") || "Tersedia");

    // Proses upload gambar menggunakan helper
    const newImageUrls = await handleImageUploads(formData);

    if (newImageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ruangan wajib memiliki minimal 1 foto." },
        { status: 400 },
      );
    }

    const imgsJson = JSON.stringify(newImageUrls);

    const result: any = await db.$queryRaw`
      INSERT INTO ruangan (name, capacity, description, type, floor, status, imgs) 
      VALUES (${name}, ${capacity}, ${description}, ${type}, ${floor}, ${status}, ${imgsJson})
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      message: "Berhasil menambahkan ruangan baru!",
      insertId: result[0]?.id,
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

    // Validasi keberadaan ID untuk mencegah update data yang salah
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID ruangan diperlukan untuk melakukan update.",
        },
        { status: 400 },
      );
    }

    const roomId = Number(id);
    const name = String(formData.get("name") || "");
    const rawCapacity = formData.get("capacity") || "0";
    const capacity = parseInt(String(rawCapacity).replace(/\D/g, "")) || 0;

    const description = String(formData.get("description") || "");
    const type = String(formData.get("type") || "rapat");
    const floor = String(formData.get("floor") || "Lantai 2");
    const status = String(formData.get("status") || "Tersedia");

    // Ambil gambar lama yang dipertahankan dari frontend
    const existingImgsRaw = formData.get("existingImgs");
    let savedImageUrls: string[] = [];
    if (existingImgsRaw) {
      try {
        savedImageUrls = JSON.parse(String(existingImgsRaw)).filter(Boolean);
      } catch {
        savedImageUrls = [];
      }
    }

    // Tambahkan gambar baru (jika ada yang di-upload)
    const newImageUrls = await handleImageUploads(formData);
    savedImageUrls = [...savedImageUrls, ...newImageUrls];

    if (savedImageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ruangan wajib memiliki minimal 1 foto." },
        { status: 400 },
      );
    }

    const imgsJson = JSON.stringify(savedImageUrls);

    await db.$executeRaw`
      UPDATE ruangan 
      SET name = ${name}, capacity = ${capacity}, description = ${description}, type = ${type}, floor = ${floor}, status = ${status}, imgs = ${imgsJson} 
      WHERE id = ${roomId}
    `;

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
