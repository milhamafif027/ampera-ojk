import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase Client untuk Storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper baru: Menangani upload file gambar langsung ke Supabase Storage (Cloud)
async function handleImageUploads(formData: FormData): Promise<string[]> {
  const files = formData.getAll("images") as File[];
  const savedImageUrls: string[] = [];

  if (files && files.length > 0) {
    for (const file of files) {
      if (file && typeof file === "object" && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = `rooms/${uniqueSuffix}-${file.name.replace(/\s+/g, "_")}`;

        // Upload ke Supabase Storage Bucket ('room-images')
        const { data, error } = await supabase.storage
          .from("room-images") // <-- Ganti dengan nama bucket Anda di Supabase
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          console.error("Supabase Storage Upload Error:", error.message);
          continue;
        }

        // Ambil Public URL dari file yang berhasil di-upload
        const { data: publicUrlData } = supabase.storage
          .from("room-images")
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          savedImageUrls.push(publicUrlData.publicUrl);
        }
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
    const capacity = String(formData.get("capacity") || "30 Orang");
    const description = String(formData.get("description") || "");
    const type = String(formData.get("type") || "rapat");
    const floor = String(formData.get("floor") || "Lantai 2");
    const status = String(formData.get("status") || "Tersedia");

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
    const capacity = String(formData.get("capacity") || "30 Orang");
    const description = String(formData.get("description") || "");
    const type = String(formData.get("type") || "rapat");
    const floor = String(formData.get("floor") || "Lantai 2");
    const status = String(formData.get("status") || "Tersedia");

    const existingImgsRaw = formData.get("existingImgs");
    let savedImageUrls: string[] = [];
    if (existingImgsRaw) {
      try {
        savedImageUrls = JSON.parse(String(existingImgsRaw)).filter(Boolean);
      } catch {
        savedImageUrls = [];
      }
    }

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
