import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "ampera_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
