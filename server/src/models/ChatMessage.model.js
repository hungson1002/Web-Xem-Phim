import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WatchRoom',
        required: true,
        index: true
    },
    roomCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    senderId: {
        type: String,
        required: true,
        trim: true
    },
    senderName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
    },
    senderAvatar: {
        type: String,
        default: null
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    sentAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

chatMessageSchema.index({ room: 1, sentAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
