import Comment from '../models/Comment.model.js';
const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// Lấy tất cả bình luận của một bộ phim
export const getCommentsByMovie = async (req) => {
  try {
    const { movieId } = req.params;

    const movieData = await Comment.findOne({ movieId })
      .populate({
        path: 'comments.userId',
        select: 'name avatar'
      });

    if (!movieData) {
      return { success: true, data: [] };
    }

    const sortedComments = movieData.comments.sort((a, b) => b.createdAt - a.createdAt);

    return { success: true, data: sortedComments };
  } catch (error) {
    console.error("Get comments error:", error);
    throw error;
  }
};

// Thêm bình luận mới
export const addComment = async (req) => {
  console.log("=== Add Comment Request (Embed Mode) ===");
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
      "comments.userId": userId
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

    console.log("Comment pushed successfully to movie:", movieId);

    return { success: true, data: justAdded };

  } catch (error) {
    console.error("Add comment error details:", error);
    throw error;
  }
};

// Xóa bình luận
export const deleteComment = async (req) => {
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

    return { success: true, message: 'Đã xóa bình luận' };

  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
};

// Sửa bình luận
export const updateComment = async (req) => {
  try {
    const { movieId, commentId } = req.params;
    const { content, rating } = req.body;
    const userId = req.authId || req.userId;

    if (!content || !content.trim()) throw httpError(400, 'Nội dung trống');
    if (rating && (rating < 1 || rating > 5)) throw httpError(400, 'Số sao không hợp lệ');

    const updateFields = {
      "comments.$.content": content,
      "comments.$.updatedAt": new Date()
    };

    if (rating) {
      updateFields["comments.$.rating"] = rating;
    }

    const updatedMovie = await Comment.findOneAndUpdate(
      {
        movieId: movieId,
        "comments._id": commentId,
        "comments.userId": userId
      },
      {
        $set: updateFields
      },
      { new: true }
    ).populate('comments.userId', 'name avatar');

    if (!updatedMovie) {
      throw httpError(404, 'Không tìm thấy hoặc không có quyền sửa');
    }

    const editedComment = updatedMovie.comments.find(c => c._id.toString() === commentId);

    return { success: true, data: editedComment };

  } catch (error) {
    console.error("Update error:", error);
    throw error;
  }
};