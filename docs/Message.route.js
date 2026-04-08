/*
  ============================================================
  TAI LIEU HOC TAP (BAN SAO CO CHU THICH THEO CUM LOGIC)
  Nguon goc: server/src/routes/Message.route.js
  Muc tieu:
  - Giu nguyen hanh vi code goc.
  - Giai thich theo CUM de de doc, de nho, de di van dap.
  ============================================================
*/

import express from 'express';
import Auth from '../models/Auth.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import WatchRoom from '../models/WatchRoom.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const MAX_CHAT_LENGTH = 500;
const MAX_CHAT_HISTORY = 200;

/*
  ============================================================
  CUM 1 - HELPER TAO ERROR CO STATUS HTTP
  ------------------------------------------------------------
  Bai toan:
  - Trong route can throw loi nghiep vu (400/401/404...) thay vi chi 500.
  - JavaScript Error mac dinh khong co status.

  Giai phap:
  - Tao helper httpError(status, message).
  - throw error nay trong try.
  - catch doc error.status de tra dung ma loi.
*/
const httpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

/*
  ============================================================
  CUM 2 - HELPER TIM ROOM ACTIVE THEO MA
  ------------------------------------------------------------
  Muc dich:
  - Tat ca API message deu can xac dinh room hop le truoc.

  Chi tiet:
  - Chuan hoa code: ep string + upper case.
  - Chi lay room isActive = true.
  - select('_id roomCode') de payload/query gon, du dung cho message.
*/
const getRoomByCode = async (code) => {
    return WatchRoom.findOne({
        roomCode: String(code || '').toUpperCase(),
        isActive: true
    }).select('_id roomCode');
};

/*
  ============================================================
  CUM 3 - HELPER LAY SENDER INFO TU authId
  ------------------------------------------------------------
  Muc dich:
  - Lay thong tin nguoi gui de dong nhat payload chat.
  - Tranh phu thuoc du lieu gui len tu client.

  Dau ra:
  - id: string
  - name: uu tien user.name, fallback email, fallback 'Anonymous'
  - avatar: null neu khong co
*/
const getUserInfo = async (authId) => {
    const user = await Auth.findById(authId).select('name email avatar');
    if (!user) return null;

    return {
        id: user._id.toString(),
        name: user.name || user.email || 'Anonymous',
        avatar: user.avatar || null
    };
};

/*
  ============================================================
  CUM 4 - HELPER DON DEP LICH SU CHAT THEO NGUONG
  ------------------------------------------------------------
  Muc dich:
  - Khong de collection ChatMessage phinh vo han trong moi room.
  - Chi giu lai MAX_CHAT_HISTORY tin gan nhat.

  Cach lam:
  1) Tim message theo room, sort moi nhat truoc.
  2) skip(MAX_CHAT_HISTORY) de lay phan "du thua".
  3) deleteMany cac _id du thua.
*/
const trimRoomMessages = async (roomId) => {
    const extraMessages = await ChatMessage.find({ room: roomId })
        .sort({ sentAt: -1 })
        .skip(MAX_CHAT_HISTORY)
        .select('_id')
        .lean();

    if (!extraMessages.length) return;

    await ChatMessage.deleteMany({
        _id: { $in: extraMessages.map((message) => message._id) }
    });
};

/*
  ============================================================
  API 1 - GET /api/messages/:code
  Lay lich su tin nhan theo room code
  ------------------------------------------------------------
  Bao mat:
  - Co verifyToken -> chi user da login moi doc duoc.

  Luong:
  1) Tim room active theo code.
  2) Khong co room -> throw 404.
  3) Query message cua room:
     - sort moi nhat truoc, limit 200, lean + select field can thiet.
  4) reverse() de tra ve theo thu tu cu -> moi cho UI chat.
*/
router.get('/:code', verifyToken, async function(req, res) {
    try {
        const { code } = req.params;
        const room = await getRoomByCode(code);

        if (!room) {
            throw httpError(404, 'Room not found');
        }

        const messages = await ChatMessage.find({ room: room._id })
            .sort({ sentAt: -1 })
            .limit(MAX_CHAT_HISTORY)
            .select('-_id senderId senderName senderAvatar text sentAt')
            .lean();

        return res.status(200).json({
            success: true,
            data: messages.reverse()
        });
    } catch (error) {
        console.error('Get messages error:', error);
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

/*
  ============================================================
  API 2 - POST /api/messages/:code
  Gui tin nhan vao room
  ------------------------------------------------------------
  Bao mat:
  - Co verifyToken.
  - sender duoc xac dinh bang authId tren server, khong tin client.

  Luong:
  1) Chuan hoa text: ep string, trim, cat toi da 500 ky tu.
  2) Neu rong -> throw 400.
  3) Promise.all de lay song song:
     - room active
     - sender info
  4) Validate room/sender ton tai.
  5) Tao messagePayload (sender + text + sentAt).
  6) Luu vao ChatMessage.
  7) trimRoomMessages de giu room gon.
  8) Tra 201 + messagePayload.
*/
router.post('/:code', verifyToken, async function(req, res) {
    try {
        const { code } = req.params;
        const authId = req.authId;
        const text = String(req.body?.text || '').trim().slice(0, MAX_CHAT_LENGTH);

        if (!text) {
            throw httpError(400, 'Message text is required');
        }

        const [room, sender] = await Promise.all([
            getRoomByCode(code),
            getUserInfo(authId)
        ]);

        if (!room) {
            throw httpError(404, 'Room not found');
        }

        if (!sender) {
            throw httpError(401, 'User not found');
        }

        const messagePayload = {
            senderId: sender.id,
            senderName: sender.name,
            senderAvatar: sender.avatar,
            text,
            sentAt: new Date()
        };

        await ChatMessage.create({
            room: room._id,
            roomCode: room.roomCode,
            ...messagePayload
        });

        await trimRoomMessages(room._id);

        return res.status(201).json({
            success: true,
            data: messagePayload
        });
    } catch (error) {
        console.error('Send message error:', error);
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

/*
  ============================================================
  EXPORT ROUTER
  ============================================================
*/
export default router;
