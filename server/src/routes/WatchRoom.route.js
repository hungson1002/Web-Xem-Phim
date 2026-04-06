import express from 'express';
import mongoose from 'mongoose';
import Auth from '../models/Auth.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import WatchRoom from '../models/WatchRoom.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const MAX_CHAT_HISTORY = 200;

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

const getRecentMessages = async (roomId) => {
    const messages = await ChatMessage.find({ room: roomId })
        .sort({ sentAt: -1 })
        .limit(MAX_CHAT_HISTORY)
        .select('-_id senderId senderName senderAvatar text sentAt')
        .lean();

    return messages.reverse();
};

const buildRoomResponse = async (roomDoc) => {
    const roomData = roomDoc.toObject();
    roomData.messages = await getRecentMessages(roomDoc._id);
    return roomData;
};

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

const applySession = (query, session) => {
    if (session) {
        query.session(session);
    }
    return query;
};

// All routes require authentication
router.use(verifyToken);

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

export default router;
