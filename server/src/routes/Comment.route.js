import express from 'express';
import {
  addComment,
  deleteComment,
  getCommentsByMovie,
  updateComment
} from '../controllers/Comment.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const handle = (controller, successStatus = 200) => async (req, res) => {
  try {
    const data = await controller(req);
    return res.status(successStatus).json(data ?? {});
  } catch (error) {
    const status = error?.status ?? 500;
    const message = error?.message || 'Internal server error';
    return res.status(status).json({ success: false, message });
  }
};

router.get('/:movieId', handle(getCommentsByMovie));
router.post('/add', verifyToken, handle(addComment, 201));

router.delete('/:movieId/:commentId', verifyToken, handle(deleteComment));
router.put('/:movieId/:commentId', verifyToken, handle(updateComment));

export default router;