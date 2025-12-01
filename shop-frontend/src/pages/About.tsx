import React from "react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* HERO SECTION */}
      <section className="relative w-full h-[60vh] md:h-[70vh] flex flex-col justify-end overflow-hidden">
        <img
          src="/images/about-hero.jpg"
          alt="Giới thiệu Bếp Mầm"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 bg-black/50 w-full text-center text-white p-6 md:p-12">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Về Bếp Mầm
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl max-w-2xl mx-auto"
          >
            Mang đến trải nghiệm sữa hạt nguyên chất, tươi ngon mỗi ngày cho mọi gia đình.
          </motion.p>
        </div>
      </section>

      {/* GIỚI THIỆU NỘI DUNG */}
      <section className="w-full max-w-5xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Sứ mệnh & Giá trị</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-4">
            Bếp Mầm ra đời với sứ mệnh mang lại những sản phẩm sữa hạt tươi nguyên chất, đảm bảo chất lượng, dinh dưỡng và an toàn cho sức khỏe. Chúng tôi tin rằng mỗi ly sữa là một trải nghiệm tận hưởng sự tinh túy từ thiên nhiên.
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Chất lượng: Nguyên liệu sạch, quy trình chuẩn.</li>
            <li>Sáng tạo: Đa dạng sản phẩm, hương vị độc đáo.</li>
            <li>Khách hàng: Luôn đặt trải nghiệm khách hàng lên hàng đầu.</li>
            <li>Bền vững: Cam kết thân thiện với môi trường.</li>
          </ul>
        </motion.div>
      </section>

      {/* HÌNH ẢNH TEAM / CỬA HÀNG */}
      <section className="w-full max-w-6xl px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {["team1.jpg", "team2.jpg", "store.jpg"].map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="overflow-hidden rounded-2xl shadow-lg"
          >
            <img
              src={`/images/${img}`}
              alt="Hình Bếp Mầm"
              className="w-full h-64 object-cover transition-transform duration-500 hover:scale-110"
            />
          </motion.div>
        ))}
      </section>

      {/* LỊCH SỬ / TIMELINE (OPTIONAL) */}
      <section className="w-full max-w-5xl px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-bold mb-8 text-center"
        >
          Hành trình phát triển
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-10"
        >
          <ul className="space-y-4 text-gray-700">
            <li><strong>2018:</strong> Thành lập Bếp Mầm với cửa hàng đầu tiên tại Hà Nội.</li>
            <li><strong>2019:</strong> Ra mắt sản phẩm sữa hạt óc chó và nước detox.</li>
            <li><strong>2021:</strong> Mở rộng cửa hàng, phục vụ khách hàng văn phòng và gia đình.</li>
            <li><strong>2023:</strong> Chuỗi Bếp Mầm phát triển mạnh với dịch vụ online và offline.</li>
          </ul>
        </motion.div>
      </section>

      <div className="h-20" />
    </div>
  );
}
