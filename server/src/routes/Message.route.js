import express from 'express';
import { getMessagesByRoomCode, sendMessage } from '../controllers/Message.controller.js';
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

router.get('/:code', verifyToken, handle(getMessagesByRoomCode));
router.post('/:code', verifyToken, handle(sendMessage, 201));

export default router;
