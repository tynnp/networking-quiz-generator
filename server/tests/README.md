# Backend Tests

Hướng dẫn chạy tests cho backend của Networking Quiz Generator.

## Cài đặt

```bash
cd server
pip install -r requirements.txt
```

## Chạy Tests

### Chạy tất cả tests
```bash
pytest
```

### Chạy với verbose output
```bash
pytest -v
```

### Chạy chỉ unit tests
```bash
pytest tests/unit/
```

### Chạy chỉ integration tests
```bash
pytest tests/integration/
```

### Chạy một file test cụ thể
```bash
pytest tests/unit/test_auth.py
```

### Chạy một test class cụ thể
```bash
pytest tests/unit/test_auth.py::TestPasswordHashing
```

### Chạy một test function cụ thể
```bash
pytest tests/unit/test_auth.py::TestPasswordHashing::test_get_password_hash_returns_hashed_string
```

## Code Coverage

### Chạy với coverage report
```bash
pytest --cov=. --cov-report=term-missing
```

### Tạo HTML coverage report
```bash
pytest --cov=. --cov-report=html
```

Report sẽ được tạo trong thư mục `htmlcov/`. Mở `htmlcov/index.html` trong browser để xem.

## Cấu trúc Tests

```
tests/
├── conftest.py                     # Shared fixtures
├── unit/                           # Unit tests
│   ├── test_auth.py                # Auth module tests
│   ├── test_connection_manager.py  # WebSocket/Chat connection logic
│   ├── test_database.py            # Database module tests
│   ├── test_dtos.py                # DTOs validation tests
│   └── test_email_service.py       # Email service tests
└── integration/                    # Integration tests
    ├── test_api_analysis.py        # Analysis API endpoints
    ├── test_api_attempts.py        # Attempt API endpoints
    ├── test_api_auth.py            # Auth API endpoints
    ├── test_api_chat.py            # Chat API endpoints
    ├── test_api_discussions.py     # Discussion API endpoints
    ├── test_api_quizzes.py         # Quiz API endpoints
    ├── test_api_settings.py        # Settings API endpoints
    └── test_api_users.py           # User management API
```

## Fixtures

Các fixtures có sẵn trong `conftest.py`:

### Database Fixtures
- `mock_mongo_client` - Mock MongoDB client
- `mock_db` - Mock database instance

### User Fixtures
- `sample_student_data` - Sample student user data
- `sample_admin_data` - Sample admin user data
- `student_user` - Student user trong database
- `admin_user` - Admin user trong database
- `student_token` - JWT token cho student
- `admin_token` - JWT token cho admin
- `auth_headers_student` - Authorization headers cho student
- `auth_headers_admin` - Authorization headers cho admin

### Quiz Fixtures
- `sample_question` - Sample question data
- `sample_quiz_data` - Sample quiz data
- `quiz_in_db` - Quiz trong database

### Other Fixtures
- `sample_attempt_data` - Sample attempt data
- `attempt_in_db` - Attempt trong database
- `sample_analysis_history` - Sample analysis history
- `mock_gemini_client` - Mock Gemini AI client
- `mock_smtp` - Mock SMTP server
- `sample_otp_data` - Sample OTP data
- `otp_in_db` - OTP trong database

## Test Categories

### Unit Tests
- Test các functions riêng lẻ
- Không phụ thuộc vào external services
- Mock database và external APIs

### Integration Tests
- Test các API endpoints
- Sử dụng FastAPI TestClient
- Mock database với mongomock
- Mock Gemini API responses

## Best Practices

1. **Độc lập**: Mỗi test phải độc lập, không phụ thuộc vào test khác
2. **Fixtures**: Sử dụng fixtures để setup/teardown test data
3. **Mocking**: Mock external services (MongoDB, SMTP, Gemini API)
4. **Naming**: Tên test nên mô tả rõ ràng test case
5. **Coverage**: Đảm bảo coverage >= 70%

## Troubleshooting

### Import Errors
Đảm bảo bạn đang chạy pytest từ thư mục `server/`:
```bash
cd server
pytest
```

### Missing Dependencies
```bash
pip install pytest pytest-asyncio pytest-cov httpx mongomock
```

### Database Connection Errors
Tests sử dụng mongomock, không cần real MongoDB connection.
