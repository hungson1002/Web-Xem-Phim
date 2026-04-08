# Tài liệu API Web Xem Phim

**Base URL:** `http://localhost:5000/api`

Tài liệu này bao gồm danh sách các API Endpoint có sẵn trong hệ thống cùng với mẫu Payload sử dụng cho Postman.

---

## 1. Xác thực (Authentication)
Endpoint: `/api/auth`

### 1.1 Đăng ký
- **Endpoint:** `POST /register`
- **Mô tả:** Đăng ký tải khoản mới. Hệ thống sẽ gửi OTP về email.
- **Body Sample (JSON):**
```json
{
  "name": "Nguyễn Văn A",
  "username": "nguyenvana",
  "email": "test@example.com",
  "password": "password123"
}
```

### 1.2 Đăng nhập
- **Endpoint:** `POST /login`
- **Mô tả:** Đăng nhập lấy Token.
- **Body Sample (JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### 1.3 Xác thực Email (OTP)
- **Endpoint:** `POST /verify-email`
- **Body Sample (JSON):**
```json
{
  "email": "test@example.com",
  "otp": "123456"
}
```

---

## 2. Quản lý Người Dùng (User)
Endpoint: `/api/user`
**Lưu ý:** Bắt buộc Header `Authorization: Bearer <token>`

### 2.1 Lấy thông tin User theo ID
- **Endpoint:** `GET /:id`

### 2.2 Cập nhật Profile
- **Endpoint:** `PUT /:id`
- **Loại:** `multipart/form-data` hoặc `application/json`
- **Body Sample (JSON):**
```json
{
  "name": "Tên mới",
  "currentPassword": "password123",
  "newPassword": "newpassword123",
  "avatar": "url_anh_moi"
}
```

---

## 3. Phim (Movies)
Endpoint: `/api/movies`

### 3.1 Lấy danh sách Phim
- **Endpoint:** `GET /`
- **Query Params:** `?page=1&limit=20&search=batman&sort=year-desc`
- **Response tham khảo:**
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}
```

### 3.2 Lấy thông tin Phim bằng Slug
- **Endpoint:** `GET /:slug`

### 3.3 Lọc phim theo Danh mục & Quốc gia
- **Endpoint:** `GET /category/:slug`
- **Endpoint:** `GET /country/:slug`

---

## 4. Tương tác - Bình luận (Comments)
Endpoint: `/api/comments`

### 4.1 Lấy bình luận của 1 phim
- **Endpoint:** `GET /:movieId`

### 4.2 Thêm bình luận (Cần Bearer Token)
- **Endpoint:** `POST /add`
- **Body Sample (JSON):**
```json
{
  "movieId": "id_cua_phim",
  "content": "Phim này rất hay!",
  "rating": 5
}
```

---

## 5. Danh sách Yêu thích (Bookmarks)
Endpoint: `/api/bookmarks`
**Lưu ý:** Tất cả APIs cần Header `Authorization: Bearer <token>`

### 5.1 Lưu phim vào Bookmark
- **Endpoint:** `POST /`
- **Body Sample (JSON):**
```json
{
  "movieId": "123",
  "movieSlug": "batman-2022",
  "movieName": "Batman 2022",
  "posterUrl": "...",
  "year": 2022,
  "category": [{"id": "1", "name": "Hành động", "slug": "hanh-dong"}]
}
```

### 5.2 Lấy danh sách Bookmark và Kiểm tra DB
- **Endpoint:** `GET /` (Lấy tất cả phim đã lưu)
- **Endpoint:** `GET /check/:movieId` (Kiểm tra xem phim 123 đã lưu chưa)
- **Endpoint:** `DELETE /:movieId` (Xóa khỏi danh sách lưu)

---

## 6. Xem chung (Watch Rooms)
Endpoint: `/api/watch-rooms`
**Lưu ý:** Cần Header `Authorization: Bearer <token>`

### 6.1 Tạo phòng xem chung (Host)
- **Endpoint:** `POST /`
- **Body Sample (JSON):**
```json
{
  "movieSlug": "batman-2022",
  "movieName": "The Batman",
  "moviePoster": "url_anh"
}
```

### 6.2 Tham gia & Rời phòng
- **Endpoint:** `POST /:code/join` (Vào phòng)
- **Endpoint:** `POST /:code/leave` (Thoát)
- **Endpoint:** `DELETE /:code` (Chủ phòng đóng cửa phòng)

---

## 7. Quản trị viên (Admin)
Endpoint: `/api/admin`
**Lưu ý:** Cần Role `admin` & Bearer Token.

### 7.1 Quản lý Users
- **Endpoint:** `GET /users?page=1&limit=10&status=active` (Lấy danh sách)
- **Endpoint:** `PATCH /users/:id/toggle-active` (Khóa/Mở Khóa tk)
- **Endpoint:** `PATCH /users/:id/soft-delete` (Xóa mềm tk)
- **Endpoint:** `PATCH /users/:id/restore` (Khôi phục tk)
