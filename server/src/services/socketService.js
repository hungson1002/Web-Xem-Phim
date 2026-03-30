import ChatMessage from '../models/ChatMessage.model.js';
import WatchRoom from '../models/WatchRoom.model.js';

// Store active socket connections per room
const roomSockets = new Map(); // roomCode -> Set of socket ids
const socketRooms = new Map(); // socketId -> roomCode
const MAX_CHAT_LENGTH = 500;
const MAX_CHAT_HISTORY = 200;

const trimRoomMessages = async (roomId) => {
    const extraMessages = await ChatMessage.find({ room: roomId })
        .sort({ sentAt: -1 })
        .skip(MAX_CHAT_HISTORY)
        .select('_id')
        .lean();

    if (!extraMessages.length) {
        return;
    }

    await ChatMessage.deleteMany({
        _id: { $in: extraMessages.map((message) => message._id) }
    });
};

export const initializeSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join a watch room
        socket.on('join-room', async (data) => {
            try {
                const { roomCode, userId, userName } = data;
                const upperCode = roomCode.toUpperCase();

                // Leave previous room if any
                const previousRoom = socketRooms.get(socket.id);
                if (previousRoom) {
                    socket.leave(previousRoom);
                    const roomSet = roomSockets.get(previousRoom);
                    if (roomSet) {
                        roomSet.delete(socket.id);
                    }
                }

                // Join new room
                socket.join(upperCode);
                socketRooms.set(socket.id, upperCode);

                if (!roomSockets.has(upperCode)) {
                    roomSockets.set(upperCode, new Set());
                }
                roomSockets.get(upperCode).add(socket.id);

                // Get current room state from DB
                const room = await WatchRoom.findOne({
                    roomCode: upperCode,
                    isActive: true
                });

                if (room) {
                    // Send current state to the joining user
                    socket.emit('sync-state', {
                        currentTime: room.currentTime,
                        isPlaying: room.isPlaying,
                        currentServer: room.currentServer,
                        currentEpisode: room.currentEpisode
                    });

                    // Notify others about new participant
                    socket.to(upperCode).emit('user-joined', {
                        oderId: userId,
                        userName: userName,
                        participantCount: roomSockets.get(upperCode).size
                    });
                }

                console.log(`User ${socket.id} joined room ${upperCode}`);
            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Leave room
        socket.on('leave-room', (data) => {
            const { roomCode } = data;
            const upperCode = roomCode.toUpperCase();

            socket.leave(upperCode);
            socketRooms.delete(socket.id);

            const roomSet = roomSockets.get(upperCode);
            if (roomSet) {
                roomSet.delete(socket.id);

                // Notify others
                socket.to(upperCode).emit('user-left', {
                    participantCount: roomSet.size
                });
            }

            console.log(`User ${socket.id} left room ${upperCode}`);
        });

        // Video play event
        socket.on('video-play', async (data) => {
            const { roomCode, currentTime, userId } = data;
            const upperCode = roomCode.toUpperCase();

            // Update DB
            await WatchRoom.findOneAndUpdate(
                { roomCode: upperCode, isActive: true },
                { isPlaying: true, currentTime: currentTime }
            );

            // Broadcast to others in room
            socket.to(upperCode).emit('video-play', {
                currentTime: currentTime,
                triggeredBy: userId
            });

            console.log(`Room ${upperCode}: Play at ${currentTime}s`);
        });

        // Video pause event
        socket.on('video-pause', async (data) => {
            const { roomCode, currentTime, userId } = data;
            const upperCode = roomCode.toUpperCase();

            // Update DB
            await WatchRoom.findOneAndUpdate(
                { roomCode: upperCode, isActive: true },
                { isPlaying: false, currentTime: currentTime }
            );

            // Broadcast to others in room
            socket.to(upperCode).emit('video-pause', {
                currentTime: currentTime,
                triggeredBy: userId
            });

            console.log(`Room ${upperCode}: Pause at ${currentTime}s`);
        });

        // Video seek event
        socket.on('video-seek', async (data) => {
            const { roomCode, currentTime, userId } = data;
            const upperCode = roomCode.toUpperCase();

            // Update DB
            await WatchRoom.findOneAndUpdate(
                { roomCode: upperCode, isActive: true },
                { currentTime: currentTime }
            );

            // Broadcast to others in room
            socket.to(upperCode).emit('video-seek', {
                currentTime: currentTime,
                triggeredBy: userId
            });

            console.log(`Room ${upperCode}: Seek to ${currentTime}s`);
        });

        // Episode change event
        socket.on('episode-change', async (data) => {
            const { roomCode, serverIndex, episodeIndex, userId } = data;
            const upperCode = roomCode.toUpperCase();

            // Update DB
            await WatchRoom.findOneAndUpdate(
                { roomCode: upperCode, isActive: true },
                {
                    currentServer: serverIndex,
                    currentEpisode: episodeIndex,
                    currentTime: 0,
                    isPlaying: false
                }
            );

            // Broadcast to others in room
            socket.to(upperCode).emit('episode-change', {
                serverIndex: serverIndex,
                episodeIndex: episodeIndex,
                triggeredBy: userId
            });

            console.log(`Room ${upperCode}: Episode changed to S${serverIndex}E${episodeIndex}`);
        });

        // Request sync from host
        socket.on('sync-request', async (data) => {
            const { roomCode } = data;
            const upperCode = roomCode.toUpperCase();

            const room = await WatchRoom.findOne({
                roomCode: upperCode,
                isActive: true
            });

            if (room) {
                socket.emit('sync-state', {
                    currentTime: room.currentTime,
                    isPlaying: room.isPlaying,
                    currentServer: room.currentServer,
                    currentEpisode: room.currentEpisode
                });
            }
        });

        // Realtime chat message
        socket.on('chat-message', async (data) => {
            try {
                const {
                    roomCode,
                    senderId,
                    senderName,
                    senderAvatar,
                    text
                } = data || {};

                const upperCode = String(roomCode || '').toUpperCase();
                const cleanText = String(text || '').trim().slice(0, MAX_CHAT_LENGTH);

                if (!upperCode || !cleanText || !senderId) {
                    return;
                }

                const messagePayload = {
                    senderId: String(senderId),
                    senderName: String(senderName || 'Anonymous').trim().slice(0, 60) || 'Anonymous',
                    senderAvatar: senderAvatar || null,
                    text: cleanText,
                    sentAt: new Date()
                };

                const room = await WatchRoom.findOne({
                    roomCode: upperCode,
                    isActive: true
                }).select('_id roomCode');

                if (!room) {
                    return;
                }

                await ChatMessage.create({
                    room: room._id,
                    roomCode: room.roomCode,
                    ...messagePayload
                });

                await trimRoomMessages(room._id);

                io.to(upperCode).emit('chat-message', messagePayload);
            } catch (error) {
                console.error('Chat message error:', error);
            }
        });

        // Room closed by host
        socket.on('close-room', (data) => {
            const { roomCode } = data;
            const upperCode = roomCode.toUpperCase();

            // Notify all users in room
            io.to(upperCode).emit('room-closed', {
                message: 'Host has closed the room'
            });

            // Clear room data
            roomSockets.delete(upperCode);

            console.log(`Room ${upperCode} closed`);
        });

        // Disconnect
        socket.on('disconnect', () => {
            const roomCode = socketRooms.get(socket.id);

            if (roomCode) {
                const roomSet = roomSockets.get(roomCode);
                if (roomSet) {
                    roomSet.delete(socket.id);

                    // Notify others
                    socket.to(roomCode).emit('user-left', {
                        participantCount: roomSet.size
                    });
                }
                socketRooms.delete(socket.id);
            }

            console.log('User disconnected:', socket.id);
        });
    });
};

export default initializeSocket;
