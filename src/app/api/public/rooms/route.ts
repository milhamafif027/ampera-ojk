import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "ampera_db", 
};

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Mengambil data dari tabel ruangan yang sudah ada
    const [rows] = await connection.execute("SELECT * FROM ruangan");
    await connection.end();

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("DETAIL ERROR API PUBLIC ROOMS:", error.message);
    return NextResponse.json(
      { success: false, message: error.message, data: [] },
      { status: 500 },
    );
  }
}
