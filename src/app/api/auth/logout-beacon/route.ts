import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    let userId;

    // Menangani format data yang dikirim oleh navigator.sendBeacon (bisa berupa text string JSON)
    const contentType = request.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const body = await request.json();
      userId = body?.userId;
    } else {
      const text = await request.text();
      if (text) {
        const parsed = JSON.parse(text);
        userId = parsed?.userId;
      }
    }

    if (userId) {
      // Kosongkan sesi di database berdasarkan ID user yang dikirim saat tab ditutup paksa
      await db.$queryRaw`
        UPDATE users 
        SET current_session_token = NULL, last_active_at = NULL 
        WHERE id = ${Number(userId)}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Beacon logout berhasil diproses",
    });
  } catch (error: any) {
    console.error("Logout Beacon Error:", error);
    // Menggunakan status 200/OK agar tidak memicu error log yang mengganggu di konsol browser saat tab ditutup
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 },
    );
  }
}
