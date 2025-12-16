# Networking Quiz Generator - Server

Backend API server cho hệ thống Networking Quiz Generator được xây dựng bằng FastAPI, MongoDB và Google Gemini AI.

## Công nghệ

- FastAPI
- Python 3.8+
- MongoDB (qua PyMongo)
- Google Gemini AI (google-genai)
- JWT Authentication (python-jose)
- Bcrypt để hash mật khẩu
- Uvicorn ASGI server

## Yêu cầu

- Python 3.8 trở lên
- MongoDB server đang chạy locally hoặc có thể truy cập từ xa
- Google Gemini API key

## Cài đặt

1. Di chuyển vào thư mục server:
```bash
cd server
```

2. Tạo môi trường ảo (khuyến nghị):
```bash
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate
```

3. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

## Cấu hình

Tạo file `.env` trong thư mục server với các biến sau:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=networking-quiz
SECRET_KEY=your-secret-key-change-in-production
GOOGLE_API_KEY=your-google-gemini-api-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrator
```

### Biến môi trường

- `MONGODB_URL`: Chuỗi kết nối MongoDB (mặc định: `mongodb://localhost:27017`)
- `DATABASE_NAME`: Tên database (mặc định: `networking-quiz`)
- `SECRET_KEY`: Secret key để ký JWT token (thay đổi trong production)
- `GOOGLE_API_KEY`: Google Gemini API key để tạo câu hỏi
- `ADMIN_EMAIL`: Email người dùng admin (mặc định: `admin@example.com`)
- `ADMIN_PASSWORD`: Mật khẩu người dùng admin (mặc định: `admin123`)
- `ADMIN_NAME`: Tên người dùng admin (mặc định: `Administrator`)

## Chạy server

Khởi động development server:
```bash
uvicorn main:app --reload --port 8000
```

API sẽ có sẵn tại `http://localhost:8000`

Tài liệu API (Swagger UI) sẽ có sẵn tại `http://localhost:8000/docs`

## Cấu trúc dự án

```
server/
├── main.py              # Ứng dụng FastAPI và các API endpoints
├── auth.py              # Các hàm xác thực và quản lý người dùng
├── database.py          # Kết nối và khởi tạo database
├── dtos.py              # Pydantic models cho validation request/response
└── requirements.txt     # Python dependencies
```

## API endpoints

### Xác thực

- `POST /api/auth/login` - Đăng nhập người dùng
- `GET /api/auth/me` - Lấy thông tin người dùng hiện tại
- `PUT /api/auth/profile` - Cập nhật hồ sơ người dùng
- `PUT /api/auth/change-password` - Đổi mật khẩu

### Quản lý đề thi

- `GET /api/quizzes` - Lấy tất cả đề thi (tùy chọn: lọc theo người tạo)
- `GET /api/quizzes/{quiz_id}` - Lấy đề thi theo ID
- `POST /api/quizzes` - Tạo đề thi mới
- `PUT /api/quizzes/{quiz_id}` - Cập nhật đề thi
- `DELETE /api/quizzes/{quiz_id}` - Xóa đề thi

### Quản lý câu hỏi

- `PUT /api/quizzes/{quiz_id}/questions/{question_id}` - Cập nhật câu hỏi
- `DELETE /api/quizzes/{quiz_id}/questions/{question_id}` - Xóa câu hỏi

### Quản lý bài làm

- `POST /api/attempts` - Tạo bài làm đề thi
- `GET /api/attempts` - Lấy bài làm (tùy chọn: lọc theo quiz_id)
- `GET /api/attempts/{attempt_id}` - Lấy bài làm theo ID

### Quản lý người dùng

- `GET /api/admin/users` - Lấy tất cả người dùng (chỉ admin)
- `POST /api/admin/users` - Tạo người dùng mới (chỉ admin)
- `DELETE /api/admin/users/{user_id}` - Xóa người dùng (chỉ admin)
- `PUT /api/admin/users/{user_id}/lock` - Khóa người dùng (chỉ admin)
- `PUT /api/admin/users/{user_id}/unlock` - Mở khóa người dùng (chỉ admin)

### Tính năng AI

- `POST /api/generate-questions` - Tạo câu hỏi bằng AI
- `POST /api/analyze-result` - Phân tích kết quả bài làm đề thi
- `POST /api/analyze-overall` - Phân tích kiến thức tổng quan
- `POST /api/analyze-progress` - Phân tích tiến triển học tập theo chương

### Phân trang

API `/api/quizzes` hỗ trợ phân trang với các tham số:
- `page`: Số trang (mặc định: 1)
- `size`: Số lượng item mỗi trang (mặc định: 10, tối đa: 100)

## Database

Ứng dụng sử dụng MongoDB với các collection sau:

- `users`: Tài khoản người dùng
- `quizzes`: Định nghĩa đề thi
- `attempts`: Bản ghi bài làm đề thi

Indexes được tạo tự động trên:
- `users.email` (unique)
- `users.id` (unique)
- `quizzes.id` (unique)
- `quizzes.createdBy`
- `quizzes.createdAt`
- `attempts.id` (unique)
- `attempts.quizId`
- `attempts.studentId`

## Xác thực

API sử dụng JWT (JSON Web Tokens) để xác thực. Tokens hết hạn sau 30 ngày.

Bao gồm token trong requests:
```
Authorization: Bearer <token>
```

## Bảo mật

- Mật khẩu được hash bằng bcrypt
- JWT tokens cho xác thực
- CORS middleware được cấu hình cho frontend
- Khả năng khóa tài khoản người dùng
- Kiểm soát truy cập dựa trên vai trò (admin/student)

## Người dùng Admin

Một người dùng admin được tạo tự động khi khởi động lần đầu nếu chưa tồn tại. Thông tin đăng nhập mặc định có thể được cấu hình qua biến môi trường.
