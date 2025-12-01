@echo off

REM Chạy client trong terminal hiện tại
cd client
npm run dev

REM Mở terminal mới chạy server
start cmd /k "cd server && uvicorn main:app --reload --port 8000"
