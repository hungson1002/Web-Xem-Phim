import Comment from '../models/Comment.model.js';

// 1. Lấy tất cả bình luận của một bộ phim
export const getCommentsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Tìm document của phim này
    // populate 'comments.userId' để lấy tên và avatar người dùng bên trong mảng
    const movieData = await Comment.findOne({ movieId })
      .populate({
        path: 'comments.userId',
        select: 'name avatar' // Chỉ lấy field cần thiết
      });

    // Nếu phim chưa có trong collection comments -> Trả về mảng rỗng
    if (!movieData) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Sắp xếp bình luận mới nhất lên đầu (Client thường thích mới nhất ở trên)
    // Lưu ý: data trả về là mảng `comments` bên trong, không phải cả object phim
    const sortedComments = movieData.comments.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({ success: true, data: sortedComments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Thêm bình luận mới (Dùng $push thay vì save)
export const addComment = async (req, res) => {
  console.log("=== Add Comment Request (Embed Mode) ===");
  try {
    const { movieId, content, rating } = req.body;

    // Lấy userId (giữ nguyên logic của bạn)
    const userId = req.authId || req.userId;

    // DG04: Kiểm tra nội dung rỗng
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống' });
    }

    // DG03: Kiểm tra rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn số sao (1-5)' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy User ID' });
    }

    // Tạo object bình luận con
    const newCommentItem = {
      userId: userId,
      content: content,
      rating: rating,
      createdAt: new Date()
    };

    //Kiểm tra xem user này đã bình luận phim này chưa
    const existingReview = await Comment.findOne({
      movieId: movieId,
      "comments.userId": userId
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá phim này rồi!' });
    }

    // Tìm phim theo movieId.
    // - Nếu thấy: $push (đẩy) comment mới vào mảng comments.
    // - Nếu chưa thấy: Tự tạo document mới cho phim này (nhờ upsert: true).
    const updatedMovie = await Comment.findOneAndUpdate(
      { movieId: movieId },
      { $push: { comments: newCommentItem } },
      {
        new: true,    // Trả về dữ liệu mới sau khi update
        upsert: true  // Nếu chưa có phim này thì tạo mới
      }
    ).populate('comments.userId', 'name avatar');

    // Lấy đúng cái comment vừa thêm vào để trả về cho App (là cái cuối cùng trong mảng)
    const justAdded = updatedMovie.comments[updatedMovie.comments.length - 1];

    console.log("Comment pushed successfully to movie:", movieId);

    // App Flutter chỉ cần nhận lại 1 object comment vừa thêm để hiện lên màn hình
    res.status(201).json({ success: true, data: justAdded });

  } catch (error) {
    console.error("Add comment error details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Xóa bình luận
export const deleteComment = async (req, res) => {
  try {
    const { movieId, commentId } = req.params;
    const userId = req.authId || req.userId; // Lấy ID người đang request

    // Tìm phim và dùng $pull để rút comment ra khỏi mảng
    const updatedMovie = await Comment.findOneAndUpdate(
      { movieId: movieId },
      {
        $pull: {
          comments: { _id: commentId, userId: userId }
        }
      },
      { new: true } // Trả về dữ liệu mới sau khi xóa
    );

    if (!updatedMovie) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận hoặc bạn không có quyền xóa' });
    }

    res.status(200).json({ success: true, message: 'Đã xóa bình luận' });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Sửa bình luận
export const updateComment = async (req, res) => {
  try {
    const { movieId, commentId } = req.params;
    const { content, rating } = req.body;
    const userId = req.authId || req.userId;

    // DG04 & DG03 Validation update
    if (!content || !content.trim()) return res.status(400).json({ success: false, message: 'Nội dung trống' });
    if (rating && (rating < 1 || rating > 5)) return res.status(400).json({ success: false, message: 'Số sao không hợp lệ' });

    // Build update object
    const updateFields = {
      "comments.$.content": content,
      "comments.$.updatedAt": new Date()
    };

    // DG09: Cập nhật rating nếu có
    if (rating) {
      updateFields["comments.$.rating"] = rating;
    }

    // Dùng kỹ thuật "Positional Operator ($)" để update đúng phần tử trong mảng
    const updatedMovie = await Comment.findOneAndUpdate(
      {
        movieId: movieId,
        "comments._id": commentId,
        "comments.userId": userId // Chỉ chủ nhân mới tìm thấy để sửa
      },
      {
        $set: updateFields
      },
      { new: true }
    ).populate('comments.userId', 'name avatar');;

    if (!updatedMovie) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hoặc không có quyền sửa' });
    }

    // Lấy lại comment vừa sửa để trả về App cập nhật giao diện
    const editedComment = updatedMovie.comments.find(c => c._id.toString() === commentId);

    res.status(200).json({ success: true, data: editedComment });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};