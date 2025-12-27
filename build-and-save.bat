@echo off
chcp 65001 >nul
echo ========================================
echo Dang build Docker Images...
echo ========================================

REM Tao thu muc docker-images neu chua co
if not exist "docker-images" mkdir docker-images

REM Build frontend image
echo.
echo [1/4] Dang build frontend image...
docker build --no-cache -t quiz-frontend:latest ./client
if %errorlevel% neq 0 (
    echo LOI: Khong the build frontend image
    pause
    exit /b 1
)

REM Build backend image
echo.
echo [2/4] Dang build backend image...
docker build --no-cache -t quiz-backend:latest ./server
if %errorlevel% neq 0 (
    echo LOI: Khong the build backend image
    pause
    exit /b 1
)

REM Luu frontend image
echo.
echo [3/4] Dang luu frontend image vao thu muc docker-images...
docker save -o docker-images/quiz-frontend.tar quiz-frontend:latest
if %errorlevel% neq 0 (
    echo LOI: Khong the luu frontend image
    pause
    exit /b 1
)

REM Luu backend image
echo.
echo [4/4] Dang luu backend image vao thu muc docker-images...
docker save -o docker-images/quiz-backend.tar quiz-backend:latest
if %errorlevel% neq 0 (
    echo LOI: Khong the luu backend image
    pause
    exit /b 1
)

REM Copy cac file deploy
echo.
echo Dang copy cac file deploy...
copy deploy.sh docker-images\ >nul 2>&1
copy docker-compose.yml docker-images\ >nul 2>&1
copy server\.env.example docker-images\ >nul 2>&1

echo.
echo ========================================
echo Build hoan tat!
echo ========================================
echo.
echo Cac images da luu vao thu muc docker-images:
dir docker-images\*.tar /b 2>nul
echo.
echo Buoc tiep theo:
echo 1. Copy thu muc docker-images sang server
echo 2. Chay: chmod +x deploy.sh
echo 3. Cac lenh deploy:
echo    ./deploy.sh load     - Load images tu file .tar
echo    ./deploy.sh start    - Khoi dong containers
echo    ./deploy.sh stop     - Dung containers
echo    ./deploy.sh status   - Xem trang thai
echo    ./deploy.sh logs     - Xem logs
echo    ./deploy.sh update   - Cap nhat images va khoi dong lai
echo    ./deploy.sh help     - Xem tat ca lenh
echo.
pause