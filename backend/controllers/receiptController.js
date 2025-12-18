import db from "../config/db.js";

export const addReceipt = async (req, res) => {
  try {
    const { ma_nguyen_lieu } = req.params;
    const { so_luong_nhap, don_vi_id, don_gia } = req.body;
    if (!ma_nguyen_lieu || so_luong_nhap == null || don_vi_id == null) return res.status(400).json({ message: "Thiếu thông tin phiếu nhập" });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [ins] = await connection.query(
        "INSERT INTO nhapkho_nguyenlieu (ma_nguyen_lieu, so_luong_nhap, don_vi_id, don_gia, ngay_nhap) VALUES (?, ?, ?, ?, NOW())",
        [ma_nguyen_lieu, so_luong_nhap, don_vi_id, don_gia || 0]
      );

      // Lấy thông tin đơn vị lưu trữ của nguyên liệu và hệ số quy đổi
      const [nlRows] = await connection.query(
        `SELECT nl.don_vi_id AS nl_don_vi_id, d.he_so_quy_doi AS nl_he_so, din.he_so_quy_doi AS incoming_he_so
         FROM nguyenlieu nl
         LEFT JOIN donvi d ON nl.don_vi_id = d.id
         LEFT JOIN donvi din ON din.id = ?
         WHERE nl.ma_nguyen_lieu = ?`,
        [don_vi_id, ma_nguyen_lieu]
      );

      const info = nlRows && nlRows[0] ? nlRows[0] : null;
      // Nếu không có thông tin đơn vị, fallback: cộng trực tiếp
      let converted = Number(so_luong_nhap);
      if (info && info.nl_he_so && info.incoming_he_so) {
        // Chuyển số lượng nhập (theo đơn vị incoming) về đơn vị của nguyên liệu
        // công thức: converted = so_luong_nhap * incoming_he_so / nl_he_so
        const nl_he_so = Number(info.nl_he_so) || 1;
        const incoming_he_so = Number(info.incoming_he_so) || 1;
        converted = (Number(so_luong_nhap) * incoming_he_so) / nl_he_so;
      }

      // Tăng tồn kho nguyên liệu bằng lượng đã quy đổi về đơn vị lưu trữ
      await connection.query("UPDATE nguyenlieu SET so_luong_ton = so_luong_ton + ? WHERE ma_nguyen_lieu = ?", [converted, ma_nguyen_lieu]);

      // Ghi lich su ton kho (nếu có bảng lichsu_tonkho) - ghi lượng đã quy đổi
      await connection.query(
        "INSERT INTO lichsu_tonkho (ma_san_pham, so_luong_thay_doi, ly_do, ngay_thay_doi) VALUES (?, ?, ?, NOW())",
        [ma_nguyen_lieu, converted, `Nhập kho nguyên liệu (phiếu ${ins.insertId})`]
      );

      // Lưu tổng tiền của phiếu nhập (tùy ý): tính theo đơn giá nhập được cung cấp quy đổi về đơn vị lưu trữ
      let unitPricePerStored = Number(don_gia) || 0;
      if (info && info.nl_he_so && info.incoming_he_so) {
        const nl_he_so = Number(info.nl_he_so) || 1;
        const incoming_he_so = Number(info.incoming_he_so) || 1;
        unitPricePerStored = (Number(don_gia) * incoming_he_so) / nl_he_so;
      }
      const totalCost = unitPricePerStored * Number(converted || 0);
      // NOTE: theo cơ chế mới, giá trên danh sách nguyên liệu (`nguyenlieu.gia_nhap`) là giá cố định trên 1kg
      // nên chúng ta không cập nhật `nguyenlieu.gia_nhap` khi nhập kho. Giá nhập chi tiết được lưu trong `nhapkho_nguyenlieu.don_gia`.

      await connection.commit();
      res.status(201).json({ message: "Nhập kho nguyên liệu thành công", id: ins.insertId });
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
        `SELECT nl.don_vi_id AS nl_don_vi_id, d.he_so_quy_doi AS nl_he_so, dold.he_so_quy_doi AS old_incoming_he_so, dnew.he_so_quy_doi AS new_incoming_he_so
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

      // update stock
      if (diff !== 0) {
        await connection.query("UPDATE nguyenlieu SET so_luong_ton = so_luong_ton + ? WHERE ma_nguyen_lieu = ?", [diff, ma_nguyen_lieu]);
        await connection.query("INSERT INTO lichsu_tonkho (ma_san_pham, so_luong_thay_doi, ly_do, ngay_thay_doi) VALUES (?, ?, ?, NOW())", [ma_nguyen_lieu, diff, `Cập nhật phiếu nhập (#${id})`]);
      }

      // update receipt row
      await connection.query("UPDATE nhapkho_nguyenlieu SET so_luong_nhap = ?, don_vi_id = ?, don_gia = ? WHERE id = ?", [so_luong_nhap, don_vi_id, don_gia || 0, id]);

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

      // subtract from stock
      await connection.query("UPDATE nguyenlieu SET so_luong_ton = so_luong_ton - ? WHERE ma_nguyen_lieu = ?", [converted, ma_nguyen_lieu]);
      await connection.query("INSERT INTO lichsu_tonkho (ma_san_pham, so_luong_thay_doi, ly_do, ngay_thay_doi) VALUES (?, ?, ?, NOW())", [ma_nguyen_lieu, -converted, `Xóa phiếu nhập (#${id})`]);

      // delete receipt
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
