# Giải thích từng dòng: WatchRoom.route.js

Nguồn: `server/src/routes/WatchRoom.route.js`
Bản sao: `docs/WatchRoom.route.js`

| Dòng | Code | Giải thích |
|---:|---|---|
| 1 | `import express from 'express';` | Import module/phụ thuộc cần dùng trong file route này. |
| 2 | `import mongoose from 'mongoose';` | Import module/phụ thuộc cần dùng trong file route này. |
| 3 | `import Auth from '../models/Auth.model.js';` | Import module/phụ thuộc cần dùng trong file route này. |
| 4 | `import ChatMessage from '../models/ChatMessage.model.js';` | Import module/phụ thuộc cần dùng trong file route này. |
| 5 | `import WatchRoom from '../models/WatchRoom.model.js';` | Import module/phụ thuộc cần dùng trong file route này. |
| 6 | `import { verifyToken } from '../middleware/authMiddleware.js';` | Import module/phụ thuộc cần dùng trong file route này. |
| 7 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 8 | `const router = express.Router();` | Khởi tạo router con của Express để khai báo endpoint. |
| 9 | `const MAX_CHAT_HISTORY = 200;` | Khai báo số lượng tin nhắn lịch sử tối đa giữ lại. |
| 10 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 11 | `const generateRoomCode = async () => {` | Helper async để sinh mã phòng watch party. |
| 12 | `    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';` | Tập ký tự dùng sinh room code. |
| 13 | `    let code;` | Biến tạm lưu room code. |
| 14 | `    let exists = true;` | Cờ kiểm tra room code đã tồn tại chưa. |
| 15 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 16 | `    while (exists) {` | Lặp đến khi tạo được mã phòng không trùng. |
| 17 | `        code = '';` | Reset chuỗi code trước mỗi lần sinh mới. |
| 18 | `        for (let i = 0; i < 6; i++) {` | Vòng lặp tạo từng ký tự cho mã phòng. |
| 19 | `            code += chars.charAt(Math.floor(Math.random() * chars.length));` | Nối thêm một ký tự random vào code. |
| 20 | `        }` | Đóng block scope hiện tại. |
| 21 | `        exists = await WatchRoom.findOne({ roomCode: code, isActive: true });` | Kiểm tra code vừa sinh có trùng room active không. |
| 22 | `    }` | Đóng block scope hiện tại. |
| 23 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 24 | `    return code;` | Trả room code đã hợp lệ. |
| 25 | `};` | Kết thúc block và statement. |
| 26 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 27 | `const getUserInfo = async (authId) => {` | Helper lấy thông tin user từ authId. |
| 28 | `    const user = await Auth.findById(authId).select('name email avatar');` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 29 | `    if (!user) return null;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 30 | `    return {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 31 | `        id: user._id.toString(),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 32 | `        name: user.name,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 33 | `        email: user.email,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 34 | `        avatar: user.avatar \|\| null` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 35 | `    };` | Kết thúc block và statement. |
| 36 | `};` | Kết thúc block và statement. |
| 37 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 38 | `const getRecentMessages = async (roomId) => {` | Helper lấy lịch sử chat gần nhất theo room id. |
| 39 | `    const messages = await ChatMessage.find({ room: roomId })` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 40 | `        .sort({ sentAt: -1 })` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 41 | `        .limit(MAX_CHAT_HISTORY)` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 42 | `        .select('-_id senderId senderName senderAvatar text sentAt')` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 43 | `        .lean();` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 44 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 45 | `    return messages.reverse();` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 46 | `};` | Kết thúc block và statement. |
| 47 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 48 | `const buildRoomResponse = async (roomDoc) => {` | Helper dựng payload response phòng, có đính kèm messages. |
| 49 | `    const roomData = roomDoc.toObject();` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 50 | `    roomData.messages = await getRecentMessages(roomDoc._id);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 51 | `    return roomData;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 52 | `};` | Kết thúc block và statement. |
| 53 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 54 | `const isTransactionUnsupported = (error) => {` | Helper kiểm tra MongoDB có báo lỗi không hỗ trợ transaction hay không. |
| 55 | `    const message = String(error?.message \|\| '');` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 56 | `    return message.includes('Transaction numbers are only allowed on a replica set member or mongos');` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 57 | `};` | Kết thúc block và statement. |
| 58 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 59 | `const runWithOptionalTransaction = async (work) => {` | Chạy logic bằng transaction; fallback thường nếu DB không hỗ trợ. |
| 60 | `    const session = await mongoose.startSession();` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 61 | `    try {` | Mở khối try cho logic chính. |
| 62 | `        let result;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 63 | `        await session.withTransaction(async () => {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 64 | `            result = await work(session);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 65 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 66 | `        return result;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 67 | `    } catch (error) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 68 | `        if (isTransactionUnsupported(error)) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 69 | `            console.warn('MongoDB deployment does not support transactions. Running without transaction.');` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 70 | `            return work(null);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 71 | `        }` | Đóng block scope hiện tại. |
| 72 | `        throw error;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 73 | `    } finally {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 74 | `        await session.endSession();` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 75 | `    }` | Đóng block scope hiện tại. |
| 76 | `};` | Kết thúc block và statement. |
| 77 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 78 | `const applySession = (query, session) => {` | Gắn session vào query khi transaction đang chạy. |
| 79 | `    if (session) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 80 | `        query.session(session);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 81 | `    }` | Đóng block scope hiện tại. |
| 82 | `    return query;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 83 | `};` | Kết thúc block và statement. |
| 84 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 85 | `router.use(verifyToken);` | Áp middleware verify token cho toàn bộ routes trong file. |
| 86 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 87 | `router.post('/', async function(req, res) {` | Endpoint POST / để tạo phòng. |
| 88 | `    try {` | Mở khối try cho logic chính. |
| 89 | `        const { movieSlug, movieName, moviePoster } = req.body;` | Lấy dữ liệu phim từ body request. |
| 90 | `        const authId = req.authId;` | Lấy authId từ request sau khi verify token. |
| 91 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 92 | `        const user = await getUserInfo(authId);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 93 | `        if (!user) {` | Validate user tồn tại. |
| 94 | `            return res.status(401).json({` | Trả HTTP 401 khi chưa xác thực/không hợp lệ. |
| 95 | `                success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 96 | `                message: 'User not found'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 97 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 98 | `        }` | Đóng block scope hiện tại. |
| 99 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 100 | `        if (!movieSlug \|\| !movieName) {` | Validate bắt buộc có movieSlug và movieName. |
| 101 | `            return res.status(400).json({` | Trả HTTP 400 cho request không hợp lệ. |
| 102 | `                success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 103 | `                message: 'Movie slug and name are required'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 104 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 105 | `        }` | Đóng block scope hiện tại. |
| 106 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 107 | `        const roomCode = await generateRoomCode();` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 108 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 109 | `        const room = new WatchRoom({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 110 | `            roomCode,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 111 | `            movieSlug,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 112 | `            movieName,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 113 | `            moviePoster: moviePoster \|\| '',` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 114 | `            host: user.id,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 115 | `            hostName: user.name \|\| user.email,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 116 | `            participants: [{` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 117 | `                user: user.id,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 118 | `                name: user.name \|\| user.email,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 119 | `                avatar: user.avatar` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 120 | `            }]` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 121 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 122 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 123 | `        await room.save();` | Lưu thay đổi room xuống MongoDB. |
| 124 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 125 | `        return res.status(201).json({` | Trả HTTP 201 khi tạo mới thành công. |
| 126 | `            success: true,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 127 | `            message: 'Room created successfully',` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 128 | `            data: room` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 129 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 130 | `    } catch (error) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 131 | `        console.error('Create room error:', error);` | Log lỗi để debug phía server. |
| 132 | `        return res.status(500).json({` | Trả HTTP 500 cho lỗi nội bộ server. |
| 133 | `            success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 134 | `            message: 'Failed to create room'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 135 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 136 | `    }` | Đóng block scope hiện tại. |
| 137 | `});` | Đóng object/callback và kết thúc lời gọi hàm. |
| 138 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 139 | `router.get('/', async function(req, res) {` | Endpoint GET / để lấy danh sách phòng active. |
| 140 | `    try {` | Mở khối try cho logic chính. |
| 141 | `        const rooms = await WatchRoom.find({ isActive: true })` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 142 | `            .sort({ createdAt: -1 })` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 143 | `            .select('-__v');` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 144 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 145 | `        return res.json({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 146 | `            success: true,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 147 | `            data: rooms` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 148 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 149 | `    } catch (error) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 150 | `        console.error('Get rooms error:', error);` | Log lỗi để debug phía server. |
| 151 | `        return res.status(500).json({` | Trả HTTP 500 cho lỗi nội bộ server. |
| 152 | `            success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 153 | `            message: 'Failed to get rooms'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 154 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 155 | `    }` | Đóng block scope hiện tại. |
| 156 | `});` | Đóng object/callback và kết thúc lời gọi hàm. |
| 157 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 158 | `router.get('/:code', async function(req, res) {` | Endpoint GET /:code để lấy chi tiết phòng theo mã. |
| 159 | `    try {` | Mở khối try cho logic chính. |
| 160 | `        const { code } = req.params;` | Lấy code từ URL params. |
| 161 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 162 | `        const room = await WatchRoom.findOne({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 163 | `            roomCode: code.toUpperCase(),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 164 | `            isActive: true` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 165 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 166 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 167 | `        if (!room) {` | Validate room tồn tại. |
| 168 | `            return res.status(404).json({` | Trả HTTP 404 khi không tìm thấy dữ liệu. |
| 169 | `                success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 170 | `                message: 'Room not found'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 171 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 172 | `        }` | Đóng block scope hiện tại. |
| 173 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 174 | `        const roomData = await buildRoomResponse(room);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 175 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 176 | `        return res.json({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 177 | `            success: true,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 178 | `            data: roomData` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 179 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 180 | `    } catch (error) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 181 | `        console.error('Get room error:', error);` | Log lỗi để debug phía server. |
| 182 | `        return res.status(500).json({` | Trả HTTP 500 cho lỗi nội bộ server. |
| 183 | `            success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 184 | `            message: 'Failed to get room'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 185 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 186 | `    }` | Đóng block scope hiện tại. |
| 187 | `});` | Đóng object/callback và kết thúc lời gọi hàm. |
| 188 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 189 | `router.post('/:code/join', async function(req, res) {` | Endpoint POST /:code/join để user tham gia phòng. |
| 190 | `    try {` | Mở khối try cho logic chính. |
| 191 | `        const { code } = req.params;` | Lấy code từ URL params. |
| 192 | `        const authId = req.authId;` | Lấy authId từ request sau khi verify token. |
| 193 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 194 | `        const user = await getUserInfo(authId);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 195 | `        if (!user) {` | Validate user tồn tại. |
| 196 | `            return res.status(401).json({` | Trả HTTP 401 khi chưa xác thực/không hợp lệ. |
| 197 | `                success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 198 | `                message: 'User not found'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 199 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 200 | `        }` | Đóng block scope hiện tại. |
| 201 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 202 | `        const room = await WatchRoom.findOne({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 203 | `            roomCode: code.toUpperCase(),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 204 | `            isActive: true` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 205 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 206 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 207 | `        if (!room) {` | Validate room tồn tại. |
| 208 | `            return res.status(404).json({` | Trả HTTP 404 khi không tìm thấy dữ liệu. |
| 209 | `                success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 210 | `                message: 'Room not found'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 211 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 212 | `        }` | Đóng block scope hiện tại. |
| 213 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 214 | `        const alreadyJoined = room.participants.some(` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 215 | `            (p) => p.user.toString() === user.id` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 216 | `        );` | Đóng lời gọi hàm hiện tại. |
| 217 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 218 | `        if (alreadyJoined) {` | Nếu user đã trong room thì trả dữ liệu phòng ngay. |
| 219 | `            const roomData = await buildRoomResponse(room);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 220 | `            return res.json({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 221 | `                success: true,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 222 | `                message: 'Already in room',` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 223 | `                data: roomData` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 224 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 225 | `        }` | Đóng block scope hiện tại. |
| 226 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 227 | `        if (room.participants.length >= room.maxParticipants) {` | Chặn join khi phòng đã full. |
| 228 | `            return res.status(400).json({` | Trả HTTP 400 cho request không hợp lệ. |
| 229 | `                success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 230 | `                message: 'Room is full'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 231 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 232 | `        }` | Đóng block scope hiện tại. |
| 233 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 234 | `        room.participants.push({` | Thêm user vào participants. |
| 235 | `            user: user.id,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 236 | `            name: user.name \|\| user.email,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 237 | `            avatar: user.avatar` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 238 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 239 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 240 | `        await room.save();` | Lưu thay đổi room xuống MongoDB. |
| 241 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 242 | `        const roomData = await buildRoomResponse(room);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 243 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 244 | `        return res.json({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 245 | `            success: true,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 246 | `            message: 'Joined room successfully',` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 247 | `            data: roomData` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 248 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 249 | `    } catch (error) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 250 | `        console.error('Join room error:', error);` | Log lỗi để debug phía server. |
| 251 | `        return res.status(500).json({` | Trả HTTP 500 cho lỗi nội bộ server. |
| 252 | `            success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 253 | `            message: 'Failed to join room'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 254 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 255 | `    }` | Đóng block scope hiện tại. |
| 256 | `});` | Đóng object/callback và kết thúc lời gọi hàm. |
| 257 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 258 | `router.post('/:code/leave', async function(req, res) {` | Endpoint POST /:code/leave để user rời phòng. |
| 259 | `    try {` | Mở khối try cho logic chính. |
| 260 | `        const { code } = req.params;` | Lấy code từ URL params. |
| 261 | `        const authId = req.authId;` | Lấy authId từ request sau khi verify token. |
| 262 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 263 | `        const result = await runWithOptionalTransaction(async (session) => {` | Chạy nhóm thao tác DB trong transaction/fallback. |
| 264 | `            const room = await applySession(` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 265 | `                WatchRoom.findOne({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 266 | `                    roomCode: code.toUpperCase(),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 267 | `                    isActive: true` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 268 | `                }),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 269 | `                session` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 270 | `            );` | Đóng lời gọi hàm hiện tại. |
| 271 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 272 | `            if (!room) {` | Validate room tồn tại. |
| 273 | `                return { notFound: true };` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 274 | `            }` | Đóng block scope hiện tại. |
| 275 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 276 | `            room.participants = room.participants.filter(` | Loại user hiện tại khỏi participants. |
| 277 | `                (p) => p.user.toString() !== authId` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 278 | `            );` | Đóng lời gọi hàm hiện tại. |
| 279 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 280 | `            if (room.host.toString() === authId) {` | Host rời thì phòng bị đóng. |
| 281 | `                room.isActive = false;` | Đánh dấu phòng không còn active. |
| 282 | `                await ChatMessage.deleteMany({ room: room._id }, session ? { session } : {});` | Xóa tin nhắn theo điều kiện. |
| 283 | `            }` | Đóng block scope hiện tại. |
| 284 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 285 | `            await room.save(session ? { session } : {});` | Lưu thay đổi room xuống MongoDB. |
| 286 | `            return { roomClosed: !room.isActive };` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 287 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 288 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 289 | `        if (result?.notFound) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 290 | `            return res.status(404).json({` | Trả HTTP 404 khi không tìm thấy dữ liệu. |
| 291 | `                success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 292 | `                message: 'Room not found'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 293 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 294 | `        }` | Đóng block scope hiện tại. |
| 295 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 296 | `        return res.json({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 297 | `            success: true,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 298 | `            message: result?.roomClosed ? 'Room closed' : 'Left room successfully'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 299 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 300 | `    } catch (error) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 301 | `        console.error('Leave room error:', error);` | Log lỗi để debug phía server. |
| 302 | `        return res.status(500).json({` | Trả HTTP 500 cho lỗi nội bộ server. |
| 303 | `            success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 304 | `            message: 'Failed to leave room'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 305 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 306 | `    }` | Đóng block scope hiện tại. |
| 307 | `});` | Đóng object/callback và kết thúc lời gọi hàm. |
| 308 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 309 | `router.delete('/:code', async function(req, res) {` | Endpoint DELETE /:code để host đóng phòng. |
| 310 | `    try {` | Mở khối try cho logic chính. |
| 311 | `        const { code } = req.params;` | Lấy code từ URL params. |
| 312 | `        const authId = req.authId;` | Lấy authId từ request sau khi verify token. |
| 313 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 314 | `        const result = await runWithOptionalTransaction(async (session) => {` | Chạy nhóm thao tác DB trong transaction/fallback. |
| 315 | `            const room = await applySession(` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 316 | `                WatchRoom.findOne({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 317 | `                    roomCode: code.toUpperCase(),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 318 | `                    isActive: true` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 319 | `                }),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 320 | `                session` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 321 | `            );` | Đóng lời gọi hàm hiện tại. |
| 322 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 323 | `            if (!room) {` | Validate room tồn tại. |
| 324 | `                return { notFound: true };` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 325 | `            }` | Đóng block scope hiện tại. |
| 326 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 327 | `            if (room.host.toString() !== authId) {` | Chỉ host được quyền đóng phòng. |
| 328 | `                return { forbidden: true };` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 329 | `            }` | Đóng block scope hiện tại. |
| 330 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 331 | `            room.isActive = false;` | Đánh dấu phòng không còn active. |
| 332 | `            await room.save(session ? { session } : {});` | Lưu thay đổi room xuống MongoDB. |
| 333 | `            await ChatMessage.deleteMany({ room: room._id }, session ? { session } : {});` | Xóa tin nhắn theo điều kiện. |
| 334 | `            return { success: true };` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 335 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 336 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 337 | `        if (result?.notFound) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 338 | `            return res.status(404).json({` | Trả HTTP 404 khi không tìm thấy dữ liệu. |
| 339 | `                success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 340 | `                message: 'Room not found'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 341 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 342 | `        }` | Đóng block scope hiện tại. |
| 343 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 344 | `        if (result?.forbidden) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 345 | `            return res.status(403).json({` | Trả HTTP 403 khi không đủ quyền. |
| 346 | `                success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 347 | `                message: 'Only host can close the room'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 348 | `            });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 349 | `        }` | Đóng block scope hiện tại. |
| 350 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 351 | `        return res.json({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 352 | `            success: true,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 353 | `            message: 'Room closed successfully'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 354 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 355 | `    } catch (error) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 356 | `        console.error('Close room error:', error);` | Log lỗi để debug phía server. |
| 357 | `        return res.status(500).json({` | Trả HTTP 500 cho lỗi nội bộ server. |
| 358 | `            success: false,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 359 | `            message: 'Failed to close room'` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 360 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 361 | `    }` | Đóng block scope hiện tại. |
| 362 | `});` | Đóng object/callback và kết thúc lời gọi hàm. |
| 363 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 364 | `export default router;` | Export router để server mount vào endpoint API. |
