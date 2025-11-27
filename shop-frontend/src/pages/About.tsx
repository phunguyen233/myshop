import React from "react";

export default function About() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold mb-6">Giới thiệu về MyShop</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Chúng tôi là ai?</h2>
          <p className="text-gray-700 leading-relaxed">
            MyShop là một nền tảng thương mại điện tử hàng đầu, cung cấp các sản phẩm chất lượng cao với giá cả phải chăng. 
            Chúng tôi cam kết mang đến cho khách hàng trải nghiệm mua sắm tốt nhất và dịch vụ khách hàng xuất sắc.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Sứ mệnh của chúng tôi</h2>
          <p className="text-gray-700 leading-relaxed">
            Sứ mệnh của MyShop là cung cấp các sản phẩm uy tín, được kiểm chứa chất lượng, và giao hàng nhanh chóng 
            đến khắp mọi nơi. Chúng tôi luôn lắng nghe ý kiến của khách hàng để cải thiện dịch vụ từng ngày.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Tại sao chọn MyShop?</h2>
          <ul className="text-gray-700 space-y-3 list-disc list-inside">
            <li>Sản phẩm chất lượng cao và giá cả cạnh tranh</li>
            <li>Giao hàng nhanh chóng và an toàn</li>
            <li>Dịch vụ khách hàng 24/7 sẵn sàng hỗ trợ</li>
            <li>Chính sách hoàn trả linh hoạt và công bằng</li>
            <li>Thanh toán an toàn với nhiều phương thức</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Liên hệ với chúng tôi</h2>
          <p className="text-gray-700">
            Nếu bạn có bất kỳ câu hỏi hay cần hỗ trợ, vui lòng liên hệ với chúng tôi qua:
          </p>
          <div className="mt-4 text-gray-700">
            <p><strong>Email:</strong> support@myshop.com</p>
            <p><strong>Điện thoại:</strong> 1900-1234</p>
            <p><strong>Địa chỉ:</strong> 123 Đường ABC, TP. Hồ Chí Minh</p>
          </div>
        </section>
      </div>
    </div>
  );
}
