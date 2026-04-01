import express from 'express';
import { getAllUsers, getUserDetail, restoreUser, softDeleteUser, toggleUserActive } from '../controllers/Admin.controller.js';
import { isAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả routes admin đều cần xác thực + quyền admin
router.use(verifyToken, isAdmin);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.patch('/users/:id/soft-delete', softDeleteUser);
router.patch('/users/:id/restore', restoreUser);

export default router;
