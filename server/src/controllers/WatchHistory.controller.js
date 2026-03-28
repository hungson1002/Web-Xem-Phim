import mongoose from 'mongoose';
import WatchHistory from '../models/WatchHistory.model.js';

export const saveWatchHistory = async (req, res) => {
    try {
        const { movieSlug, lastEpisode } = req.body;

        if (!movieSlug) {
            return res.status(400).json({
                success: false,
                message: 'movieSlug is required'
            });
        }

        const updated = await WatchHistory.findOneAndUpdate(
            { user: req.authId, movieSlug },
            {
                $set: {
                    lastEpisode: lastEpisode || null,
                    lastWatchedAt: new Date()
                }
            },
            { new: true, upsert: true }
        );

        return res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getWatchHistory = async (req, res) => {
    try {
        const limit = Math.max(parseInt(req.query.limit || '12', 10), 1);

        const history = await WatchHistory.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.authId)
                }
            },
            { $sort: { lastWatchedAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'movies',
                    localField: 'movieSlug',
                    foreignField: 'slug',
                    as: 'movieDetails'
                }
            },
            { $unwind: { path: '$movieDetails', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    'movieDetails.lastEpisode': '$lastEpisode',
                    'movieDetails.lastWatchedAt': '$lastWatchedAt'
                }
            },
            {
                $project: {
                    _id: 1,
                    movie: '$movieDetails',
                    movieSlug: 1,
                    lastEpisode: 1,
                    lastWatchedAt: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
