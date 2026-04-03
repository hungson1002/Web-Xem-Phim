import express from 'express';
import Auth from '../models/Auth.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import WatchRoom from '../models/WatchRoom.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const MAX_CHAT_LENGTH = 500;
const MAX_CHAT_HISTORY = 200;

const httpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const getRoomByCode = async (code) => {
    return WatchRoom.findOne({
        roomCode: String(code || '').toUpperCase(),
        isActive: true
    }).select('_id roomCode');
};

const getUserInfo = async (authId) => {
    const user = await Auth.findById(authId).select('name email avatar');
    if (!user) return null;

    return {
        id: user._id.toString(),
        name: user.name || user.email || 'Anonymous',
        avatar: user.avatar || null
    };
};

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

export default router;
