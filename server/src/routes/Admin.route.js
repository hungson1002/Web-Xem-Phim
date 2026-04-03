import express from 'express';
import Auth from '../models/Auth.model.js';
import Role from '../models/Role.model.js';
import { isAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const getRoleId = async (name) => {
    const role = await Role.findOne({ name });
    return role?._id || null;
};

// Tất cả routes admin đều cần xác thực + quyền admin
router.use(verifyToken, isAdmin);

router.get('/users', async function(req, res) {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const skip = (page - 1) * limit;

        const adminRole = await getRoleId('admin');

        const query = {
            $or: [
                { roleId: { $ne: adminRole } },
                { roleId: null }
            ]
        };

        if (status === 'active') {
            query.isDeleted = { $ne: true };
            query.isActive = { $ne: false };
        } else if (status === 'inactive') {
            query.isDeleted = { $ne: true };
            query.isActive = false;
        } else if (status === 'deleted') {
            query.isDeleted = true;
        }

        if (search) {
            query.$and = [
                {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                        { username: { $regex: search, $options: 'i' } }
                    ]
                }
            ];
        }

        const [users, total] = await Promise.all([
            Auth.find(query)
                .select('-password -otp -otpExpires -resetOtp -resetOtpExpires')
                .populate('roleId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Auth.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            users
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
    }
});

router.get('/users/:id', async function(req, res) {
    try {
        const user = await Auth.findById(req.params.id)
            .select('-password -otp -otpExpires -resetOtp -resetOtpExpires')
            .populate('roleId', 'name');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
    }
});

router.patch('/users/:id/toggle-active', async function(req, res) {
    try {
        const user = await Auth.findById(req.params.id).populate('roleId');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        if (user.roleId?.name === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể thao tác với tài khoản admin' });
        }

        user.isActive = !user.isActive;
        await user.save();

        return res.status(200).json({
            success: true,
            message: user.isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản',
            isActive: user.isActive
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
    }
});

router.patch('/users/:id/soft-delete', async function(req, res) {
    try {
        const user = await Auth.findById(req.params.id).populate('roleId');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        if (user.roleId?.name === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản admin' });
        }

        user.isDeleted = true;
        user.deletedAt = new Date();
        user.isActive = false;
        await user.save();

        return res.status(200).json({ success: true, message: 'Đã xóa tài khoản thành công' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
    }
});

router.patch('/users/:id/restore', async function(req, res) {
    try {
        const user = await Auth.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        user.isDeleted = false;
        user.deletedAt = null;
        user.isActive = true;
        await user.save();

        return res.status(200).json({ success: true, message: 'Đã khôi phục tài khoản' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
    }
});

export default router;
