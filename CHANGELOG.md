# Changelog

Tất cả các thay đổi quan trọng của dự án sẽ được ghi lại trong file này.

---

## [2.3.0] - 2025-12-28

### Thêm mới
- Thêm lựa chọn model Gemini 3 Pro Preview và Gemini 3 Flash Preview
- Thêm modal xác nhận khi xóa đề thi và xóa câu hỏi trong đề
- Thêm ghi chú cảnh báo AI có thể mắc lỗi vào giao diện
- Thêm nút Authorize ở đầu trang Swagger Docs (xác thực token một lần cho tất cả API)
- Nâng cấp deploy.sh với các lệnh CLI: start, stop, restart, logs, status, cleanup, update

### Thay đổi
- Cải thiện prompt để tăng độ chính xác khi tạo câu hỏi bằng AI (thêm các quy tắc về tính chính xác kỹ thuật)
- Tổ chức lại sidebar: gom nhóm chức năng theo category, hỗ trợ thu gọn/mở rộng
- Cập nhật thư viện google-genai lên phiên bản 1.56.0
- Cập nhật README: chú thích gif demo, cập nhật hướng dẫn deploy

---

## [2.2.0] - 2025-12-25

### Thêm mới
- Thêm file DEPENDENCIES.md liệt kê các thư viện và gói phụ thuộc
- Thêm file CHANGELOG.md ghi log các lần release
- Thêm một số tùy chọn vào menu trên góc phải

### Thay đổi
- Đổi giấy phép từ MIT sang Apache-2.0
- Xóa hiệu ứng tuyết rơi
- Cập nhật gif demo

---

## [2.1.0] - 2025-12-22

### Thêm mới
- Thêm tính năng khóa/mở khóa API Key của hệ thống, buộc người dùng sử dụng Key cá nhân
- Thêm tính năng in đề thi, hỗ trợ in có đáp án và không đáp án
- Thêm tính năng phân quyền người dùng trên UI cho admin
- Thêm tính năng đặt lại mật khẩu người dùng cho admin

---

## [2.0.0] - 2025-12-21

### Thêm mới
- Thêm tính năng đăng ký, quên mật khẩu, gửi OTP
- Thêm tính năng chat cộng đồng, chat riêng với từng người
- Thêm tính năng thảo luận 1 đề thi
- Thêm trang giới thiệu tác giả
- Thêm một số tính năng nhỏ: Phân trang, thêm modal xác nhận thao tác, chặn 1 số thao tác...

---

## [1.2.0] - 2025-12-17

### Thêm mới
- Thêm tính năng lưu lịch sử đánh giá của AI
- Thêm một số tính năng nhỏ: Thêm thanh cuộn custom, thêm dòng copyright ở sidebar, cho phép sửa tiêu đề và mô tả đề thi,...

---

## [1.1.0] - 2025-12-17

### Thêm mới
- Hoàn thiện chức năng
- Sửa các lỗi nhỏ về ràng buộc dữ liệu
- Responsive đa dạng trên các thiết bị
- Thêm tính năng dùng AI đánh giá sự tiến triển qua lịch sử bài của 1 chương

---

## [1.1.0-beta] - 2025-12-01

### Thêm mới
- Hoàn thiện chức năng cơ bản hơn so với v1.0.0-beta
- Ràng buộc dữ liệu và render markdown

### Vấn đề đã biết
- Một số tính năng có thể chưa ổn định
- Cần thêm phản hồi để tiếp tục cải thiện

---

## [1.0.0-beta] - 2025-11-30

### Thêm mới
- Tạo đề thi trắc nghiệm tự động bằng AI (Google Gemini)
- Làm bài thi thời gian thực với bộ đếm ngược
- Tính điểm tự động và hiển thị kết quả chi tiết
- Quản lý đề thi (xem, sửa, xóa câu hỏi)
- Phân tích chi tiết bài làm (điểm mạnh, điểm yếu, gợi ý cải thiện)
- Phân tích tổng quan lịch sử học tập
- Xác thực người dùng bằng JWT
- Hỗ trợ Docker deployment
