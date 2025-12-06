// controllers/paymentController.js
import db from "../config/db.js";

export const generateQR = (req, res) => {
  const { amount, info } = req.query;

  if (!amount || !info) {
    return res.status(400).json({
      message: "amount và info là bắt buộc",
    });
  }

  const bank = "970422"; // MB Bank
  const account = "0945079155";

  const qrUrl = `https://img.vietqr.io/image/${bank}-${account}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(
    info
  )}`;

  res.json({
    success: true,
    qrUrl,
  });
};

// Hủy đơn hàng: cập nhật trạng_thai = 'huy' và hoàn trả tồn kho
export const cancelOrder = async (req, res) => {
  const { ma_don_hang } = req.body;

  if (!ma_don_hang) return res.status(400).json({ message: "Thiếu ma_don_hang" });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [[orderRow]] = await connection.query("SELECT trang_thai FROM donhang WHERE ma_don_hang = ?", [ma_don_hang]);
    if (!orderRow) {
      await connection.rollback();
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (orderRow.trang_thai === "huy") {
      await connection.rollback();
      return res.status(400).json({ message: "Đơn hàng đã bị hủy" });
    }

    // Per requirement: cancelling an order will NOT restore stock.
    // Only set order status to 'huy'. Stock is adjusted only when an order reaches 'hoan_tat'.
    await connection.query("UPDATE donhang SET trang_thai = 'huy' WHERE ma_don_hang = ?", [ma_don_hang]);

    await connection.commit();
    res.json({ success: true, message: "Hủy đơn thành công" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Lỗi khi hủy đơn" });
  } finally {
    connection.release();
  }
};
