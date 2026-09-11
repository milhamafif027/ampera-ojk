import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.userId;

    if (!userId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Kosongkan sesi seketika saat browser/tab ditutup tanpa tombol logout
    await db.$queryRaw`
      UPDATE users 
      SET current_session_token = NULL, last_active_at = NULL 
      WHERE id = ${Number(userId)}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
