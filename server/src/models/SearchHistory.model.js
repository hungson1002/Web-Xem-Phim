import mongoose from 'mongoose';

const SearchHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Auth',
            required: true
        },
        keyword: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },
        searchedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

SearchHistorySchema.index({ user: 1, keyword: 1 }, { unique: true });
SearchHistorySchema.index({ user: 1, searchedAt: -1 });

export default mongoose.model('SearchHistory', SearchHistorySchema);
