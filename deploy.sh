#!/bin/bash

# ==============================================
# Deploy Script for Networking Quiz Generator
# ==============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Docker compose file
COMPOSE_FILE="docker-compose.yml"

# Print colored message
print_msg() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo ""
    print_msg "========================================" "$BLUE"
    print_msg "$1" "$BLUE"
    print_msg "========================================" "$BLUE"
}

# Check if docker-compose exists
check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_msg "LOI: Khong tim thay $COMPOSE_FILE!" "$RED"
        exit 1
    fi
}

# Check .env file
check_env_file() {
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_msg "CANH BAO: Khong tim thay .env! Dang copy tu .env.example..." "$YELLOW"
            cp .env.example .env
            print_msg "Vui long chinh sua .env truoc khi tiep tuc." "$YELLOW"
            exit 1
        else
            print_msg "CANH BAO: Khong tim thay .env!" "$YELLOW"
        fi
    fi
}

# Load docker images from tar files
load_images() {
    print_header "Dang load Docker Images..."

    if [ -f "quiz-frontend.tar" ]; then
        echo ""
        print_msg "[1/2] Dang load frontend image..." "$BLUE"
        docker load -i quiz-frontend.tar
        if [ $? -ne 0 ]; then
            print_msg "LOI: Khong the load frontend image" "$RED"
            exit 1
        fi
    else
        print_msg "CANH BAO: Khong tim thay quiz-frontend.tar" "$YELLOW"
    fi

    if [ -f "quiz-backend.tar" ]; then
        echo ""
        print_msg "[2/2] Dang load backend image..." "$BLUE"
        docker load -i quiz-backend.tar
        if [ $? -ne 0 ]; then
            print_msg "LOI: Khong the load backend image" "$RED"
            exit 1
        fi
    else
        print_msg "CANH BAO: Khong tim thay quiz-backend.tar" "$YELLOW"
    fi

    print_msg "Load images thanh cong!" "$GREEN"
}

# Start containers
start() {
    print_header "Khoi dong containers..."
    check_compose_file
    check_env_file
    sudo docker-compose -f $COMPOSE_FILE up -d
    print_msg "Containers da khoi dong!" "$GREEN"
    echo ""
    status
}

# Stop containers
stop() {
    print_header "Dung containers..."
    check_compose_file
    sudo docker-compose -f $COMPOSE_FILE down
    print_msg "Containers da dung!" "$GREEN"
}

# Restart containers
restart() {
    print_header "Khoi dong lai containers..."
    check_compose_file
    sudo docker-compose -f $COMPOSE_FILE restart
    print_msg "Containers da khoi dong lai!" "$GREEN"
    echo ""
    status
}

# Show container status
status() {
    print_header "Trang thai containers"
    check_compose_file
    sudo docker-compose -f $COMPOSE_FILE ps
}

# Show logs
logs() {
    check_compose_file
    if [ -z "$2" ]; then
        print_header "Logs cua tat ca containers"
        sudo docker-compose -f $COMPOSE_FILE logs -f --tail=100
    else
        print_header "Logs cua $2"
        sudo docker-compose -f $COMPOSE_FILE logs -f --tail=100 "$2"
    fi
}

# Cleanup - remove containers, images, volumes
cleanup() {
    print_header "Don dep he thong..."
    
    read -p "Ban co chac chan muon xoa tat ca containers va images? (y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_msg "Huy bo." "$YELLOW"
        exit 0
    fi

    echo ""
    print_msg "Dang dung containers..." "$BLUE"
    sudo docker-compose -f $COMPOSE_FILE down -v 2>/dev/null

    echo ""
    print_msg "Dang xoa images..." "$BLUE"
    docker rmi quiz-frontend quiz-backend 2>/dev/null

    echo ""
    print_msg "Dang don dep Docker system..." "$BLUE"
    docker system prune -f

    print_msg "Don dep hoan tat!" "$GREEN"
}

# Pull/Update - rebuild và restart
update() {
    print_header "Cap nhat he thong..."
    check_compose_file
    
    echo ""
    print_msg "Dang dung containers cu..." "$BLUE"
    sudo docker-compose -f $COMPOSE_FILE down
    
    echo ""
    load_images
    
    echo ""
    print_msg "Dang khoi dong containers moi..." "$BLUE"
    sudo docker-compose -f $COMPOSE_FILE up -d
    
    print_msg "Cap nhat hoan tat!" "$GREEN"
    echo ""
    status
}

# Show help
show_help() {
    echo ""
    print_msg "Networking Quiz Generator - Deploy Script" "$GREEN"
    echo ""
    echo "Su dung: ./deploy.sh [LENH]"
    echo ""
    echo "Cac lenh:"
    echo "  load      Load Docker images tu file .tar"
    echo "  start     Khoi dong containers"
    echo "  stop      Dung containers"
    echo "  restart   Khoi dong lai containers"
    echo "  status    Xem trang thai containers"
    echo "  logs      Xem logs (them ten container de xem rieng)"
    echo "  cleanup   Don dep - xoa containers, images"
    echo "  update    Cap nhat - load images moi va khoi dong lai"
    echo "  help      Hien thi huong dan nay"
    echo ""
    echo "Vi du:"
    echo "  ./deploy.sh start"
    echo "  ./deploy.sh logs backend"
    echo "  ./deploy.sh cleanup"
    echo ""
}

# Main
case "$1" in
    load)
        load_images
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$@"
        ;;
    cleanup)
        cleanup
        ;;
    update)
        update
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            show_help
        else
            print_msg "Lenh khong hop le: $1" "$RED"
            show_help
            exit 1
        fi
        ;;
esac
