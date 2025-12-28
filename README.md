# Hệ thống trắc nghiệm môn Mạng Máy Tính

<p align="center">
  <img src="assets/dashboard.png" width="100%" />
  <br/>
  <em>Giao diện hệ thống (v2.3.0)</em>
</p>

Hệ thống tạo và quản lý đề thi trắc nghiệm cho môn học mạng máy tính, sử dụng AI để tạo câu hỏi, cho phép học sinh làm bài và phân tích kết quả.

## Tổng quan

Đây là một ứng dụng web full-stack được thiết kế để giúp sinh viên luyện tập và kiểm tra kiến thức về mạng máy tính. Hệ thống sử dụng Google Gemini AI để tạo câu hỏi dựa trên các chương và chủ đề của khóa học, đồng thời cung cấp phân tích và phản hồi chi tiết.

## Cấu trúc dự án

```
networking-quiz-generator/
├── assets/                 # Tài nguyên hình ảnh (demo, logo...)
├── client/                 # Ứng dụng React frontend
│   ├── src/
│   │   ├── components/     # Các component React (Quiz, Analysis, Admin...)
│   │   ├── contexts/       # React Context providers (Auth, Data, Toast)
│   │   ├── services/       # API services
│   │   └── types/          # Định nghĩa TypeScript types
│   └── README.md
├── docker-images/          # Thư mục chứa artifacts để deploy (sinh ra từ script build)
├── server/                 # Ứng dụng FastAPI backend
│   ├── main.py             # FastAPI app và endpoints
│   ├── auth.py             # Các hàm xác thực
│   ├── email_service.py    # Dịch vụ gửi email OTP
│   ├── database.py         # Kết nối database
│   ├── dtos.py             # Pydantic models
│   └── README.md
├── build-and-save.bat      # Script build docker images (Windows)
├── deploy.sh               # Script deploy (Linux)
├── docker-compose.yml      # Cấu hình Docker Compose
└── README.md               # File này
```

## Tính năng chính

### Quản lý đề thi
- Tạo đề thi trắc nghiệm tự động bằng AI (Google Gemini)
- Làm bài thi thời gian thực với bộ đếm ngược
- Tính điểm tự động và hiển thị kết quả chi tiết
- Quản lý đề thi (xem, sửa, xóa câu hỏi)
- In đề thi, hỗ trợ 2 chế độ in (có đáp án và không đáp án)

### Phân tích AI
- Phân tích chi tiết bài làm (điểm mạnh, điểm yếu, gợi ý cải thiện)
- Phân tích tổng quan lịch sử học tập
- Phân tích tiến triển học tập theo chương
- Lưu lịch sử phân tích để xem lại

### Cộng đồng
- Chat cộng đồng, chat chung với tất cả mọi người
- Chat riêng với một người dùng
- Thảo luận về từng đề thi với cộng đồng

### Cài đặt cấu hình AI
- Chọn model AI (Gemini 3 Pro Preview, Gemini 3 Flash Preview, Gemini 2.5 Flash, Gemini 2.5 Flash Lite)
- Cấu hình API Key Gemini riêng cho từng người dùng
- Hướng dẫn lấy API Key và xử lý lỗi thường gặp

### Quản lý người dùng (Admin)
- Thêm/Xóa người dùng
- Khóa/Mở khóa tài khoản
- Thay đổi vai trò người dùng
- Reset mật khẩu cho người dùng
- Khóa API key mặc định (buộc user phải dùng key riêng)

## Công nghệ sử dụng

### Frontend (Client)

- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Tailwind CSS 3.4.1
- Lucide React (Icons)

### Backend (Server)

- FastAPI
- Python 3.8+
- MongoDB (PyMongo)
- Google Gemini AI
- JWT Authentication
- Bcrypt password hashing
- Google SMTP (cho gửi mã OTP xác nhận)

## Bắt đầu

