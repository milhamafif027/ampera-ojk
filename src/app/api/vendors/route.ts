import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "ampera_db",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category"); // 'snack' atau 'katering'

    const connection = await mysql.createConnection(dbConfig);

    let query = "SELECT * FROM vendors";
    let params: any[] = [];

    if (category) {
      query += " WHERE category = ?";
      params.push(category);
    }

    const [rows] = await connection.execute(query, params);
    await connection.end();

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Gagal mengambil data vendor:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
