
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import Auth from '../models/Auth.model.js';
import Role from '../models/Role.model.js';
import { sendOTPEmail } from '../utils/sendEmail.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const httpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// Đăng ký
export const Register = async (req) => {
    try {
        const { name, email, password, username } = req.body;

        const exitAuth = await Auth.findOne({ $or: [{ email }, { username }] });
        if (exitAuth) {
            throw httpError(400, exitAuth.email === email ? "Email đã tồn tại" : "Tên đăng nhập đã tồn tại");
        }

        const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
        if (!usernameRegex.test(username)) {
            throw httpError(400, "Tên đăng nhập phải có ít nhất 3 ký tự, không dấu và không khoảng trắng");
        }

        if (password.length < 6) {
            throw httpError(400, "Mật khẩu phải có ít nhất 6 ký tự");
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpExpires = Date.now() + 5 * 60 * 1000;

        const userRole = await Role.findOne({ name: 'user' });
        await Auth.create({
            name,
            email,
            username,
            password: hashPassword,
            otp,
            otpExpires,
            isVerified: false,
            roleId: userRole?._id || null
        })

        await sendOTPEmail(email, otp);

        return {
            success: true,
            message: "OTP has been sent to your email"
        };

    } catch (error) {
        throw error;
    }
};

// Đăng nhập
export const Login = async (req) => {
    try {
        const { email, password } = req.body; 

        const auth = await Auth.findOne({
            $or: [{ email: email }, { username: email }]
        }).populate('roleId');

        if (!auth) {
            throw httpError(400, "Tài khoản không tồn tại");
        }

        const isMatch = await bcrypt.compare(password, auth.password);
        if (!isMatch) {
            throw httpError(400, "Email hoặc mật khẩu không đúng");
        }

        if (!auth.isVerified) {
            throw httpError(400, "Vui lòng xác thực email của bạn");
        }

        if (auth.isDeleted) {
            throw httpError(403, "Tài khoản đã bị xóa");
        }

        if (!auth.isActive) {
            throw httpError(403, "Tài khoản đã bị vô hiệu hóa");
        }

        const token = jwt.sign(
            {
                authID: auth._id,
                role: auth.roleId?.name || 'user'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE
            }
        );

        return {
            success: true,
            token,
            auth: {
                id: auth._id,
                name: auth.name,
                username: auth.username,
                email: auth.email,
                avatar: auth.avatar || null,
                provider: auth.provider || "local",
                isVerified: auth.isVerified,
                role: auth.roleId?.name || 'user',
                createdAt: auth.createdAt
            }
        };
    } catch (error) {
        throw error;
    }
};

// Xác nhận OTP
export const VerifyEmail = async (req) => {
    try {
        const { email, otp } = req.body;

        const auth = await Auth.findOne({ email });
        if (!auth || auth.otp !== otp || auth.otpExpires < Date.now()) {
            throw httpError(400, "Invalid or expired OTP");
        }

        auth.isVerified = true;
        auth.otp = null;
        auth.otpExpires = null;
        auth.otpResendCount = 0;
        auth.otpLastSentAt = null;
        await auth.save();

        return {
            success: true,
            message: "Email verified successfully"
        };
    } catch (error) {
        throw error;
    }
};

export const GoogleLogin = async (req) => {
    try {
        const { credential } = req.body;

        console.log('Google Login - Received credential:', credential ? 'Yes' : 'No');

        if (!credential) {
            throw httpError(400, 'Google credential is required');
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        console.log('Google Login - User info:', { email, name, googleId });

        let auth = await Auth.findOne({ email });

        if (auth && auth.provider === 'local') {
            throw httpError(400, "Email already registered with password");
        }

        if (!auth) {
            const userRole = await Role.findOne({ name: 'user' });
            auth = await Auth.create({
                name,
                email,
                username: email.split('@')[0] + Math.floor(Math.random() * 10000),
                googleId,
                avatar: payload.picture,
                provider: 'google',
                isVerified: true,
                roleId: userRole?._id || null
            });
            console.log('Google Login - Created new user:', auth._id);
        } else {
            if (payload.picture && !auth.avatar) {
                auth.avatar = payload.picture;
                await auth.save();
            }
            console.log('Google Login - Existing user:', auth._id);
        }

        const token = jwt.sign(
            {
                authID: auth._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE
            }
        );

        return {
            success: true,
            token,
            auth: {
                id: auth._id,
                name: auth.name,
                email: auth.email,
                provider: auth.provider,
                avatar: auth.avatar || payload.picture,
                isVerified: auth.isVerified,
                createdAt: auth.createdAt
            }
        };
    } catch (error) {
        throw error;
    }
};

// Gửi lại otp xác thực email
export const ResendVerifyOTP = async (req) => {
    try {
        const { email } = req.body;

        const auth = await Auth.findOne({ email });

        if (!auth) {
            throw httpError(400, "Email not found");
        }

        if (auth.isVerified) {
            throw httpError(400, "Email already verified");
        }

        const now = Date.now();
        if (auth.otpLastSentAt && now - auth.otpLastSentAt < 60 * 1000) {
            throw httpError(429, "Please wait before resending OTP");
        }

        if (auth.otpResendCount >= 3) {
            throw httpError(429, "OTP resend limit reached, please try later");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        auth.otp = otp;
        auth.otpExpires = now + 5 * 60 * 1000; 
        auth.otpResendCount += 1;
        auth.otpLastSentAt = now;
        await auth.save();

        await sendOTPEmail(email, otp);

        return {
            success: true,
            message: "OTP resend successfully"
        };

    } catch (error) {
        throw error;
    }
};

// Gửi otp đặt lại mật khẩu
export const ForgotPassword = async (req) => {
    try {
        const { email } = req.body;

        const auth = await Auth.findOne({ email });

        if (!auth) {
            throw httpError(400, "Email not found");
        }

        if (auth.resetOtpExpires && auth.resetOtpExpires > Date.now()) {
            throw httpError(429, "Please wait before requesting another OTP");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        auth.resetOtp = otp;
        auth.resetOtpExpires = Date.now() + 5 * 60 * 1000;
        auth.resetOtpResendCount = 0; 
        auth.resetOtpLastSentAt = Date.now();
        await auth.save();

        await sendOTPEmail(email, otp);

        return {
            success: true,
            message: "OTP sent to reset password"
        };
    } catch (error) {
        throw error;
    }
};

// Gửi lại OTP đặt lại mật khẩu
export const ResendResetOTP = async (req) => {
    try {
        const { email } = req.body;

        const auth = await Auth.findOne({ email });

        if (!auth) {
            throw httpError(400, "Email not found");
        }

        const now = Date.now();
        if (auth.resetOtpLastSentAt && now - auth.resetOtpLastSentAt < 60 * 1000) {
            throw httpError(429, "Please wait before resending OTP");
        }

        if (auth.resetOtpResendCount >= 3) {
            throw httpError(429, "OTP resend limit reached, please try later");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        auth.resetOtp = otp;
        auth.resetOtpExpires = now + 5 * 60 * 1000; 
        auth.resetOtpResendCount += 1;
        auth.resetOtpLastSentAt = now;
        await auth.save();

        await sendOTPEmail(email, otp);

        return {
            success: true,
            message: "OTP resend successfully"
        };

    } catch (error) {
        throw error;
    }
};

// Xác minh OTP đặt lại mật khẩu
export const VerifyResetOTP = async (req) => {
    try {
        const { email, otp } = req.body;

        const auth = await Auth.findOne({ email });

        if (!auth || auth.resetOtp !== otp || auth.resetOtpExpires < Date.now()) {
            throw httpError(400, "Invalid or expired OTP");
        }

        return {
            success: true,
            message: "OTP verified"
        };
    } catch (error) {
        throw error;
    }
};

// Đặt lại mật khẩu
export const ResetPassword = async (req) => {
    try {
        const { email, otp, newPassword } = req.body;

        const auth = await Auth.findOne({ email });

        if (!auth || auth.resetOtp !== otp || auth.resetOtpExpires < Date.now()) {
            throw httpError(400, "Invalid or expired OTP");
        }

        if (!newPassword || newPassword.length < 6) {
            throw httpError(400, "New password must be at least 6 characters");
        }

        const salt = await bcrypt.genSalt(10);
        auth.password = await bcrypt.hash(newPassword, salt);

        auth.resetOtp = undefined;
        auth.resetOtpExpires = undefined;

        await auth.save();

        return {
            success: true,
            message: "Password reset successfully"
        };
    } catch (error) {
        throw error;
    }
};