### Cách 1: Chạy thủ công
Xem hướng dẫn cài đặt chi tiết trong:
- [`client/README.md`](client/README.md) - Hướng dẫn cài đặt và chạy frontend
- [`server/README.md`](server/README.md) - Hướng dẫn cài đặt và chạy backend

### Cách 2: Triển khai bằng Docker (Recommended for Production)

Hệ thống hỗ trợ đóng gói và triển khai tự động bằng Docker, giúp dễ dàng deploy lên server mà không cần cài đặt môi trường phức tạp.

#### 1. Yêu cầu
- Docker Desktop (trên Windows để build)
- Docker và Docker Compose (trên Linux server để chạy)

#### 2. Đóng gói (Trên máy Windows development)
Chạy script sau để build docker images và đóng gói tất cả file cần thiết:
```bash
build-and-save.bat
```
Script này sẽ:
- Build Docker images cho frontend và backend (với `--no-cache` để đảm bảo code mới nhất)
- Lưu images thành file `.tar`
- Copy các file cấu hình (`docker-compose.yml`, `deploy.sh`, `.env`)
- Tất cả sẽ được lưu trong thư mục `docker-images/`

#### 3. Triển khai (Trên Linux Server)
1. Copy toàn bộ thư mục `docker-images/` lên server của bạn.
2. Truy cập vào thư mục và cấp quyền cho script:
   ```bash
   cd docker-images
   chmod +x deploy.sh
   ```
3. Sử dụng các lệnh deploy:
   ```bash
   ./deploy.sh load      # Load images từ file .tar
   ./deploy.sh start     # Khởi động containers
   ./deploy.sh stop      # Dừng containers
   ./deploy.sh restart   # Khởi động lại containers
   ./deploy.sh status    # Xem trạng thái containers
   ./deploy.sh logs      # Xem logs (thêm tên container để xem riêng)
   ./deploy.sh update    # Cập nhật images mới và khởi động lại
   ./deploy.sh cleanup   # Dọn dẹp - xóa containers, images
   ./deploy.sh help      # Xem tất cả lệnh
   ```

4. Sau khi khởi động:
   - Frontend sẽ chạy tại port 80 (hoặc port cấu hình trong `docker-compose.yml`)
   - Backend sẽ chạy tại port 8000

**Lưu ý:** Hệ thống đã được cấu hình để hỗ trợ IP động. Bạn có thể truy cập web từ bất kỳ IP nào của server. Frontend sẽ tự động kết nối đến Backend trên cùng IP đó.

## Tài khoản Admin mặc định

Khi khởi động lần đầu, một tài khoản admin sẽ được tạo tự động:
- Email: `admin@example.com` (có thể cấu hình qua `ADMIN_EMAIL`)
- Mật khẩu: `admin123` (có thể cấu hình qua `ADMIN_PASSWORD`)

## Tài liệu API

Khi server đang chạy, tài liệu API có sẵn tại:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Nội dung môn học

Hệ thống hỗ trợ 8 chương về mạng máy tính:

- Chương 1 - Tổng quan về mạng máy tính
- Chương 2 - Tầng vật lý
- Chương 3 - Tầng liên kết dữ liệu
- Chương 4 - Tầng mạng
- Chương 5 - Tầng giao vận
- Chương 6 - Tầng ứng dụng
- Chương 7 - An toàn không gian mạng
- Chương 8 - Mạng không dây và di động

Mỗi chương chứa nhiều chủ đề và hỗ trợ các loại kiến thức và mức độ khó khác nhau.

## Phát triển

### Frontend

Xem [`client/README.md`](client/README.md) để biết hướng dẫn phát triển frontend.

### Backend

Xem [`server/README.md`](server/README.md) để biết hướng dẫn phát triển backend.

## Giấy phép

Dự án này được cấp phép theo Giấy phép Apache-2.0. Xem tệp [LICENSE](LICENSE) để biết chi tiết.