import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_changed_for_dev_only";

export default function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, JWT_SECRET);
    // payload may contain role if login included it
    const role = payload.role || payload.vai_tro || "";
    const normalize = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
    const roleNorm = normalize(role);
    const isAdmin = roleNorm.includes("admin") || roleNorm.includes("quan") || payload.ten_dang_nhap === "admin";
    if (!isAdmin) return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    // attach user info to request for handlers
    req.user = payload;
    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}
