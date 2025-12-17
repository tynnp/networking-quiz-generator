#!/bin/bash

echo "========================================"
echo "Dang load Docker Images..."
echo "========================================"

# Load frontend image
echo ""
echo "[1/2] Dang load frontend image..."
docker load -i quiz-frontend.tar
if [ $? -ne 0 ]; then
    echo "LOI: Khong the load frontend image"
    exit 1
fi

# Load backend image
echo ""
echo "[2/2] Dang load backend image..."
docker load -i quiz-backend.tar
if [ $? -ne 0 ]; then
    echo "LOI: Khong the load backend image"
    exit 1
fi

echo ""
echo "========================================"
echo "Load images thanh cong!"
echo "========================================"

# Kiem tra docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo ""
    echo "CANH BAO: Khong tim thay docker-compose.yml!"
    echo "Vui long tao docker-compose.yml truoc khi chay containers."
    exit 1
fi

# Kiem tra .env cho backend
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo ""
        echo "CANH BAO: Khong tim thay .env! Dang copy tu .env.example..."
        cp .env.example .env
        echo "Vui long chinh sua .env voi cau hinh cua ban truoc khi tiep tuc."
        exit 1
    fi
fi

echo ""
read -p "Khoi dong containers ngay? (y/n): " start_containers

if [ "$start_containers" = "y" ] || [ "$start_containers" = "Y" ]; then
    echo ""
    echo "Dang khoi dong containers..."
    sudo docker-compose -f docker-compose.yml up -d
    
    echo ""
    echo "========================================"
    echo "Deploy hoan tat!"
    echo "========================================"
    echo ""
    echo "Cac containers dang chay:"
    sudo docker-compose -f docker-compose.yml ps
else
    echo ""
    echo "Da load images. Chay 'sudo docker-compose -f docker-compose.yml up -d' khi san sang."
fi
