# Danh sách thư viện và gói phụ thuộc

Tài liệu này liệt kê tất cả các thư viện và gói phụ thuộc được sử dụng trong dự án Networking Quiz Generator.

---

## Server (Backend)

| Thư viện/Gói | Phiên bản | Giấy phép | Mô tả | URL |
|--------------|-----------|-----------|-------|-----|
| fastapi | 0.118.2 | MIT | Framework web hiện đại, nhanh cho xây dựng API với Python | https://fastapi.tiangolo.com/ |
| uvicorn[standard] | 0.37.0 | BSD-3-Clause | ASGI server để chạy ứng dụng FastAPI | https://www.uvicorn.org/ |
| requests | 2.32.5 | Apache-2.0 | Thư viện HTTP đơn giản và thân thiện cho Python | https://requests.readthedocs.io/ |
| google-genai | 0.8.5 | Apache-2.0 | Thư viện Python cho Google Generative AI (Gemini) | https://github.com/google/generative-ai-python |
| python-dotenv | 1.0.1 | BSD-3-Clause | Đọc các cặp key-value từ file .env | https://github.com/theskumar/python-dotenv |
| python-jose[cryptography] | 3.5.0 | MIT | Thư viện JOSE (JSON Object Signing and Encryption) cho Python | https://github.com/mpdavis/python-jose |
| bcrypt | 5.0.0 | Apache-2.0 | Thư viện mã hóa mật khẩu bcrypt | https://github.com/pyca/bcrypt |
| python-multipart | 0.0.20 | Apache-2.0 | Streaming multipart parser cho Python | https://github.com/andrew-d/python-multipart |
| pymongo | 4.15.4 | Apache-2.0 | Driver Python chính thức cho MongoDB | https://pymongo.readthedocs.io/ |

---

## Client (Frontend)

| Thư viện/Gói | Phiên bản | Giấy phép | Mô tả | URL |
|--------------|-----------|-----------|-------|-----|
| react | 18.3.1 | MIT | Thư viện JavaScript để xây dựng giao diện người dùng | https://react.dev/ |
| react-dom | 18.3.1 | MIT | Điểm vào DOM và server renderer cho React | https://react.dev/ |
| @supabase/supabase-js | 2.57.4 | MIT | Thư viện JavaScript isomorphic cho Supabase | https://supabase.com/docs/reference/javascript |
| lucide-react | 0.344.0 | ISC | Thư viện icon đẹp và nhất quán cho React | https://lucide.dev/ |
| react-markdown | 10.1.0 | MIT | Component React để render markdown | https://github.com/remarkjs/react-markdown |
| vite | 5.4.2 | MIT | Công cụ build frontend thế hệ mới | https://vitejs.dev/ |
| typescript | 5.5.3 | Apache-2.0 | Ngôn ngữ TypeScript và trình biên dịch | https://www.typescriptlang.org/ |
| eslint | 9.9.1 | MIT | Công cụ phân tích mã tĩnh (linting) JavaScript/TypeScript | https://eslint.org/ |
| tailwindcss | 3.4.1 | MIT | Framework CSS utility-first | https://tailwindcss.com/ |
| postcss | 8.4.35 | MIT | Công cụ biến đổi CSS bằng plugin JavaScript | https://postcss.org/ |
| autoprefixer | 10.4.18 | MIT | Tự động thêm tiền tố vendor cho CSS | https://github.com/postcss/autoprefixer |
| @vitejs/plugin-react | 4.3.1 | MIT | Plugin React chính thức cho Vite | https://github.com/vitejs/vite-plugin-react |
| eslint-plugin-react-hooks | 5.1.0-rc.0 | MIT | Quy tắc ESLint cho React Hooks | https://github.com/facebook/react |
| eslint-plugin-react-refresh | 0.4.11 | MIT | Xác nhận các component có thể được refresh an toàn | https://github.com/ArnaudBarre/eslint-plugin-react-refresh |
| typescript-eslint | 8.3.0 | MIT | Công cụ cho ESLint và Prettier để hỗ trợ TypeScript | https://typescript-eslint.io/ |
| globals | 15.9.0 | MIT | Định nghĩa các biến global cho ESLint | https://github.com/sindresorhus/globals |
| @types/react | 18.3.5 | MIT | Định nghĩa kiểu TypeScript cho React | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @types/react-dom | 18.3.0 | MIT | Định nghĩa kiểu TypeScript cho React DOM | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @eslint/js | 9.9.1 | MIT | Cấu hình JavaScript cho ESLint | https://eslint.org/ |

---