# Hệ thống trắc nghiệm môn Mạng Máy Tính

<p align="center">
  <img src="assets/dashboard.gif" width="100%" />
</p>

Hệ thống tạo và quản lý đề thi trắc nghiệm cho môn học mạng máy tính, sử dụng AI để tạo câu hỏi, cho phép học sinh làm bài và phân tích kết quả.

## Tổng quan

Đây là một ứng dụng web full-stack được thiết kế để giúp sinh viên luyện tập và kiểm tra kiến thức về mạng máy tính. Hệ thống sử dụng Google Gemini AI để tạo câu hỏi dựa trên các chương và chủ đề của khóa học, đồng thời cung cấp phân tích và phản hồi chi tiết.

## Tính năng

### Cho sinh viên

- Làm bài thi với bộ đếm thời gian
- Xem kết quả bài thi và phản hồi chi tiết
- Phân tích hiệu suất bằng AI
- Theo dõi tiến độ theo thời gian
- Theo dõi tiến triển học tập theo chương với AI
- Xem lịch sử bài thi cá nhân
- Xem lại lịch sử phân tích AI
- Quản lý hồ sơ cá nhân

### Cho quản trị viên

- Tạo và quản lý đề thi
- Chỉnh sửa và xóa câu hỏi
- Tạo câu hỏi bằng AI
- Quản lý tài khoản người dùng (tạo, xóa, khóa, mở khóa)
- Xem tất cả bài làm của người dùng
- Tìm kiếm và phân trang danh sách người dùng

### Chức năng chính

- Tạo câu hỏi bằng AI sử dụng Google Gemini
- Làm bài thi thời gian thực với bộ đếm ngược
- Tính điểm tự động và kết quả
- Phân tích chi tiết bài làm với đáp án đúng/sai
- Phân tích loại kiến thức (khái niệm, thuộc tính, cơ chế, quy tắc, tình huống, ví dụ)
- Lọc câu hỏi theo chương và chủ đề
- Chọn mức độ khó (dễ, trung bình, khó)
- Tìm kiếm đề thi theo tiêu đề, chương, độ khó
- Phân trang danh sách đề thi
- Phân tích tiến triển học tập theo chương bằng AI
- Thông báo toast cho phản hồi người dùng
- Thiết kế responsive

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
│   ├── main.py            # FastAPI app và endpoints
│   ├── auth.py            # Các hàm xác thực
│   ├── database.py        # Kết nối database
│   ├── dtos.py            # Pydantic models
│   └── README.md
├── build-and-save.bat     # Script build docker images (Windows)
├── deploy.sh              # Script deploy (Linux)
├── docker-compose.yml     # Cấu hình Docker Compose
└── README.md              # File này
```

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
2. Truy cập vào thư mục và chạy script deploy:
   ```bash
   cd docker-images
   chmod +x deploy.sh
   ./deploy.sh
   ```
3. Script sẽ tự động:
   - Load các docker images
   - Khởi động containers bằng Docker Compose
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

Dự án này được cấp phép theo Giấy phép MIT. Xem tệp [LICENSE](LICENSE) để biết chi tiết.