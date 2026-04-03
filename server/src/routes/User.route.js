import express from 'express';
import bcrypt from 'bcryptjs';
import Auth from '../models/Auth.model.js';

import uploadCloud from '../config/cloudinary.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, async function(req, res) {
    try {
        const users = await Auth.find().select('-password -otp -otpExpires').sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            total: users.length,
            users
        });
    } catch (error) {
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

router.get('/:id', verifyToken, async function(req, res) {
    try {
        const user = await Auth.findById(req.params.id).select('-password -otp -otpExpires');

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || null,
                provider: user.provider || 'local',
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

router.put('/:id', verifyToken, uploadCloud.single('avatar'), async function(req, res) {
    try {
        const { name, currentPassword, newPassword } = req.body;

        const user = await Auth.findById(req.params.id);

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const avatarUrl = req.file ? req.file.path : req.body.avatar;

        if (name) user.name = name;
        if (avatarUrl) user.avatar = avatarUrl;

        if (newPassword && currentPassword) {
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Update user successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || null,
                provider: user.provider || 'local',
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

router.delete('/:id', verifyToken, async function(req, res) {
    try {
        const user = await Auth.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Delete user successfully',
            user
        });
    } catch (error) {
        const status = error?.status ?? 500;
        const message = error?.message || 'Internal server error';
        return res.status(status).json({ success: false, message });
    }
});

export default router;
