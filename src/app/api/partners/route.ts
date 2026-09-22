import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";

// 1. GET: Mengambil daftar partner (Dibuka untuk publik agar tidak 401)
export async function GET(request: NextRequest) {
  try {
    const rows = await db.$queryRaw`
      SELECT * FROM partners ORDER BY id ASC
    `;
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 2. POST: Tambah Partner Baru (Tetap Diamankan)
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session_token")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const stars = formData.get("stars") as string;
    const area = formData.get("area") as string;
    const phone = formData.get("phone") as string;
    const contact_name = formData.get("contact_name") as string; // <-- Tangkap contact_name
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

    const starNum = Number(stars) || 4;

    const result: any = await db.$queryRaw`
      INSERT INTO partners (name, stars, area, phone, contact_name, address, description, img) 
      VALUES (${name}, ${starNum}, ${area}, ${phone}, ${contact_name || ""}, ${address || ""}, ${description || ""}, ${imagePath || ""})
      RETURNING id
    `;

    return NextResponse.json({ success: true, insertId: result[0]?.id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 3. PUT: Edit Partner (Tetap Diamankan)
export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session_token")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const stars = formData.get("stars") as string;
    const area = formData.get("area") as string;
    const phone = formData.get("phone") as string;
    const contact_name = formData.get("contact_name") as string; // <-- Tangkap contact_name
    const address = formData.get("address") as string;
    const description = formData.get("description") as string;
    const file = formData.get("image") as File | null;

    const starNum = Number(stars) || 4;
    const partnerId = Number(id);

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const uploadDir = path.join(process.cwd(), "public/uploads");
      await writeFile(path.join(uploadDir, filename), buffer);
      const imagePath = `/uploads/${filename}`;

      await db.$executeRaw`
        UPDATE partners 
        SET name = ${name}, stars = ${starNum}, area = ${area}, phone = ${phone}, contact_name = ${contact_name || ""}, address = ${address || ""}, description = ${description || ""}, img = ${imagePath}
        WHERE id = ${partnerId}
      `;
    } else {
      await db.$executeRaw`
        UPDATE partners 
        SET name = ${name}, stars = ${starNum}, area = ${area}, phone = ${phone}, contact_name = ${contact_name || ""}, address = ${address || ""}, description = ${description || ""}
        WHERE id = ${partnerId}
      `;
    }

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

// 4. DELETE: Hapus Partner (Tetap Diamankan)
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session_token")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tidak ditemukan" },
        { status: 400 },
      );
    }

    await db.$executeRaw`DELETE FROM partners WHERE id = ${Number(id)}`;

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
