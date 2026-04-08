/*
  ============================================================
  TAI LIEU HOC TAP (BAN SAO CO CHU THICH THEO CUM LOGIC)
  Nguon goc: server/src/routes/WatchRoom.route.js
  Muc tieu:
  - Giu nguyen hanh vi code goc.
  - Giai thich theo CUM de de doc, de nho, de di van dap.
  ============================================================
*/

import express from 'express';
import mongoose from 'mongoose';
import Auth from '../models/Auth.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import WatchRoom from '../models/WatchRoom.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const MAX_CHAT_HISTORY = 200;

/*
  ============================================================
  CUM 1 - HELPER: TAO ROOM CODE 6 KY TU KHONG TRUNG
  ------------------------------------------------------------
  Tai sao can:
  - Moi phong watch party can mot ma ngan de nguoi dung tham gia.
  - Ma phai unique trong cac room dang active.

  Cach lam:
  1) Chon bo ky tu A-Z + 0-9.
  2) Sinh ngau nhien 6 ky tu.
  3) Query DB xem ma nay da ton tai o room active chua.
  4) Neu trung thi lap lai, neu khong trung thi return.

  Luu y:
  - Kiem tra trung chi tren room isActive = true.
  - Nghia la ma cua room da dong co the duoc tai su dung.
*/
const generateRoomCode = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let exists = true;

    while (exists) {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        exists = await WatchRoom.findOne({ roomCode: code, isActive: true });
    }

    return code;
};

/*
  ============================================================
  CUM 2 - HELPER: LAY THONG TIN USER TOI THIEU TU authId
  ------------------------------------------------------------
  Muc dich:
  - Chuan hoa du lieu user duoc dung trong room/chat.
  - Khong tra ve toan bo user document, chi lay field can thiet.

  Dau vao:
  - authId: ID da duoc verifyToken gan vao req.

  Dau ra:
  - Neu tim thay user: { id, name, email, avatar }
  - Neu khong tim thay: null
*/
const getUserInfo = async (authId) => {
    const user = await Auth.findById(authId).select('name email avatar');
    if (!user) return null;
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || null
    };
};

/*
  ============================================================
  CUM 3 - HELPER: LAY CHAT HISTORY GAN NHAT CUA ROOM
  ------------------------------------------------------------
  Muc dich:
  - Khi user vao room, can co lich su chat de theo kip ngu canh.

  Chi tiet ky thuat:
  - Query theo roomId.
  - Sort giam dan theo sentAt de lay nhanh "tin moi nhat truoc".
  - Limit MAX_CHAT_HISTORY (200).
  - Select bo _id de payload gon hon.
  - lean() de lay plain object, nhe hon mongoose document.
  - reverse() de doi lai thu tu tang dan theo thoi gian (cu -> moi)
    cho frontend hien thi chat tu tren xuong duoi tu nhien.
*/
const getRecentMessages = async (roomId) => {
    const messages = await ChatMessage.find({ room: roomId })
        .sort({ sentAt: -1 })
        .limit(MAX_CHAT_HISTORY)
        .select('-_id senderId senderName senderAvatar text sentAt')
        .lean();

    return messages.reverse();
};

/*
  ============================================================
  CUM 4 - HELPER: DONG GOI RESPONSE ROOM
  ------------------------------------------------------------
  Muc dich:
  - Tu room document, tao payload tra ve day du:
    + thong tin room
    + lich su message gan nhat
*/
const buildRoomResponse = async (roomDoc) => {
    const roomData = roomDoc.toObject();
    roomData.messages = await getRecentMessages(roomDoc._id);
    return roomData;
};

/*
  ============================================================
  CUM 5 - HELPER: TRANSACTION OPTIONAL (CO THI DUNG, KHONG THI FALLBACK)
  ------------------------------------------------------------
  Bai toan:
  - Mot so thao tac can "di cung nhau" (vd: dong room + xoa chat).
  - Tot nhat la transaction de tranh state nua voi.
  - Nhung Mongo standalone thuong KHONG ho tro transaction.

  Giai phap:
  - Thu chay session.withTransaction().
  - Neu trung loi "khong ho tro transaction", fallback chay khong transaction.
  - Van endSession() trong finally de khong ro ri tai nguyen.
*/
const isTransactionUnsupported = (error) => {
    const message = String(error?.message || '');
    return message.includes('Transaction numbers are only allowed on a replica set member or mongos');
};

