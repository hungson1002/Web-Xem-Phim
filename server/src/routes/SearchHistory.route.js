import express from 'express';
import {
    clearSearchHistory,
    deleteSearchHistoryItem,
    getSearchHistory,
    saveSearchHistory
} from '../controllers/SearchHistory.controller.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getSearchHistory);
router.post('/', verifyToken, saveSearchHistory);
router.delete('/all', verifyToken, clearSearchHistory);
router.delete('/:id', verifyToken, deleteSearchHistoryItem);

export default router;
