import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// PUT: Memperbarui data pengguna berdasarkan ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionCookie = req.cookies.get("session_token")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const body = await req.json();
    const { name, email, role, dept, phone, password } = body;

    if (!userId || !name || !email || !role) {
      return NextResponse.json(
        { success: false, message: "ID, Nama, Email, dan Role wajib diisi." },
        { status: 400 },
      );
    }

    const uId = Number(userId);

    // Cek apakah password diisi (jika admin ingin mengganti password user)
    if (password && password.trim() !== "" && password !== "••••••••••••") {
      await db.$executeRaw`
        UPDATE users 
        SET name = ${name}, 
            email = ${email}, 
            role = ${role}, 
            dept = ${dept || "OJK Sumsel"}, 
            phone = ${phone || null},
            password = ${password}
        WHERE id = ${uId}
      `;
    } else {
      // Update tanpa mengubah password jika tidak diisi atau bernilai placeholder
      await db.$executeRaw`
        UPDATE users 
        SET name = ${name}, 
            email = ${email}, 
            role = ${role}, 
            dept = ${dept || "OJK Sumsel"}, 
            phone = ${phone || null}
        WHERE id = ${uId}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Informasi akun berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Update User Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal memperbarui data akun",
      },
      { status: 500 },
    );
  }
}

// DELETE: Menghapus pengguna berdasarkan ID (Opsional jika diperlukan di manajemen user)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionCookie = req.cookies.get("session_token")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const userId = Number(resolvedParams.id);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ID user tidak valid." },
        { status: 400 },
      );
    }

    await db.$executeRaw`
      DELETE FROM users WHERE id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: "Akun pengguna berhasil dihapus dari sistem.",
    });
  } catch (error: any) {
    console.error("Delete User Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menghapus akun." },
      { status: 500 },
    );
  }
}