const runWithOptionalTransaction = async (work) => {
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await work(session);
        });
        return result;
    } catch (error) {
        if (isTransactionUnsupported(error)) {
            console.warn('MongoDB deployment does not support transactions. Running without transaction.');
            return work(null);
        }
        throw error;
    } finally {
        await session.endSession();
    }
};

/*
  Helper nho de "gan session vao query" neu session ton tai.
  Neu dang fallback (session = null) thi query van chay binh thuong.
*/
const applySession = (query, session) => {
    if (session) {
        query.session(session);
    }
    return query;
};

/*
  ============================================================
  CUM 6 - AUTH CHO TOAN BO WATCH ROOM ROUTES
  ------------------------------------------------------------
  Sau dong nay, moi endpoint ben duoi deu can token hop le.
*/
router.use(verifyToken);

/*
  ============================================================
  API 1 - POST /api/watch-rooms
  Tao phong moi
  ------------------------------------------------------------
  Input body:
  - movieSlug (bat buoc)
  - movieName (bat buoc)
  - moviePoster (tuy chon)

  Luong xu ly:
  1) Lay authId tu req (da qua middleware).
  2) Tim user info.
  3) Validate du lieu movie.
  4) Sinh roomCode khong trung.
  5) Tao room moi, host la user hien tai.
  6) Tu dong dua host vao participants.
  7) Luu room, tra ve 201.
*/
router.post('/', async function(req, res) {
    try {
        const { movieSlug, movieName, moviePoster } = req.body;
        const authId = req.authId;

        const user = await getUserInfo(authId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!movieSlug || !movieName) {
            return res.status(400).json({
                success: false,
                message: 'Movie slug and name are required'
            });
        }

        const roomCode = await generateRoomCode();

        const room = new WatchRoom({
            roomCode,
            movieSlug,
            movieName,
            moviePoster: moviePoster || '',
            host: user.id,
            hostName: user.name || user.email,
            participants: [{
                user: user.id,
                name: user.name || user.email,
                avatar: user.avatar
            }]
        });

        await room.save();

        return res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: room
        });
    } catch (error) {
        console.error('Create room error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create room'
        });
    }
});

/*
  ============================================================
  API 2 - GET /api/watch-rooms
  Lay danh sach room dang active
  ------------------------------------------------------------
  Muc dich:
  - Hien thi lobby "phong dang hoat dong".

  Chi tiet:
  - Filter isActive: true.
  - Sort moi nhat truoc (createdAt giam dan).
  - Bo truong __v trong payload.
*/
router.get('/', async function(req, res) {
    try {
        const rooms = await WatchRoom.find({ isActive: true })
            .sort({ createdAt: -1 })
            .select('-__v');

        return res.json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('Get rooms error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get rooms'
        });
    }
});

