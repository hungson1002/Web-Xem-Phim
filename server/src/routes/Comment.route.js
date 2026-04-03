import express from 'express';
import Comment from '../models/Comment.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const httpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

router.get('/:movieId', async function(req, res) {
    try {
        const { movieId } = req.params;

        const movieData = await Comment.findOne({ movieId })
            .populate({
                path: 'comments.userId',
                select: 'name avatar'
            });

        if (!movieData) {
            return res.status(200).json({ success: true, data: [] });
        }

        const sortedComments = movieData.comments.sort((a, b) => b.createdAt - a.createdAt);

        return res.status(200).json({ success: true, data: sortedComments });
    } catch (error) {
        console.error('Get comments error:', error);
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

router.post('/add', verifyToken, async function(req, res) {
    console.log('=== Add Comment Request (Embed Mode) ===');
    try {
        const { movieId, content, rating } = req.body;

        const userId = req.authId || req.userId;

        if (!content || !content.trim()) {
            throw httpError(400, 'Nội dung không được để trống');
        }

        if (!rating || rating < 1 || rating > 5) {
            throw httpError(400, 'Vui lòng chọn số sao (1-5)');
        }

        if (!userId) {
            throw httpError(401, 'Không tìm thấy User ID');
        }

        const newCommentItem = {
            userId: userId,
            content: content,
            rating: rating,
            createdAt: new Date()
        };

        const existingReview = await Comment.findOne({
            movieId: movieId,
            'comments.userId': userId
        });

        if (existingReview) {
            throw httpError(400, 'Bạn đã đánh giá phim này rồi!');
        }

        const updatedMovie = await Comment.findOneAndUpdate(
            { movieId: movieId },
            { $push: { comments: newCommentItem } },
            {
                new: true,
                upsert: true
            }
        ).populate('comments.userId', 'name avatar');

        const justAdded = updatedMovie.comments[updatedMovie.comments.length - 1];

        console.log('Comment pushed successfully to movie:', movieId);

        return res.status(201).json({ success: true, data: justAdded });
    } catch (error) {
        console.error('Add comment error details:', error);
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

router.delete('/:movieId/:commentId', verifyToken, async function(req, res) {
    try {
        const { movieId, commentId } = req.params;
        const userId = req.authId || req.userId;

        const updatedMovie = await Comment.findOneAndUpdate(
            { movieId: movieId },
            {
                $pull: {
                    comments: { _id: commentId, userId: userId }
                }
            },
            { new: true }
        );

        if (!updatedMovie) {
            throw httpError(404, 'Không tìm thấy bình luận hoặc bạn không có quyền xóa');
        }

        return res.status(200).json({ success: true, message: 'Đã xóa bình luận' });
    } catch (error) {
        console.error('Delete error:', error);
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

router.put('/:movieId/:commentId', verifyToken, async function(req, res) {
    try {
        const { movieId, commentId } = req.params;
        const { content, rating } = req.body;
        const userId = req.authId || req.userId;

        if (!content || !content.trim()) throw httpError(400, 'Nội dung trống');
        if (rating && (rating < 1 || rating > 5)) throw httpError(400, 'Số sao không hợp lệ');

        const updateFields = {
            'comments.$.content': content,
            'comments.$.updatedAt': new Date()
        };

        if (rating) {
            updateFields['comments.$.rating'] = rating;
        }

        const updatedMovie = await Comment.findOneAndUpdate(
            {
                movieId: movieId,
                'comments._id': commentId,
                'comments.userId': userId
            },
            {
                $set: updateFields
            },
            { new: true }
        ).populate('comments.userId', 'name avatar');

        if (!updatedMovie) {
            throw httpError(404, 'Không tìm thấy hoặc không có quyền sửa');
        }

        const editedComment = updatedMovie.comments.find((c) => c._id.toString() === commentId);

        return res.status(200).json({ success: true, data: editedComment });
    } catch (error) {
        console.error('Update error:', error);
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

export default router;
