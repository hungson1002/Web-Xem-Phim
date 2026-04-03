import bcrypt from "bcryptjs"
import Auth from "../models/Auth.model.js"

const httpError = (status, message) => {
    const error = new Error(message)
    error.status = status
    return error
}

// Lấy thông tin user
export const getUser = async (req) => {
    try {
        const user = await Auth.findById(req.params.id).select("-password -otp -otpExpires")

        if (!user) {
            throw httpError(400, "User not found")
        }

        return {
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
        }
    } catch (error) {
        throw error;
    }
}

// Lấy thông tin tất cả user
export const getAllUser = async () => {
    try {
        const users = await Auth.find().select("-password -otp -otpExpires").sort({ createdAt: -1 })

        return {
            success: true,
            total: users.length,
            users
        }
    } catch (error) {
        throw error;
    }
}

// Cập nhật thông tin user
export const updateUser = async (req) => {
    try {
        const { name, currentPassword, newPassword } = req.body

        const user = await Auth.findById(req.params.id)

        if (!user) {
            throw httpError(400, "User not found")
        }

        const avatarUrl = req.file ? req.file.path : req.body.avatar;

        if (name) user.name = name
        if (avatarUrl) user.avatar = avatarUrl
        
        if (newPassword && currentPassword) {
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
            if (!isPasswordValid) {
                throw httpError(400, "Mật khẩu hiện tại không đúng")
            }
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(newPassword, salt)
        }

        await user.save()

        return {
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
        }
    }
    catch (error) {
        throw error;
    }
}

// Xóa user
export const deleteUser = async (req) => {
    try {
        const user = await Auth.findByIdAndDelete(req.params.id)

        if (!user) {
            throw httpError(400, "User not found")
        }

        return {
            success: true,
            message: "Delete user successfully",
            user
        }
    }
    catch (error) {
        throw error;
    }
}
