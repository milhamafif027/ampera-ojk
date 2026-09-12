import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      // 1. Kosongkan session token dan waktu aktif di database berdasarkan token cookie yang aktif
      await db.$queryRaw`
        UPDATE users 
        SET current_session_token = NULL, last_active_at = NULL 
        WHERE current_session_token = ${sessionToken}
      `;
    }

    // 2. Buat respons sukses
    const response = NextResponse.json({
      success: true,
      message: "Berhasil keluar dan membersihkan sesi.",
    });

    // 3. Hapus cookie session_token dari browser secara mutlak
    response.cookies.set({
      name: "session_token",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
