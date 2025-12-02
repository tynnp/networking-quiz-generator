@echo off

start "Client" cmd /k "cd /d client && npm run dev"
start "Server" cmd /k "cd /d server && uvicorn server.main:app --reload --port 8000" 

::thêm server.