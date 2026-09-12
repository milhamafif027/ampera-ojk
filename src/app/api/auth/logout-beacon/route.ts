import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      // Kosongkan sesi di database berdasarkan session_token yang sedang aktif
      await db.$queryRaw`
        UPDATE users 
        SET current_session_token = NULL, last_active_at = NULL 
        WHERE current_session_token = ${sessionToken}
      `;
    }

    // Hapus cookie
    const response = NextResponse.json({
      success: true,
      message: "Berhasil keluar",
    });
    response.cookies.set({
      name: "session_token",
      value: "",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
