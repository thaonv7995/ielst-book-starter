#!/usr/bin/env bash
set -e

# Repository and App Configuration
REPO_URL="https://github.com/thaonv7995/ielst-book-starter.git"
REPO_RAW="https://raw.githubusercontent.com/thaonv7995/ielst-book-starter/main"
DEFAULT_INSTALL_DIR="$HOME/ielst-book-starter"
INSTALL_DIR="${IELTS_BOOK_DIR:-$DEFAULT_INSTALL_DIR}"
PORT="38080"
APP_NAME="ielts-book-web"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_banner() {
  echo -e "${CYAN}${BOLD}"
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  🎓 THE OFFICIAL CAMBRIDGE GUIDE TO IELTS - WEB RUNNER       ║"
  echo "║  Interactive Book Reader • 70 Audio Tracks • AI Tutor        ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

check_dependencies() {
  echo -e "${BLUE}🔍 Kiểm tra môi trường hệ thống...${NC}"
  
  if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Lỗi: Node.js chưa được cài đặt trên máy của bạn.${NC}"
    echo -e "${YELLOW}👉 Vui lòng cài đặt Node.js (phiên bản 18 trở lên):${NC}"
    echo "   - macOS:  brew install node"
    echo "   - Ubuntu: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
  fi

  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${YELLOW}⚠️ Cảnh báo: Phiên bản Node.js hiện tại ($NODE_VER) có thể quá cũ. Khuyên dùng Node.js 18+.${NC}"
  else
    echo -e "${GREEN}✓ Node.js $(node -v) đã sẵn sàng.${NC}"
  fi

  if ! command -v git >/dev/null 2>&1; then
    echo -e "${RED}❌ Lỗi: Git chưa được cài đặt.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Git đã sẵn sàng.${NC}"
}

do_install() {
  print_banner
  check_dependencies

  echo -e "\n${BLUE}🚀 Tiến hành cài đặt ứng dụng vào:${NC} ${BOLD}$INSTALL_DIR${NC}"

  if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️ Thư mục cài đặt đã tồn tại. Tiến hành cập nhật phiên bản mới...${NC}"
    do_update
    return
  fi

  echo -e "${BLUE}📥 Đang tải mã nguồn từ GitHub...${NC}"
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"

  cd "$INSTALL_DIR"

  echo -e "\n${BLUE}📦 Đang cài đặt thư viện phụ thuộc (Dependencies & PM2)...${NC}"
  npm install

  echo -e "\n${BLUE}🔨 Đang biên dịch mã nguồn (Build Production Bundle)...${NC}"
  npm run build

  echo -e "\n${BLUE}⚙️ Đang khởi động tiến trình nền Production với PM2...${NC}"
  npm run start

  # Setup CLI helper shortcut
  BIN_DIR="$HOME/.local/bin"
  mkdir -p "$BIN_DIR"
  cat << 'EOF' > "$BIN_DIR/ielts-book"
#!/usr/bin/env bash
APP_DIR="${IELTS_BOOK_DIR:-$HOME/ielst-book-starter}"
if [ ! -d "$APP_DIR" ]; then
  echo "Không tìm thấy thư mục cài đặt tại $APP_DIR"
  exit 1
fi
cd "$APP_DIR"
case "$1" in
  start)   npm run start ;;
  stop)    npm run stop ;;
  restart) npm run restart ;;
  status)  npm run status ;;
  logs)    npm run logs ;;
  update)  bash install.sh update ;;
  delete|uninstall) bash install.sh delete ;;
  *)
    echo "Sử dụng: ielts-book {start|stop|restart|status|logs|update|delete}"
    ;;
esac
EOF
  chmod +x "$BIN_DIR/ielts-book"

  echo -e "\n${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}${BOLD}🎉 CÀI ĐẶT THÀNH CÔNG VÀ TIẾN TRÌNH ĐANG CHẠY NỀN TỰ ĐỘNG!${NC}"
  echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
  echo -e "🌐 Mở trình duyệt ngay tại: ${CYAN}${BOLD}http://localhost:${PORT}${NC}"
  echo -e "🔄 Tiến trình đã bật tự động Auto-Restart qua PM2."
  echo -e "🛠️ Lệnh quản lý tiện lợi:"
  echo -e "   - Xem trạng thái:  ${YELLOW}cd $INSTALL_DIR && npm run status${NC} (hoặc ${YELLOW}ielts-book status${NC})"
  echo -e "   - Xem log:         ${YELLOW}cd $INSTALL_DIR && npm run logs${NC}"
  echo -e "   - Khởi động lại:   ${YELLOW}cd $INSTALL_DIR && npm run restart${NC}"
  echo -e "   - Dừng chạy:       ${YELLOW}cd $INSTALL_DIR && npm run stop${NC}"
  echo -e "   - Cập nhật mới:    ${YELLOW}curl -fsSL ${REPO_RAW}/install.sh | bash -s -- update${NC}"
  echo -e "   - Gỡ cài đặt:      ${YELLOW}curl -fsSL ${REPO_RAW}/install.sh | bash -s -- delete${NC}"
  echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}\n"
}

