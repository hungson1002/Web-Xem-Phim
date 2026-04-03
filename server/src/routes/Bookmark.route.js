import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import Bookmark from '../models/Bookmark.model.js';

const router = express.Router();

// All routes require authentication
router.get('/', verifyToken, async function(req, res) {
    try {
        const userId = req.authId;

        const bookmarks = await Bookmark.find({ userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookmarks.length,
            bookmarks
        });
    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách phim đã lưu'
        });
    }
});

router.post('/', verifyToken, async function(req, res) {
    try {
        const userId = req.authId;
        const { movieId, movieSlug, movieName, posterUrl, year, category } = req.body;

        if (!movieId || !movieSlug || !movieName) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin phim (movieId, movieSlug, movieName)'
            });
        }

        const existingBookmark = await Bookmark.findOne({ userId, movieId });
        if (existingBookmark) {
            return res.status(400).json({
                success: false,
                message: 'Phim đã có trong danh sách lưu'
            });
        }

        const bookmark = new Bookmark({
            userId,
            movieId,
            movieSlug,
            movieName,
            posterUrl: posterUrl || '',
            year: year || 0,
            category: category || []
        });

        await bookmark.save();

        res.status(201).json({
            success: true,
            message: 'Đã lưu phim thành công',
            bookmark
        });
    } catch (error) {
        console.error('Add bookmark error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Phim đã có trong danh sách lưu'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lưu phim'
        });
    }
});

router.delete('/:movieId', verifyToken, async function(req, res) {
    try {
        const userId = req.authId;
        const { movieId } = req.params;

        const bookmark = await Bookmark.findOneAndDelete({ userId, movieId });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phim trong danh sách lưu'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã xóa phim khỏi danh sách lưu'
        });
    } catch (error) {
        console.error('Remove bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa phim'
        });
    }
});

router.get('/check/:movieId', verifyToken, async function(req, res) {
    try {
        const userId = req.authId;
        const { movieId } = req.params;

        const bookmark = await Bookmark.findOne({ userId, movieId });

        res.status(200).json({
            success: true,
            isBookmarked: !!bookmark
        });
    } catch (error) {
        console.error('Check bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi kiểm tra trạng thái lưu'
        });
    }
});

export default router;
