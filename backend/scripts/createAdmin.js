#!/usr/bin/env node
import db from "../config/db.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const username = args[0];
  const password = args[1];
  const hoTen = args[2] || "Quản Trị Viên";
  const email = args[3] || "admin@example.com";

  if (!username || !password) {
    console.error("Usage: node createAdmin.js <username> <password> [hoTen] [email]");
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const schema = process.env.DB_NAME || "quanlycuahang";
    const [colsRows] = await db.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'taikhoan'",
      [schema]
    );
    const cols = colsRows.map((r) => r.COLUMN_NAME.toLowerCase());
    let roleCol = null;
    if (cols.includes("vai_tro")) roleCol = "vai_tro";
    else if (cols.includes("role")) roleCol = "role";

    if (!roleCol) {
      console.log("Column 'vai_tro' or 'role' not found on 'taikhoan'. Adding 'vai_tro' column...");
      await db.query("ALTER TABLE taikhoan ADD COLUMN vai_tro VARCHAR(50) NULL");
      roleCol = "vai_tro";
      console.log("Added column 'vai_tro'.");
    }

    const [rows] = await db.query("SELECT * FROM taikhoan WHERE ten_dang_nhap = ?", [username]);
    if (rows.length > 0) {
      console.log("User exists. Updating password and role to admin...");
      await db.query(
        `UPDATE taikhoan SET mat_khau = ?, ho_ten = ?, email = ?, \`${roleCol}\` = ? WHERE ten_dang_nhap = ?`,
        [hash, hoTen, email, "admin", username]
      );
      console.log(`Updated user '${username}' as admin.`);
    } else {
      console.log("Creating new admin user...");
      await db.query(
        `INSERT INTO taikhoan (ten_dang_nhap, mat_khau, ho_ten, email, \`${roleCol}\`) VALUES (?, ?, ?, ?, ?)`,
        [username, hash, hoTen, email, "admin"]
      );
      console.log(`Created admin user '${username}'.`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(2);
  }
}

main();
