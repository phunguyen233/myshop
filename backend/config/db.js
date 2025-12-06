import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Tieuvu2386',
  database: process.env.DB_NAME || 'quanlycuahang',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.on('error', (err) => {
  console.error("❌ Lỗi kết nối pool:", err);
});

console.log("✅ MySQL Pool đã khởi tạo!");

export default pool;