/*
  ============================================================
  API 3 - GET /api/watch-rooms/:code
  Lay chi tiet 1 room + lich su chat
  ------------------------------------------------------------
  Luong:
  1) Tim room theo roomCode (upper case) va isActive.
  2) Neu khong co -> 404.
  3) Neu co -> build response kem messages.
*/
router.get('/:code', async function(req, res) {
    try {
        const { code } = req.params;

        const room = await WatchRoom.findOne({
            roomCode: code.toUpperCase(),
            isActive: true
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const roomData = await buildRoomResponse(room);

        return res.json({
            success: true,
            data: roomData
        });
    } catch (error) {
        console.error('Get room error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get room'
        });
    }
});

/*
  ============================================================
  API 4 - POST /api/watch-rooms/:code/join
  Tham gia phong
  ------------------------------------------------------------
  Luong:
  1) Lay user info tu authId.
  2) Tim room active theo code.
  3) Neu room khong ton tai -> 404.
  4) Neu user da trong participants -> khong add lai, tra room luon.
  5) Kiem tra gioi han thanh vien.
  6) Add participant moi va save room.
  7) Tra roomData (kem messages) cho frontend dong bo.
*/
router.post('/:code/join', async function(req, res) {
    try {
        const { code } = req.params;
        const authId = req.authId;

        const user = await getUserInfo(authId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const room = await WatchRoom.findOne({
            roomCode: code.toUpperCase(),
            isActive: true
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const alreadyJoined = room.participants.some(
            (p) => p.user.toString() === user.id
        );

        if (alreadyJoined) {
            const roomData = await buildRoomResponse(room);
            return res.json({
                success: true,
                message: 'Already in room',
                data: roomData
            });
        }

        if (room.participants.length >= room.maxParticipants) {
            return res.status(400).json({
                success: false,
                message: 'Room is full'
            });
        }

        room.participants.push({
            user: user.id,
            name: user.name || user.email,
            avatar: user.avatar
        });

        await room.save();

        const roomData = await buildRoomResponse(room);

        return res.json({
            success: true,
            message: 'Joined room successfully',
            data: roomData
        });
    } catch (error) {
        console.error('Join room error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to join room'
        });
    }
});

/*
  ============================================================
  API 5 - POST /api/watch-rooms/:code/leave
  Roi phong
  ------------------------------------------------------------
  Luong nghiep vu:
  - Luon remove user khoi participants.
  - Neu nguoi roi la host -> dong phong (isActive = false) + xoa chat room.

  Vi sao dung runWithOptionalTransaction:
  - Can dam bao tinh nhat quan khi vua sua room vua xoa chat.
  - Neu mongo khong ho tro transaction thi fallback van chay.
*/
router.post('/:code/leave', async function(req, res) {
    try {
        const { code } = req.params;
        const authId = req.authId;

        const result = await runWithOptionalTransaction(async (session) => {
            const room = await applySession(
                WatchRoom.findOne({
                    roomCode: code.toUpperCase(),
                    isActive: true
                }),
                session
            );

            if (!room) {
                return { notFound: true };
            }

            room.participants = room.participants.filter(
                (p) => p.user.toString() !== authId
            );

            if (room.host.toString() === authId) {
                room.isActive = false;
                await ChatMessage.deleteMany({ room: room._id }, session ? { session } : {});
            }

            await room.save(session ? { session } : {});
            return { roomClosed: !room.isActive };
        });

        if (result?.notFound) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        return res.json({
            success: true,
            message: result?.roomClosed ? 'Room closed' : 'Left room successfully'
        });
    } catch (error) {
        console.error('Leave room error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to leave room'
        });
    }
});

/*
  ============================================================
  API 6 - DELETE /api/watch-rooms/:code
  Host dong phong
  ------------------------------------------------------------
  Rule:
  - Chi host moi duoc dong phong.
  - Dong phong se:
    + room.isActive = false
    + xoa toan bo chat cua room

  Luong:
  1) Tim room active.
  2) Khong co -> notFound.
  3) Co room nhung khong phai host -> forbidden.
  4) Hop le -> dong room + xoa chat.
*/
router.delete('/:code', async function(req, res) {
    try {
        const { code } = req.params;
        const authId = req.authId;

        const result = await runWithOptionalTransaction(async (session) => {
            const room = await applySession(
                WatchRoom.findOne({
                    roomCode: code.toUpperCase(),
                    isActive: true
                }),
                session
            );

            if (!room) {
                return { notFound: true };
            }

            if (room.host.toString() !== authId) {
                return { forbidden: true };
            }

            room.isActive = false;
            await room.save(session ? { session } : {});
            await ChatMessage.deleteMany({ room: room._id }, session ? { session } : {});
            return { success: true };
        });

        if (result?.notFound) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        if (result?.forbidden) {
            return res.status(403).json({
                success: false,
                message: 'Only host can close the room'
            });
        }

        return res.json({
            success: true,
            message: 'Room closed successfully'
        });
    } catch (error) {
        console.error('Close room error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to close room'
        });
    }
});

/*
  ============================================================
  EXPORT ROUTER
  ============================================================
*/
export default router;
