import express from 'express';
import { getWatchHistory, saveWatchHistory } from '../controllers/WatchHistory.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, saveWatchHistory);
router.get('/', verifyToken, getWatchHistory);

export default router;
