# 🎬 Web Xem Phim

Ứng dụng web xem phim được xây dựng với Next.js và Node.js/Express.

![Movie App](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io)

## 📋 Giới thiệu

**Web Xem Phim** là một nền tảng xem phim trực tuyến hiện đại, cung cấp trải nghiệm người dùng mượt mà với giao diện đẹp mắt và nhiều tính năng hấp dẫn.

## ✨ Tính năng chính

### 🔐 Xác thực người dùng
- Đăng ký / Đăng nhập bằng email
- Đăng nhập bằng Google
- Quản lý hồ sơ cá nhân

### 🎥 Quản lý phim
- Xem danh sách phim theo thể loại
- Tìm kiếm phim
- Xem chi tiết và trailer phim
- Lọc phim theo năm, chất lượng, loại phim

### 💬 Tính năng cộng đồng
- Bình luận phim
- Lưu phim yêu thích (Bookmark)
- Xem phim cùng bạn bè (Watch Together) qua Socket.io

### 📺 Trình chiếu phim
- Giao diện phát video hiện đại
- Hỗ trợ nhiều chất lượng video
- Lịch sử xem phim

## 🏗️ Cấu trúc dự án

```
web-xem-phim/
├── client/                 # Frontend - Next.js 14
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── context/           # React Context
│   ├── lib/               # Utilities & API calls
│   └── package.json
│
├── server/                 # Backend - Node.js/Express
│   ├── src/
│   │   ├── config/        # Database & JWT config
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth & validation
│   │   └── server.js      # Entry point
│   └── package.json
│
└── README.md              # Tài liệu này
```

## 🛠️ Công nghệ sử dụng

### Frontend
| Công nghệ | Mô tả |
|-----------|-------|
| Next.js 14 | React framework với App Router |
| React 18 | UI Library |
| Axios | HTTP Client |
| Swiper | Slideshow/Carousel |
| Socket.io-client | Real-time communication |

### Backend
| Công nghệ | Mô tả |
|-----------|-------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB/Mongoose | Database |
| JWT | Authentication |
| Socket.io | Real-time features |
| Bcrypt.js | Password hashing |

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js 16+
- MongoDB (local hoặc Atlas)
- npm hoặc yarn

### 1. Clone dự án
```bash
git clone <repository-url>
cd web-xem-phim
```

### 2. Cài đặt Backend
```bash
cd server
npm install

# Tạo file .env từ template
copy .env.example .env

# Cấu hình các biến môi trường trong .env:
# - MONGODB_URI
# - JWT_SECRET
# - PORT

# Chạy server
npm run dev
```

### 3. Cài đặt Frontend
```bash
cd client
npm install

# Tạo file .env.local và cấu hình API URL

# Chạy client
npm run dev
```

### 4. Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/google` | Đăng nhập Google |
| GET | `/api/auth/profile` | Lấy thông tin user |

### Movies
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/movies` | Lấy danh sách phim |
| GET | `/api/movies/:slug` | Lấy chi tiết phim |

### Bookmarks
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/bookmarks` | Lấy phim đã lưu |
| POST | `/api/bookmarks` | Lưu phim |
| DELETE | `/api/bookmarks/:id` | Xóa phim đã lưu |

### Comments
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/comments/:movieId` | Lấy bình luận |
| POST | `/api/comments` | Thêm bình luận |

## 📝 Scripts

### Frontend (client/)
```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm start        # Chạy production server
npm run lint     # Kiểm tra lỗi code
```

### Backend (server/)
```bash
npm run dev      # Chạy với nodemon (auto-reload)
npm start        # Chạy production server
```

## 📄 License

ISC License

---

⭐ Nếu dự án hữu ích, hãy cho một star nhé!
