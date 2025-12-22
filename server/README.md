# Networking Quiz Generator - Server

Backend API server cho hệ thống Networking Quiz Generator được xây dựng bằng FastAPI, MongoDB và Google Gemini AI.

## Cấu trúc dự án

```
server/
├── main.py                     # Ứng dụng FastAPI và các API endpoints
├── auth.py                     # Các hàm xác thực và quản lý người dùng
├── email_service.py            # Dịch vụ gửi email OTP
├── database.py                 # Kết nối và khởi tạo database
├── dtos.py                     # Pydantic models cho validation request/response
├── requirements.txt            # Python dependencies
└── README.md                   # File này
```

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
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=networking-quiz
SECRET_KEY=your-secret-key-change-in-production
GOOGLE_API_KEY=your-google-gemini-api-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrator
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=your-google-app-password
```

### Biến môi trường

- `MONGO_URI`: Chuỗi kết nối MongoDB (mặc định: `mongodb://localhost:27017`)
- `DATABASE_NAME`: Tên database (mặc định: `networking-quiz`)
- `SECRET_KEY`: Secret key để ký JWT token (thay đổi trong production)
- `GOOGLE_API_KEY`: Google Gemini API key để tạo câu hỏi
- `ADMIN_EMAIL`: Email người dùng admin
- `ADMIN_PASSWORD`: Mật khẩu người dùng admin
- `ADMIN_NAME`: Tên người dùng admin (mặc định: `Administrator`)
- `SMTP_EMAIL`: Địa chỉ Gmail dùng để gửi mã xác nhận OTP
- `SMTP_PASSWORD`: Mật khẩu ứng dụng (App Password) của Google cho Gmail

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

- `POST /api/auth/send-otp` - Gửi mã OTP xác nhận đăng ký
- `POST /api/auth/register` - Đăng ký người dùng mới với xác thực OTP
- `POST /api/auth/forgot-password/send-otp` - Gửi mã OTP để khôi phục mật khẩu
- `POST /api/auth/forgot-password/verify-otp` - Xác thực mã OTP cho quên mật khẩu
- `POST /api/auth/forgot-password/reset` - Đặt lại mật khẩu mới
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
- `PUT /api/admin/users/{user_id}/role` - Cập nhật vai trò người dùng (chỉ admin)
- `PUT /api/admin/users/{user_id}/reset-password` - Đặt lại mật khẩu người dùng (chỉ admin)

### Tính năng AI

- `POST /api/generate-questions` - Tạo câu hỏi bằng AI
- `POST /api/analyze-result` - Phân tích kết quả bài làm đề thi
- `POST /api/analyze-overall` - Phân tích kiến thức tổng quan
- `POST /api/analyze-progress` - Phân tích tiến triển học tập theo chương
- `GET /api/analysis-history` - Lấy lịch sử phân tích của người dùng
- `DELETE /api/analysis-history/{analysis_id}` - Xóa bản ghi lịch sử phân tích

### Chat cộng đồng

- `WS /ws/chat` - WebSocket endpoint cho chat real-time (xác thực qua query param `token`)
- `GET /api/chat/messages` - Lấy lịch sử tin nhắn chat cộng đồng
- `GET /api/chat/private/{user_id}` - Lấy lịch sử tin nhắn riêng với người dùng
- `GET /api/chat/online` - Lấy danh sách người dùng đang online
- `DELETE /api/chat/private/{user_id}` - Xóa đoạn chat riêng với người dùng
- `DELETE /api/chat/messages/{message_id}` - Xóa tin nhắn cộng đồng (chỉ admin)
- `DELETE /api/chat/messages` - Xóa tất cả tin nhắn cộng đồng (chỉ admin)

### Thảo luận đề thi

- `POST /api/discussions` - Thêm đề thi vào thảo luận
- `GET /api/discussions` - Lấy danh sách đề thi đang thảo luận
- `DELETE /api/discussions/{quiz_id}` - Xóa đề thi khỏi thảo luận
- `GET /api/discussions/{quiz_id}/messages` - Lấy tin nhắn thảo luận của đề thi
- `GET /api/discussions/{quiz_id}/online` - Lấy danh sách người dùng đang online trong phòng thảo luận
- `WS /ws/discussion/{quiz_id}` - WebSocket endpoint cho thảo luận real-time (xác thực qua query param `token`)

### Cài đặt

- `GET /api/settings/gemini` - Lấy cài đặt Gemini AI của người dùng
- `PUT /api/settings/gemini` - Cập nhật cài đặt Gemini AI (model, API key)

### Phân trang

API `/api/quizzes` hỗ trợ phân trang với các tham số:
- `page`: Số trang (mặc định: 1)
- `size`: Số lượng item mỗi trang (mặc định: 10, tối đa: 100)

## Database

Ứng dụng sử dụng MongoDB với các collection sau:

- `users`: Tài khoản người dùng
- `quizzes`: Định nghĩa đề thi
- `attempts`: Bản ghi bài làm đề thi
- `analysis_history`: Lưu trữ lịch sử phân tích AI
- `chat_messages`: Tin nhắn chat cộng đồng
- `private_messages`: Tin nhắn riêng giữa các người dùng
- `quiz_discussions`: Đề thi được đưa vào thảo luận
- `discussion_messages`: Tin nhắn thảo luận về đề thi
- `otp_codes`: Lưu trữ mã xác nhận OTP tạm thời (TTL 5 phút)
- `user_settings`: Lưu trữ cài đặt của người dùng (model AI, API key)

Indexes được tạo tự động trên:
- `users.email` (unique)
- `users.id` (unique)
- `quizzes.id` (unique)
- `quizzes.createdBy`
- `quizzes.createdAt`
- `attempts.id` (unique)
- `attempts.quizId`
- `attempts.quizId`
- `attempts.studentId`
- `analysis_history.id` (unique)
- `analysis_history.userId`
- `analysis_history.analysisType`
- `analysis_history.createdAt`
- `chat_messages.id` (unique)
- `chat_messages.timestamp`
- `private_messages.id` (unique)
- `private_messages.(fromUserId, toUserId)`
- `private_messages.timestamp`
- `quiz_discussions.id` (unique)
- `quiz_discussions.quizId` (unique)
- `quiz_discussions.addedAt`
- `discussion_messages.id` (unique)
- `discussion_messages.quizId`
- `discussion_messages.timestamp`
- `otp_codes.email` (unique)
- `otp_codes.expiresAt` (TTL)

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
