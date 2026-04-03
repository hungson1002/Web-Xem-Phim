import express from "express";
import { deleteUser, getAllUser, getUser, updateUser } from "../controllers/User.controller.js";

import uploadCloud from "../config/cloudinary.js";
import { verifyToken } from "../middleware/authMiddleware.js";

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

router.get("/", verifyToken, handle(getAllUser));
router.get("/:id", verifyToken, handle(getUser));
router.put("/:id", verifyToken, uploadCloud.single("avatar"), handle(updateUser));
router.delete("/:id", verifyToken, handle(deleteUser));

export default router;