do_update() {
  print_banner
  echo -e "${BLUE}🔄 Đang kiểm tra và cập nhật phiên bản mới...${NC}"

  if [ ! -d "$INSTALL_DIR" ]; then
    # Try finding in current directory
    if [ -f "./ecosystem.config.cjs" ] && [ -f "./package.json" ]; then
      INSTALL_DIR="$(pwd)"
    else
      echo -e "${RED}❌ Không tìm thấy thư mục cài đặt tại $INSTALL_DIR${NC}"
      echo -e "Vui lòng chạy lệnh cài đặt mới trước."
      exit 1
    fi
  fi

  cd "$INSTALL_DIR"

  echo -e "${BLUE}📥 Đang kéo mã nguồn mới nhất từ nhánh main...${NC}"
  git fetch origin
  git reset --hard origin/main

  echo -e "\n${BLUE}📦 Cập nhật dependencies...${NC}"
  npm install

  echo -e "\n${BLUE}🔨 Xây dựng lại bản build production...${NC}"
  npm run build

  echo -e "\n${BLUE}🔄 Tải lại tiến trình chạy ngầm PM2...${NC}"
  npm run restart || npm run start

  echo -e "\n${GREEN}${BOLD}✅ CẬP NHẬT HOÀN TẤT!${NC}"
  echo -e "🌐 Ứng dụng phiên bản mới nhất đang chạy tại: ${CYAN}${BOLD}http://localhost:${PORT}${NC}\n"
}

do_delete() {
  print_banner
  echo -e "${YELLOW}${BOLD}⚠️ BẮT ĐẦU QUY TRÌNH GỠ CÀI ĐẶT (UNINSTALL)...${NC}"

  if [ ! -d "$INSTALL_DIR" ]; then
    if [ -f "./ecosystem.config.cjs" ] && [ -f "./package.json" ]; then
      INSTALL_DIR="$(pwd)"
    else
      echo -e "${RED}Không tìm thấy thư mục cài đặt tại $INSTALL_DIR${NC}"
      exit 1
    fi
  fi

  cd "$INSTALL_DIR"

  echo -e "${BLUE}🛑 Đang dừng và xóa tiến trình PM2...${NC}"
  if [ -f "./node_modules/.bin/pm2" ]; then
    ./node_modules/.bin/pm2 stop "$APP_NAME" 2>/dev/null || true
    ./node_modules/.bin/pm2 delete "$APP_NAME" 2>/dev/null || true
    ./node_modules/.bin/pm2 save 2>/dev/null || true
  elif command -v pm2 >/dev/null 2>&1; then
    pm2 stop "$APP_NAME" 2>/dev/null || true
    pm2 delete "$APP_NAME" 2>/dev/null || true
    pm2 save 2>/dev/null || true
  fi

  # Remove shortcut if present
  rm -f "$HOME/.local/bin/ielts-book" 2>/dev/null || true

  cd "$HOME"
  echo -e "${BLUE}🗑️ Đang xóa thư mục ứng dụng: $INSTALL_DIR ...${NC}"
  rm -rf "$INSTALL_DIR"

  echo -e "\n${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}${BOLD}✓ ĐÃ GỠ CÀI ĐẶT HOÀN TOÀN KHỎI MÁY!${NC}"
  echo -e "Tiến trình PM2 đã được xóa và toàn bộ tệp ứng dụng đã được giải phóng sạch sẽ."
  echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}\n"
}

ACTION="${1:-install}"

case "$ACTION" in
  install)
    do_install
    ;;
  update)
    do_update
    ;;
  delete|uninstall|remove)
    do_delete
    ;;
  *)
    echo "Lệnh không hợp lệ: $ACTION"
    echo "Sử dụng: bash install.sh [install|update|delete]"
    exit 1
    ;;
esac
