import mongoose from 'mongoose';

const WatchHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Auth',
            required: true
        },
        movieSlug: {
            type: String,
            required: true
        },
        lastEpisode: {
            name: { type: String },
            slug: { type: String }
        },
        lastWatchedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

WatchHistorySchema.index({ user: 1, movieSlug: 1 }, { unique: true });
WatchHistorySchema.index({ user: 1, lastWatchedAt: -1 });

export default mongoose.model('WatchHistory', WatchHistorySchema);
