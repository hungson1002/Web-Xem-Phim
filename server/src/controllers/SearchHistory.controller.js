import SearchHistory from '../models/SearchHistory.model.js';

const MAX_HISTORY_ITEMS = 20;

export const getSearchHistory = async (req, res) => {
    try {
        const rawLimit = parseInt(req.query.limit || '10', 10);
        const limit = Number.isNaN(rawLimit) ? 10 : Math.max(1, Math.min(rawLimit, MAX_HISTORY_ITEMS));

        const history = await SearchHistory.find({ user: req.authId })
            .sort({ searchedAt: -1 })
            .limit(limit)
            .select('_id keyword searchedAt');

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

export const saveSearchHistory = async (req, res) => {
    try {
        const keyword = req.body.keyword?.trim();

        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'Keyword is required'
            });
        }

        const updated = await SearchHistory.findOneAndUpdate(
            { user: req.authId, keyword },
            {
                $set: {
                    searchedAt: new Date()
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        const overflowItems = await SearchHistory.find({ user: req.authId })
            .sort({ searchedAt: -1 })
            .skip(MAX_HISTORY_ITEMS)
            .select('_id');

        if (overflowItems.length > 0) {
            await SearchHistory.deleteMany({
                _id: { $in: overflowItems.map(item => item._id) }
            });
        }

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

export const deleteSearchHistoryItem = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await SearchHistory.findOneAndDelete({
            _id: id,
            user: req.authId
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'History item not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const clearSearchHistory = async (req, res) => {
    try {
        await SearchHistory.deleteMany({ user: req.authId });

        return res.status(200).json({
            success: true,
            message: 'Search history cleared'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
