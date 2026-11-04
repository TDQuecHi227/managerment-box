# Hệ Thống Quản Lý Box Chat Game (Box Chat Management System)

Ứng dụng web được xây dựng phục vụ quản lý thành viên cho box chat cộng đồng game (Node.js, ExpressJS, ReactJS).

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

- **Backend:** Node.js, ExpressJS, SQLite (`better-sqlite3`), `jsonwebtoken` (JWT), `bcryptjs`, `multer` (Upload ảnh minh chứng).
- **Frontend:** ReactJS, Vite, TailwindCSS, Lucide Icons.
- **Thiết kế:** Giao diện chuẩn thực tế, phong cách hiện đại với nền trắng, các nút hành động xanh dương nổi bật, tối ưu cho mobile và desktop.

---

## 🛠️ Hướng Dẫn Khởi Chạy

### 1. Khởi chạy máy chủ Production (Phục vụ cả Web và API trên cổng 5000)

```bash
# Từ thư mục gốc e:\ManagementBoxChat
node server/src/index.js
```
👉 Mở trình duyệt truy cập: **http://localhost:5000**

### 2. Khởi chạy chế độ Development (Hot Reloading)

Mở 2 cửa sổ terminal:

- **Terminal 1 (Backend API Port 5000):**
  ```bash
  cd server
  npm start
  ```
- **Terminal 2 (Frontend React Vite Port 3000):**
  ```bash
  cd client
  npm run dev
  ```
👉 Mở trình duyệt truy cập: **http://localhost:3000** (Vite tự động proxy các request `/api` và `/uploads` sang port 5000).

---

## 🔑 Tài Khoản Đăng Nhập

| Vai trò | Tài khoản | Mật khẩu | Chức năng |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Quản trị viên: Quản lý thành viên, duyệt Clone, cập nhật Donate (chọn thành viên + nhập tiền + ảnh minh chứng) |
| **Thành viên** | `member_clone1` | `clone123` | Nộp Clone, theo dõi KPI, xem quỹ & lịch sử Donate |
| **Thành viên** | `member_clone2` | `clone123` | Nộp Clone, theo dõi KPI, xem quỹ & lịch sử Donate |
| **Thành viên** | `member_donate1` | `donate123` | Nộp Clone, theo dõi KPI, xem quỹ & lịch sử Donate |

---

## 💡 Cách Thức Hoạt Động Mới (Cập nhật theo yêu cầu)
- **Bỏ vai trò Donate**: Toàn bộ thành viên trong box là thành viên thông thường (nộp clone và tính KPI).
- **Admin cập nhật Donate**: Admin là người trực tiếp ghi nhận các khoản đóng góp ủng hộ box:
  1. Chọn tên thành viên trong danh sách.
  2. Nhập số tiền ủng hộ (VNĐ).
  3. Tải lên ảnh minh chứng (biên lai/ảnh giao dịch chuyển khoản thành công).
  4. (Tùy chọn) Thêm ghi chú giao dịch.
- **Thành viên xem minh bạch**: Thành viên có thể theo dõi thông tin tài khoản chuyển khoản của Box, lịch sử các khoản Donate của bản thân đã được Admin ghi nhận, cũng như bảng sao kê minh bạch toàn box.
# managerment-box
