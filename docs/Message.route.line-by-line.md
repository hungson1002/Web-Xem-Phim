# Giải thích từng dòng: Message.route.js

Nguồn: `server/src/routes/Message.route.js`
Bản sao: `docs/Message.route.js`

| Dòng | Code | Giải thích |
|---:|---|---|
| 1 | `import express from 'express';` | Import module/phụ thuộc cần dùng trong file route này. |
| 2 | `import Auth from '../models/Auth.model.js';` | Import module/phụ thuộc cần dùng trong file route này. |
| 3 | `import ChatMessage from '../models/ChatMessage.model.js';` | Import module/phụ thuộc cần dùng trong file route này. |
| 4 | `import WatchRoom from '../models/WatchRoom.model.js';` | Import module/phụ thuộc cần dùng trong file route này. |
| 5 | `import { verifyToken } from '../middleware/authMiddleware.js';` | Import module/phụ thuộc cần dùng trong file route này. |
| 6 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 7 | `const router = express.Router();` | Khởi tạo router con của Express để khai báo endpoint. |
| 8 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 9 | `const MAX_CHAT_LENGTH = 500;` | Khai báo giới hạn độ dài tối đa của tin nhắn chat. |
| 10 | `const MAX_CHAT_HISTORY = 200;` | Khai báo số lượng tin nhắn lịch sử tối đa giữ lại. |
| 11 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 12 | `const httpError = (status, message) => {` | Helper tạo Error object có gắn HTTP status. |
| 13 | `    const error = new Error(message);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 14 | `    error.status = status;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 15 | `    return error;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 16 | `};` | Kết thúc block và statement. |
| 17 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 18 | `const getRoomByCode = async (code) => {` | Helper tìm room active theo roomCode. |
| 19 | `    return WatchRoom.findOne({` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 20 | `        roomCode: String(code \|\| '').toUpperCase(),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 21 | `        isActive: true` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 22 | `    }).select('_id roomCode');` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 23 | `};` | Kết thúc block và statement. |
| 24 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 25 | `const getUserInfo = async (authId) => {` | Helper lấy thông tin user từ authId. |
| 26 | `    const user = await Auth.findById(authId).select('name email avatar');` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 27 | `    if (!user) return null;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 28 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 29 | `    return {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 30 | `        id: user._id.toString(),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 31 | `        name: user.name \|\| user.email \|\| 'Anonymous',` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 32 | `        avatar: user.avatar \|\| null` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 33 | `    };` | Kết thúc block và statement. |
| 34 | `};` | Kết thúc block và statement. |
| 35 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 36 | `const trimRoomMessages = async (roomId) => {` | Helper dọn bớt tin nhắn cũ, chỉ giữ số lượng giới hạn. |
| 37 | `    const extraMessages = await ChatMessage.find({ room: roomId })` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 38 | `        .sort({ sentAt: -1 })` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 39 | `        .skip(MAX_CHAT_HISTORY)` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 40 | `        .select('_id')` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 41 | `        .lean();` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 42 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 43 | `    if (!extraMessages.length) return;` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 44 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 45 | `    await ChatMessage.deleteMany({` | Xóa tin nhắn theo điều kiện. |
| 46 | `        _id: { $in: extraMessages.map((message) => message._id) }` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 47 | `    });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 48 | `};` | Kết thúc block và statement. |
| 49 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 50 | `router.get('/:code', verifyToken, async function(req, res) {` | Endpoint GET /:code để lấy chi tiết phòng theo mã. |
| 51 | `    try {` | Mở khối try cho logic chính. |
| 52 | `        const { code } = req.params;` | Lấy code từ URL params. |
| 53 | `        const room = await getRoomByCode(code);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 54 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 55 | `        if (!room) {` | Validate room tồn tại. |
| 56 | `            throw httpError(404, 'Room not found');` | Ném lỗi có status tùy chỉnh để catch xử lý thống nhất. |
| 57 | `        }` | Đóng block scope hiện tại. |
| 58 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 59 | `        const messages = await ChatMessage.find({ room: room._id })` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 60 | `            .sort({ sentAt: -1 })` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 61 | `            .limit(MAX_CHAT_HISTORY)` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 62 | `            .select('-_id senderId senderName senderAvatar text sentAt')` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 63 | `            .lean();` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 64 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 65 | `        return res.status(200).json({` | Trả HTTP 200 khi thao tác thành công. |
| 66 | `            success: true,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 67 | `            data: messages.reverse()` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 68 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 69 | `    } catch (error) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 70 | `        console.error('Get messages error:', error);` | Log lỗi để debug phía server. |
| 71 | `        const status = error?.status ?? 500;` | Lấy status từ error hoặc dùng mặc định 500. |
| 72 | `        const message = error?.message \|\| 'Internal server error';` | Lấy message từ error hoặc dùng mặc định. |
| 73 | `        return res.status(status).json({ success: false, message });` | Trả lỗi theo status động. |
| 74 | `    }` | Đóng block scope hiện tại. |
| 75 | `});` | Đóng object/callback và kết thúc lời gọi hàm. |
| 76 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 77 | `router.post('/:code', verifyToken, async function(req, res) {` | Endpoint POST /:code có verify token để gửi tin nhắn. |
| 78 | `    try {` | Mở khối try cho logic chính. |
| 79 | `        const { code } = req.params;` | Lấy code từ URL params. |
| 80 | `        const authId = req.authId;` | Lấy authId từ request sau khi verify token. |
| 81 | `        const text = String(req.body?.text \|\| '').trim().slice(0, MAX_CHAT_LENGTH);` | Chuẩn hóa text: ép string, trim, và cắt theo giới hạn. |
| 82 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 83 | `        if (!text) {` | Validate tin nhắn không rỗng. |
| 84 | `            throw httpError(400, 'Message text is required');` | Ném lỗi có status tùy chỉnh để catch xử lý thống nhất. |
| 85 | `        }` | Đóng block scope hiện tại. |
| 86 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 87 | `        const [room, sender] = await Promise.all([` | Chạy song song query room và query sender. |
| 88 | `            getRoomByCode(code),` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 89 | `            getUserInfo(authId)` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 90 | `        ]);` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 91 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 92 | `        if (!room) {` | Validate room tồn tại. |
| 93 | `            throw httpError(404, 'Room not found');` | Ném lỗi có status tùy chỉnh để catch xử lý thống nhất. |
| 94 | `        }` | Đóng block scope hiện tại. |
| 95 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 96 | `        if (!sender) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 97 | `            throw httpError(401, 'User not found');` | Ném lỗi có status tùy chỉnh để catch xử lý thống nhất. |
| 98 | `        }` | Đóng block scope hiện tại. |
| 99 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 100 | `        const messagePayload = {` | Tạo payload message chuẩn trước khi lưu/trả về. |
| 101 | `            senderId: sender.id,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 102 | `            senderName: sender.name,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 103 | `            senderAvatar: sender.avatar,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 104 | `            text,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 105 | `            sentAt: new Date()` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 106 | `        };` | Kết thúc block và statement. |
| 107 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 108 | `        await ChatMessage.create({` | Tạo document tin nhắn mới trong ChatMessage. |
| 109 | `            room: room._id,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 110 | `            roomCode: room.roomCode,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 111 | `            ...messagePayload` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 112 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 113 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 114 | `        await trimRoomMessages(room._id);` | Dọn lịch sử chat để không vượt ngưỡng. |
| 115 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 116 | `        return res.status(201).json({` | Trả HTTP 201 khi tạo mới thành công. |
| 117 | `            success: true,` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 118 | `            data: messagePayload` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 119 | `        });` | Đóng object/callback và kết thúc lời gọi hàm. |
| 120 | `    } catch (error) {` | Dòng lệnh này thuộc luồng xử lý của route theo ngữ cảnh xung quanh. |
| 121 | `        console.error('Send message error:', error);` | Log lỗi để debug phía server. |
| 122 | `        const status = error?.status ?? 500;` | Lấy status từ error hoặc dùng mặc định 500. |
| 123 | `        const message = error?.message \|\| 'Internal server error';` | Lấy message từ error hoặc dùng mặc định. |
| 124 | `        return res.status(status).json({ success: false, message });` | Trả lỗi theo status động. |
| 125 | `    }` | Đóng block scope hiện tại. |
| 126 | `});` | Đóng object/callback và kết thúc lời gọi hàm. |
| 127 | ` ` | Dòng trống để tách các khối logic cho dễ đọc. |
| 128 | `export default router;` | Export router để server mount vào endpoint API. |
