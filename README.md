# Tool Khởi Tạo Email Vận Hành Chuẩn (FPT Telecom)

Ứng dụng web chạy trên nền tảng Frontend đơn giản, hỗ trợ nhân viên CSKH và điều phối vận hành khởi tạo nhanh nội dung email gửi khách hàng theo đúng form chuẩn quy định.

> **Lưu ý hiện tại:** Tool này tạm thời chỉ hỗ trợ các mẫu email đơn giản, xử lý dữ liệu dạng tĩnh dựa trên thông tin nhập vào form. Chưa tích hợp AI hoặc tự động hóa gửi mail hàng loạt.

---

## 🚀 Tính năng hiện tại
* **Chuẩn hóa form 100%:** Nội dung sinh ra tuân thủ nghiêm ngặt cấu trúc quy định của Trung tâm CSKH FPT Telecom.
* **Ẩn/Hiện trường thông minh:** Khi chọn mẫu "Báo hỏng", hệ thống tự động mở rộng thêm các trường thông tin đặc thù (Thời gian dự kiến, Kỹ thuật viên phụ trách).
* **Đồng bộ hóa dữ liệu thông minh:**
  * Tự động thay đổi danh xưng (Anh/Chị) xuyên suốt toàn bộ văn bản.
  * Tự động đồng bộ Số điện thoại khách hàng vào phần hướng dẫn đăng nhập ứng dụng Hi FPT để tránh sai sót khi copy template gốc.
* **Xem trước thời gian thực (Real-time Preview):** Nhập dữ liệu đến đâu, nội dung email (bao gồm Tiêu đề và Thân bài) tự động cập nhật đến đó.
* **Copy một chạm:** Nút bấm hỗ trợ sao chép toàn bộ Tiêu đề + Nội dung vào bộ nhớ tạm để dán thẳng vào Outlook/Gmail.

---

## 🛠️ Danh sách các mẫu hỗ trợ (Phiên bản hiện tại)
1. **Mẫu Thông báo sự cố / Báo hỏng:** Định mẫu gửi khách hàng khi hệ thống ghi nhận gián đoạn đường truyền, có thông tin điều phối kỹ thuật viên qua phục vụ tại nhà và hướng dẫn sử dụng Hi FPT.
2. **Mẫu Nghiệm thu / Bàn giao dịch vụ:** (Mẫu cơ bản dự phòng phục vụ mở rộng).

---

## 📂 Hướng dẫn cài đặt và chạy trên GitHub Pages

Vì tool viết hoàn toàn bằng HTML/CSS/JS thuần, bạn có thể triển khai lên **GitHub Pages** miễn phí chỉ trong 1 phút:

1. Đẩy file `index.html` và file `README.md` này lên một Repository trên GitHub.
2. Truy cập vào **Settings** (Cài đặt) của Repository đó.
3. Tìm đến mục **Pages** ở menu bên trái.
4. Tại phần **Build and deployment**, mục *Source* chọn `Deploy from a branch`.
5. Tại mục *Branch*, chọn nhánh chính của bạn (thường là `main` hoặc `master`) và thư mục `/root`, sau đó nhấn **Save**.
6. Đợi khoảng 1-2 phút, GitHub sẽ cung cấp cho bạn một đường link trang web dạng: `https://<ten-tai-khoan>.github.io/<ten-repo>/`. Nhân viên chỉ cần truy cập link này để sử dụng.

---

## 📝 Định hướng nâng cấp (To-do list)
- [ ] Bổ sung thêm các mẫu đơn giản khác (Bảo trì định kỳ, Khảo sát dịch vụ).
- [ ] Tích hợp tính năng tạo mã QR nhanh cho ứng dụng Hi FPT ngay trên giao diện web.
- [ ] Nghiên cứu nhúng API hoặc chuyển hướng kết nối tự động mở ứng dụng Mail mặc định trên máy tính.

---
Trân trọng,
**Trung tâm CSKH FPT Telecom**
