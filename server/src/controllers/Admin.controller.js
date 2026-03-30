import Auth from '../models/Auth.model.js';

// Lấy danh sách tất cả user (không bao gồm admin, không bao gồm đã xóa cứng)
export const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const skip = (page - 1) * limit;

        const query = { role: { $ne: 'admin' } };

        // Filter theo status
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
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            Auth.find(query)
                .select('-password -otp -otpExpires -resetOtp -resetOtpExpires')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Auth.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            users
        });
    } catch (error) {
        next(error);
    }
};

// Lấy thông tin chi tiết 1 user
export const getUserDetail = async (req, res, next) => {
    try {
        const user = await Auth.findById(req.params.id)
            .select('-password -otp -otpExpires -resetOtp -resetOtpExpires');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// Vô hiệu hóa / kích hoạt lại tài khoản
export const toggleUserActive = async (req, res, next) => {
    try {
        const user = await Auth.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể thao tác với tài khoản admin' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: user.isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản',
            isActive: user.isActive
        });
    } catch (error) {
        next(error);
    }
};

// Xóa mềm tài khoản
export const softDeleteUser = async (req, res, next) => {
    try {
        const user = await Auth.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản admin' });
        }

        user.isDeleted = true;
        user.deletedAt = new Date();
        user.isActive = false;
        await user.save();

        res.status(200).json({ success: true, message: 'Đã xóa tài khoản thành công' });
    } catch (error) {
        next(error);
    }
};

// Khôi phục tài khoản đã xóa mềm
export const restoreUser = async (req, res, next) => {
    try {
        const user = await Auth.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        user.isDeleted = false;
        user.deletedAt = null;
        user.isActive = true;
        await user.save();

        res.status(200).json({ success: true, message: 'Đã khôi phục tài khoản' });
    } catch (error) {
        next(error);
    }
};
