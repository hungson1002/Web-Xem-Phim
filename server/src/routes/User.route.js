import express from "express";
import { deleteUser, getAllUser, getUser, updateUser } from "../controllers/User.controller.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import uploadCloud from "../config/cloudinary.js";

const router = express.Router();

router.get("/", verifyToken, getAllUser);
router.get("/:id", verifyToken, getUser);
router.put("/:id", verifyToken, uploadCloud.single("avatar"), updateUser);
router.delete("/:id", verifyToken, deleteUser);

export default router;