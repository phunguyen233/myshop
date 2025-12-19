import db from "../config/db.js";

export const addReceipt = async (req, res) => {
  try {
    const { ma_nguyen_lieu } = req.params;
    const { so_luong_nhap, don_vi_id, don_gia } = req.body;
    if (!ma_nguyen_lieu || so_luong_nhap == null || don_vi_id == null) return res.status(400).json({ message: "Thiếu thông tin phiếu nhập" });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lấy thông tin đơn vị lưu trữ của nguyên liệu, hệ số quy đổi và giá tổng hiện tại trên danh sách nguyên liệu
      const [nlRows] = await connection.query(
        `SELECT nl.don_vi_id AS nl_don_vi_id, d.he_so_quy_doi AS nl_he_so, din.he_so_quy_doi AS incoming_he_so, nl.gia_nhap AS master_total_price, nl.so_luong_ton AS master_total_qty
         FROM nguyenlieu nl
         LEFT JOIN donvi d ON nl.don_vi_id = d.id
         LEFT JOIN donvi din ON din.id = ?
         WHERE nl.ma_nguyen_lieu = ?`,
        [don_vi_id, ma_nguyen_lieu]
      );

      const info = nlRows && nlRows[0] ? nlRows[0] : null;
      // Nếu không có thông tin đơn vị, fallback: cộng trực tiếp
      let converted = Number(so_luong_nhap);
      const toNumber = v => Number(v) || 0;
      const incoming_he_so = toNumber(info?.incoming_he_so);
      if (info && info.nl_he_so != null && info.incoming_he_so != null) {
        // Chuyển số lượng nhập (theo đơn vị incoming) về đơn vị của nguyên liệu (stored unit)
        // công thức: converted = so_luong_nhap * incoming_he_so / nl_he_so
        const nl_he_so = toNumber(info.nl_he_so) || 1;
        converted = (toNumber(so_luong_nhap) * incoming_he_so) / nl_he_so;
      }

      // Tính tổng tiền của phiếu nhập dựa trên giá tổng ở danh sách nguyên liệu
      // công thức: totalCost = (converted / master_total_qty) * master_total_price
      const masterTotalQty = toNumber(info?.master_total_qty);
      const masterTotalPrice = toNumber(info?.master_total_price);
      let totalCost = 0;
      if (masterTotalQty > 0) {
        totalCost = (converted / masterTotalQty) * masterTotalPrice;
      }

      // đơn giá theo đơn vị incoming = totalCost / so_luong_nhap
      const computedDonGia = toNumber(so_luong_nhap) > 0 ? (totalCost / toNumber(so_luong_nhap)) : 0;

      // Lưu phiếu nhập với don_gia đã tính (don_gia lưu là đơn giá theo đơn vị nhập)
      const [ins] = await connection.query(
        "INSERT INTO nhapkho_nguyenlieu (ma_nguyen_lieu, so_luong_nhap, don_vi_id, don_gia, ngay_nhap) VALUES (?, ?, ?, ?, NOW())",
        [ma_nguyen_lieu, so_luong_nhap, don_vi_id, computedDonGia]
      );

      // Theo yêu cầu: chỉ lưu phiếu nhập vào `nhapkho_nguyenlieu` (kho),
      // không cập nhật trực tiếp `nguyenlieu.so_luong_ton` (danh sách nguyên liệu) và không ghi `lichsu_tonkho`.

      // compute total for this receipt (stored unit price already computed as computedDonGia)
      const tong_tien = totalCost;

      // compute aggregate inventory total from ingredient receipts (sum of so_luong_nhap * don_gia)
      const [[aggRow]] = await connection.query(
        `SELECT COALESCE(SUM(so_luong_nhap * don_gia),0) AS inventory_total FROM nhapkho_nguyenlieu`
      );
      const inventoryTotal = Number(aggRow?.inventory_total || 0);

      await connection.commit();
      // return computed unit price, receipt total and aggregate inventory total
      res.status(201).json({ message: "Nhập kho nguyên liệu thành công", id: ins.insertId, don_gia: computedDonGia, tong_tien, inventoryTotal });
    } catch (e) {
      await connection.rollback();
      console.error(e);
      res.status(500).json({ message: "Lỗi khi nhập kho nguyên liệu" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getReceiptsByIngredient = async (req, res) => {
  try {
    const { ma_nguyen_lieu } = req.params;
    const [rows] = await db.query("SELECT * FROM nhapkho_nguyenlieu WHERE ma_nguyen_lieu = ? ORDER BY ngay_nhap DESC", [ma_nguyen_lieu]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy phiếu nhập" });
  }
};

export const updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { so_luong_nhap, don_vi_id, don_gia } = req.body;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [[existing]] = await connection.query("SELECT * FROM nhapkho_nguyenlieu WHERE id = ?", [id]);
      if (!existing) return res.status(404).json({ message: 'Phiếu nhập không tồn tại' });

      const ma_nguyen_lieu = existing.ma_nguyen_lieu;

      // get unit conversion info for stored unit and for old/new incoming units
      const [nlRows] = await connection.query(
        `SELECT nl.don_vi_id AS nl_don_vi_id, d.he_so_quy_doi AS nl_he_so, dold.he_so_quy_doi AS old_incoming_he_so, dnew.he_so_quy_doi AS new_incoming_he_so, nl.gia_nhap AS master_total_price, nl.so_luong_ton AS master_total_qty
         FROM nguyenlieu nl
         LEFT JOIN donvi d ON nl.don_vi_id = d.id
         LEFT JOIN donvi dold ON dold.id = ?
         LEFT JOIN donvi dnew ON dnew.id = ?
         WHERE nl.ma_nguyen_lieu = ?`,
        [existing.don_vi_id, don_vi_id, ma_nguyen_lieu]
      );

      const info = nlRows && nlRows[0] ? nlRows[0] : null;

      const toNumber = v => Number(v) || 0;
      // convert old incoming -> stored
      let oldConverted = toNumber(existing.so_luong_nhap);
      if (info && info.nl_he_so && info.old_incoming_he_so) {
        oldConverted = (toNumber(existing.so_luong_nhap) * toNumber(info.old_incoming_he_so)) / toNumber(info.nl_he_so);
      }
      // convert new incoming -> stored
      let newConverted = toNumber(so_luong_nhap);
      if (info && info.nl_he_so && info.new_incoming_he_so) {
        newConverted = (toNumber(so_luong_nhap) * toNumber(info.new_incoming_he_so)) / toNumber(info.nl_he_so);
      }

      const diff = newConverted - oldConverted;

      // Theo yêu cầu: khi cập nhật phiếu nhập, không thay đổi `nguyenlieu.so_luong_ton`.
      // Chỉ cập nhật thông tin trong `nhapkho_nguyenlieu` dưới (phần cập nhật receipt row bên dưới).

      // compute new don_gia based on master total price/qty
      const masterTotalQty = toNumber(nlRows[0]?.master_total_qty);
      const masterTotalPrice = toNumber(nlRows[0]?.master_total_price);
      let totalCost = 0;
      if (masterTotalQty > 0) {
        totalCost = (newConverted / masterTotalQty) * masterTotalPrice;
      }
      const computedDonGia = toNumber(so_luong_nhap) > 0 ? (totalCost / toNumber(so_luong_nhap)) : 0;

      // update receipt row
      await connection.query("UPDATE nhapkho_nguyenlieu SET so_luong_nhap = ?, don_vi_id = ?, don_gia = ? WHERE id = ?", [so_luong_nhap, don_vi_id, computedDonGia, id]);

      await connection.commit();
      res.json({ message: 'Cập nhật phiếu nhập thành công' });
    } catch (e) {
      await connection.rollback();
      console.error(e);
      res.status(500).json({ message: 'Lỗi khi cập nhật phiếu nhập' });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[existing]] = await connection.query("SELECT * FROM nhapkho_nguyenlieu WHERE id = ?", [id]);
      if (!existing) return res.status(404).json({ message: 'Phiếu nhập không tồn tại' });

      const ma_nguyen_lieu = existing.ma_nguyen_lieu;

      // get conversion info to compute stored qty
      const [nlRows] = await connection.query(
        `SELECT d.he_so_quy_doi AS nl_he_so, din.he_so_quy_doi AS incoming_he_so
         FROM nguyenlieu nl
         LEFT JOIN donvi d ON nl.don_vi_id = d.id
         LEFT JOIN donvi din ON din.id = ?
         WHERE nl.ma_nguyen_lieu = ?`,
        [existing.don_vi_id, ma_nguyen_lieu]
      );
      const info = nlRows && nlRows[0] ? nlRows[0] : null;
      const toNumber = v => Number(v) || 0;
      let converted = toNumber(existing.so_luong_nhap);
      if (info && info.nl_he_so && info.incoming_he_so) {
        converted = (toNumber(existing.so_luong_nhap) * toNumber(info.incoming_he_so)) / toNumber(info.nl_he_so);
      }

      // Theo yêu cầu: khi xóa phiếu nhập, không thay đổi `nguyenlieu.so_luong_ton`.
      // Chỉ xóa dòng trong `nhapkho_nguyenlieu`.
      await connection.query("DELETE FROM nhapkho_nguyenlieu WHERE id = ?", [id]);

      await connection.commit();
      res.json({ message: 'Xóa phiếu nhập thành công' });
    } catch (e) {
      await connection.rollback();
      console.error(e);
      res.status(500).json({ message: 'Lỗi khi xóa phiếu nhập' });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
