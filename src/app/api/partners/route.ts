import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabaseStorage"; // Pastikan path import ini sesuai dengan letak file client supabase Anda

// 1. GET: Mengambil daftar partner
export async function GET(request: NextRequest) {
  try {
    const rows = await db.$queryRaw`
      SELECT id, name, stars, area, phone, contact_name, address, description, img 
      FROM partners 
      ORDER BY id ASC
    `;
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 2. POST: Tambah Partner Baru (Upload ke Supabase Storage)
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
    const contact_name = formData.get("contact_name") as string;
    const address = formData.get("address") as string;
    const description = formData.get("description") as string;
    const file = formData.get("image") as File | null;

    let imagePath = "";
    if (file && file instanceof File && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

      // Upload ke Supabase Storage bucket 'PARTNERS_IMG'
      const { error: uploadError } = await supabase.storage
        .from("PARTNERS_IMG")
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(
          `Gagal upload gambar ke Supabase: ${uploadError.message}`,
        );
      }

      // Ambil Public URL
      const { data: publicURLData } = supabase.storage
        .from("PARTNERS_IMG")
        .getPublicUrl(filename);

      imagePath = publicURLData.publicUrl;
    }

    const starNum = Number(stars) || 4;

    const result: any = await db.$queryRaw`
      INSERT INTO partners (name, stars, area, phone, contact_name, address, description, img) 
      VALUES (${name}, ${starNum}, ${area}, ${phone}, ${contact_name || ""}, ${address || ""}, ${description || ""}, ${imagePath})
      RETURNING id
    `;

    return NextResponse.json({ success: true, insertId: result[0]?.id });
  } catch (error: any) {
    console.error("API POST PARTNERS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 3. PUT: Edit Partner (Upload gambar baru ke Supabase Storage jika ada)
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
    const contact_name = formData.get("contact_name") as string;
    const address = formData.get("address") as string;
    const description = formData.get("description") as string;
    const file = formData.get("image") as File | null;

    const starNum = Number(stars) || 4;
    const partnerId = Number(id);

    if (file && file instanceof File && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

      const { error: uploadError } = await supabase.storage
        .from("PARTNERS_IMG")
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(
          `Gagal upload gambar ke Supabase: ${uploadError.message}`,
        );
      }

      const { data: publicURLData } = supabase.storage
        .from("PARTNERS_IMG")
        .getPublicUrl(filename);

      const imagePath = publicURLData.publicUrl;

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
    console.error("API PUT PARTNERS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 4. DELETE: Hapus Partner
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
