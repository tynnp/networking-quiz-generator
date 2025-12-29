# Networking Quiz Generator - Client

Ứng dụng frontend cho hệ thống Networking Quiz Generator được xây dựng bằng React, TypeScript và Tailwind CSS.

## Cấu trúc dự án

```
client/
├── src/
│   ├── components/             # Các component React
│   │   ├── AboutTeam.tsx       
│   │   ├── AdminUserManagement.tsx
│   │   ├── AiResultFeedback.tsx
│   │   ├── AnalysisHistory.tsx
│   │   ├── Analytics.tsx
│   │   ├── AttemptDetail.tsx
│   │   ├── CommunityChat.tsx
│   │   ├── CreateQuiz.tsx
│   │   ├── DefaultKeyLockedModal.tsx
│   │   ├── ForgotPassword.tsx 
│   │   ├── Layout.tsx
│   │   ├── Login.tsx
│   │   ├── MyResults.tsx
│   │   ├── Profile.tsx
│   │   ├── QuizDiscussion.tsx
│   │   ├── QuizDiscussionChat.tsx
│   │   ├── QuizList.tsx
│   │   ├── QuizPreview.tsx
│   │   ├── Register.tsx        
│   │   ├── Settings.tsx        
│   │   └── TakeQuiz.tsx
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── DataContext.tsx
│   │   └── ToastContext.tsx
│   ├── services/               # API services
│   │   ├── __tests__/          # Unit tests
│   │   ├── api.ts
│   │   ├── gemini.ts
│   │   └── websocket.ts        
│   ├── types/                  # Định nghĩa kiểu TypeScript
│   │   └── index.ts
│   ├── setupTests.ts           # Global test setup
│   ├── App.tsx                 # Component ứng dụng chính
│   ├── main.tsx                # Điểm vào ứng dụng
│   └── index.css               # Styles toàn cục
├── public/                     # Tài nguyên tĩnh
├── index.html                  # HTML template
├── package.json                # Dependencies và scripts
├── tsconfig.json               # Cấu hình TypeScript
├── vite.config.ts              # Cấu hình Vite
├── vitest.config.ts            # Cấu hình Vitest
└── tailwind.config.js          # Cấu hình Tailwind CSS
```

## Công nghệ

- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Tailwind CSS 3.4.1
- Lucide React (Icons)

## Yêu cầu

- Node.js 18+ 
- npm hoặc yarn

## Cài đặt

1. Di chuyển vào thư mục client:
```bash
cd client
```

2. Cài đặt dependencies:
```bash
npm install
```

## Phát triển

Khởi động development server:
```bash
npm run dev
```
Ứng dụng sẽ có sẵn tại `http://localhost:5173`

## Testing

Dự án sử dụng **Vitest** để chạy unit tests cho các services và utilities.

### Chạy tests
```bash
npm test            # Chạy chế độ watch
npm run test:run    # Chạy 1 lần
```

### Coverage
Để xem báo cáo coverage:
```bash
npm run test:coverage
```
Hiện tại đã cover các service chính: `api.ts`, `gemini.ts`, `websocket.ts`.

## Biến môi trường

Client kết nối đến backend API tại `http://localhost:8000` theo mặc định. Có thể thay đổi trong `src/services/api.ts`.

## Tích hợp API

Tất cả các lời gọi API được xử lý thông qua `src/services/api.ts` cung cấp:
- Các hàm xác thực (Đăng nhập, Đăng ký, Gửi mã OTP)
- Các hàm quản lý đề thi (CRUD, in đề thi)
- Các hàm quản lý người dùng (CRUD, phân quyền, reset mật khẩu - chỉ admin)
- Các hàm quản lý bài làm
- Các dịch vụ AI (Gemini) và WebSocket (Chat)
- Các hàm cài đặt hệ thống (khóa API key mặc định - chỉ admin)

## Quản lý trạng thái

Ứng dụng sử dụng React Context để quản lý trạng thái:
- `AuthContext`: Trạng thái xác thực người dùng
- `DataContext`: Dữ liệu đề thi và bài làm
- `ToastContext`: Thông báo toast

## Styling

Ứng dụng sử dụng Tailwind CSS để styling với bảng màu tùy chỉnh dựa trên #124874 (Cerulean Blue).
