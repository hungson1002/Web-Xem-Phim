import bcrypt from "bcryptjs"
import Auth from "../models/Auth.model.js"

// Lấy thông tin user
export const getUser = async (req, res, next) => {
    try {
        const user = await Auth.findById(req.params.id).select("-password -otp -otpExpires")

        //Kiểm tra user có tồn tại không
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || null,
                provider: user.provider || "local",
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        })
    } catch (error) {
        next(error)
    }
}

// Lấy thông tin tất cả user
export const getAllUser = async (req, res, next) => {
    try {
        const users = await Auth.find().select("-password -otp -otpExpires").sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            total: users.length,
            users
        })
    } catch (error) {
        next(error)
    }
}

// Cập nhật thông tin user
export const updateUser = async (req, res, next) => {
    try {
        const { name, avatar, currentPassword, newPassword } = req.body

        const user = await Auth.findById(req.params.id)

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        if (name) user.name = name
        if (avatar) user.avatar = avatar
        
        // Đổi mật khẩu - cần verify password cũ
        if (newPassword && currentPassword) {
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: "Mật khẩu hiện tại không đúng"
                })
            }
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(newPassword, salt)
        }

        await user.save()

        res.status(200).json({
            success: true,
            message: "Update user successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || null,
                provider: user.provider || "local",
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        })
    }
    catch (error) {
        next(error)
    }
}

// Xóa user
export const deleteUser = async (req, res, next) => {
    try {
        const user = await Auth.findByIdAndDelete(req.params.id)

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "Delete user successfully",
            user
        })
    }
    catch (error) {
        next(error)
    }
}
