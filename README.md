# 🎓 The Official Cambridge Guide to IELTS - Interactive Web Reader & AI Mentor

Ứng dụng đọc sách số thông minh và trợ giảng luyện thi IELTS chuyên sâu dành riêng cho cuốn sách tiêu chuẩn vàng **The Official Cambridge Guide to IELTS**.

🔗 **GitHub Repository:** [https://github.com/thaonv7995/ielst-book-starter.git](https://github.com/thaonv7995/ielst-book-starter.git)

---

## ⚡ Cài đặt & Quản lý bằng 1 dòng lệnh (One-Command)

Hỗ trợ macOS và Linux (Ubuntu/Debian/CentOS/Fedora). Yêu cầu máy đã cài sẵn **Node.js (18+)** và **Git**.

### 1. 📥 Cài đặt nhanh (Install)
Chạy lệnh sau trên Terminal để tự động tải, cài đặt dependencies, build production và khởi chạy ngầm tự động (Port **`38080`**):
```bash
curl -fsSL https://raw.githubusercontent.com/thaonv7995/ielst-book-starter/main/install.sh | bash
```
> Sau khi cài đặt hoàn tất, truy cập ứng dụng ngay tại: **[http://localhost:38080](http://localhost:38080)**

---

### 2. 🔄 Cập nhật phiên bản mới nhất (Update)
Chạy lệnh sau để tự động kéo mã nguồn mới nhất từ GitHub, build lại và reload tiến trình:
```bash
curl -fsSL https://raw.githubusercontent.com/thaonv7995/ielst-book-starter/main/install.sh | bash -s -- update
```

---

### 3. 🗑️ Gỡ cài đặt hoàn toàn (Delete / Uninstall)
Chạy lệnh sau để dừng tiến trình PM2, xóa tiến trình và dọn dẹp sạch sẽ toàn bộ thư mục:
```bash
curl -fsSL https://raw.githubusercontent.com/thaonv7995/ielst-book-starter/main/install.sh | bash -s -- delete
```

---

## 🚀 Địa chỉ Production Local
* **Web App:** [http://localhost:38080](http://localhost:38080) (hoặc [http://127.0.0.1:38080](http://127.0.0.1:38080))
* **Health Check API:** [http://localhost:38080/api/health](http://localhost:38080/api/health)
* **AI Streaming Proxy:** `http://localhost:38080/api/ai/proxy`

---

## 📦 GitHub Actions & Đóng gói Release Tự động

Dự án đã tích hợp sẵn GitHub Actions workflow tại [`.github/workflows/release.yml`](.github/workflows/release.yml).

### Cách tạo và phát hành bản Release mới:
Mỗi khi bạn muốn đóng gói và xuất bản một phiên bản chính thức, chỉ cần tạo và đẩy tag git:

```bash
# 1. Tạo tag phiên bản mới (ví dụ v1.0.0)
git tag v1.0.0

# 2. Đẩy tag lên GitHub
git push origin v1.0.0
```

GitHub Actions sẽ tự động:
1. Kích hoạt quy trình build production bundle (`npm run build`).
2. Nén toàn bộ mã nguồn và thư viện tĩnh thành gói độc lập: `ielst-book-starter-standalone.tar.gz`.
3. Tạo file mã băm kiểm tra tính toàn vẹn: `ielst-book-starter-standalone.tar.gz.sha256`.
4. Tự động xuất bản lên trang **Releases** của GitHub kèm ghi chú phát hành (Release Notes).

---

## 🛠️ Quản lý Process & Auto-Restart (PM2)

Ứng dụng được đóng gói thành tiến trình nền sản xuất (Production Daemon) tích hợp cơ chế **tự động khởi động lại khi crash (Auto-Restart)** và giám sát tài nguyên qua **PM2**:

| Lệnh | Lệnh CLI rút gọn | Chức năng |
| :--- | :--- | :--- |
| `npm run start` | `ielts-book start` | Khởi chạy ứng dụng chạy ngầm với PM2 (Auto-restart bật) |
| `npm run status` | `ielts-book status` | Xem trạng thái tiến trình, CPU, RAM và Uptime |
| `npm run restart` | `ielts-book restart` | Khởi động lại tiến trình |
| `npm run stop` | `ielts-book stop` | Tạm dừng tiến trình |
| `npm run logs` | `ielts-book logs` | Xem nhật ký log chạy ngầm theo thời gian thực |
| `npm run prod` | `ielts-book update` | Tự động build lại frontend và reload tiến trình sản xuất |
| `npm run serve` | — | Chạy server production trực tiếp ở foreground |
| `npm run dev` | — | Chạy dev server Vite với HMR (cổng 3000) |

---

## 📂 Kiến trúc Hệ thống

1. **Giao diện Đọc sách (Book Viewer):**
   * Hiển thị 398 trang sách độ phân giải cao, hỗ trợ xem đơn (Single Page) hoặc đôi (Double Page).
   * Lật trang mượt mà, chuyển trang theo mục lục (Table of Contents), bookmark và ghi chú.

2. **Hệ thống 70 Audio Tracks (Audio Player):**
   * Đồng bộ chính xác với từng trang bài tập trong sách.
   * Server hỗ trợ **HTTP 206 Partial Content (Byte Range Requests)** giúp tua audio siêu mượt mà không bị delay.

3. **Kho tri thức Văn bản gốc (Ground-Truth Knowledge Base):**
   * Đầy đủ 398 trang được OCR sạch (`public/page-texts/page_*.txt`).
   * Tự động tra cứu Tapescript và Đáp án (Answer Key) tương ứng với từng bài tập.

4. **Trợ giảng AI Mentor (AI Chat):**
   * Tích hợp OpenAI, AuxCloud, DeepSeek, Google Gemini, Groq, Ollama.
   * **Animation nhả chữ Typewriter 60fps** chân thực với con trỏ Neon phát sáng.
   * Khung chat kéo giãn tự do (Drag-to-resize) từ 360px đến 1050px.
   * Cụm icon Sao chép & Trả lời lại chỉ hiển thị khi đã hoàn tất câu trả lời.
   * Hệ thống AI Proxy tích hợp sẵn giải quyết triệt để lỗi chặn CORS từ trình duyệt.

---

## 📝 Tùy chỉnh Cổng & Cấu hình

Tệp cấu hình tiến trình đặt tại `ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [{
    name: 'ielts-book-web',
    script: './server.js',
    instances: 1,
    autorestart: true,
    max_memory_restart: '350M',
    env: {
      NODE_ENV: 'production',
      PORT: 38080,
      HOST: '0.0.0.0'
    }
  }]
};
```
Có thể đổi cổng bằng biến môi trường `PORT=xxxx npm run start`.
