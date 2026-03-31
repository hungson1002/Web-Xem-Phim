
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import Auth from '../models/Auth.model.js';
import Role from '../models/Role.model.js';
import { sendOTPEmail } from '../utils/sendEmail.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Đăng ký
export const Register = async (req, res, next) => {
    try {
        const { name, email, password, username } = req.body;

        const exitAuth = await Auth.findOne({ $or: [{ email }, { username }] });
        if (exitAuth) {
            return res.status(400).json({
                success: false,
                message: exitAuth.email === email ? "Email đã tồn tại" : "Tên đăng nhập đã tồn tại"
            })
        }

        // Validate username (ít nhất 3 ký tự, không dấu, không khoảng trắng)
        const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: "Tên đăng nhập phải có ít nhất 3 ký tự, không dấu và không khoảng trắng"
            })
        }

        // Chỉ lấy mật khẩu từ 6 chữ số trở lên
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu phải có ít nhất 6 ký tự"
            })
        }

        // Mã hóa password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Tạo mã OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Đặt thời gian hết hạn cho mã OTP
        const otpExpires = Date.now() + 5 * 60 * 1000;

        // Lưu dữ liệu vào mongo
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

        // Gửi mã OTP qua email
        await sendOTPEmail(email, otp);

        // Trả kết quả cho client
        return res.status(200).json({
            success: true,
            message: "OTP has been sent to your email"
        })

    } catch (error) {
        next(error);
    }
};

// Đăng nhập
export const Login = async (req, res, next) => {
    try {
        const { email, password } = req.body; // email ở đây có thể là email hoặc username

        const auth = await Auth.findOne({
            $or: [{ email: email }, { username: email }]
        }).populate('roleId');

        if (!auth) {
            return res.status(400).json({
                success: false,
                message: "Tài khoản không tồn tại"
            })
        }

        //So sánh mật khẩu từ client với mật khẩu đã mã hóa trong database
        const isMatch = await bcrypt.compare(password, auth.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng"
            })
        }

        // Kiểm tra email đã xác nhận chưa
        if (!auth.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng xác thực email của bạn"
            })
        }

        // Kiểm tra tài khoản bị xóa mềm hoặc vô hiệu hóa
        if (auth.isDeleted) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản đã bị xóa"
            })
        }

        if (!auth.isActive) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản đã bị vô hiệu hóa"
            })
        }

        // Tạo token
        const token = jwt.sign(
            {
                authID: auth._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE
            }
        )

        // Trả dữ liệu về cho client
        res.status(200).json({
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
        })
    } catch (error) {
        next(error);
    }
}

// Xác nhận OTP
export const VerifyEmail = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        //kiểm tra email có tồn tại không
        const auth = await Auth.findOne({ email });
        if (!auth || auth.otp !== otp || auth.otpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            })
        }

        // Cập nhật isVerified
        auth.isVerified = true;
        auth.otp = null;
        auth.otpExpires = null;
        auth.otpResendCount = 0;
        auth.otpLastSentAt = null;
        await auth.save();

        // Trả kết quả cho client
        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        })
    } catch (error) {
        next(error);
    }
}

export const GoogleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body;

        console.log('Google Login - Received credential:', credential ? 'Yes' : 'No');

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required'
            });
        }

        // Xác thực ID token với Google
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        // Lấy dữ liệu người dùng từ GG
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        console.log('Google Login - User info:', { email, name, googleId });

        // Tìm user trong database theo email
        let auth = await Auth.findOne({ email });

        // Kiểm tra email đã tồn tại chưa
        if (auth && auth.provider === 'local') {
            return res.status(400).json({
                success: false,
                message: "Email already registered with password"
            });
        }

        // Tạo user mới nếu chưa tồn tại
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
            // Cập nhật avatar nếu user đã tồn tại
            if (payload.picture && !auth.avatar) {
                auth.avatar = payload.picture;
                await auth.save();
            }
            console.log('Google Login - Existing user:', auth._id);
        }

        // Tạo jwt như đăng nhập thường
        const token = jwt.sign(
            {
                authID: auth._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRE
            }
        )

        // Trả kết quả cho client
        return res.status(200).json({
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
        })
    } catch (error) {
        next(error);
    }
}

// Gửi lại otp xác thực email
export const ResendVerifyOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        const auth = await Auth.findOne({ email });

        // Kiểm tra email có tồn tại không
        if (!auth) {
            return res.status(400).json({
                success: false,
                message: "Email not found"
            })
        }

        // Kiểm tra email đã xác thực chưa
        if (auth.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email already verified"
            })
        }

        // Giới hạn 60 giây gửi 1 lần
        const now = Date.now();
        if (auth.otpLastSentAt && now - auth.otpLastSentAt < 60 * 1000) {
            return res.status(429).json({
                success: false,
                message: "Please wait before resending OTP"
            })
        }

        // Giới hạn số lần 3 lần
        if (auth.otpResendCount >= 3) {
            return res.status(429).json({
                success: false,
                message: "OTP resend limit reached, please try later"
            })
        }

        // Tạo OTP mới
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Cập nhật OTP và thời gian hết hạn
        auth.otp = otp;
        auth.otpExpires = now + 5 * 60 * 1000; // Hết hạn sau 5 phút
        auth.otpResendCount += 1;
        auth.otpLastSentAt = now;
        await auth.save();

        // Gửi OTP qua email
        await sendOTPEmail(email, otp);

        // Trả kết quả cho client
        return res.status(200).json({
            success: true,
            message: "OTP resend successfully"
        })

    } catch (error) {
        next(error);
    }
}

// Gửi otp đặt lại mật khẩu
export const ForgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const auth = await Auth.findOne({ email });

        if (!auth) {
            return res.status(400).json({
                success: false,
                message: "Email not found"
            })
        }

        // Giới hạn thửu lại sau 60 giây
        if (auth.resetOtpExpires && auth.resetOtpExpires > Date.now()) {
            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another OTP"
            });
        }

        // Tạo OTP 
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Lưu otp và đặt giới hạn thời gian
        auth.resetOtp = otp;
        auth.resetOtpExpires = Date.now() + 5 * 60 * 1000;
        auth.resetOtpResendCount = 0; // reset bộ đếm khi bắt đầu quy trình mới
        auth.resetOtpLastSentAt = Date.now();
        await auth.save();

        // Gửi OTP qua email
        await sendOTPEmail(email, otp);

        // Trả kết quả cho client
        return res.status(200).json({
            success: true,
            message: "OTP sent to reset password"
        })
    } catch (error) {
        next(error);
    }
}

// Gửi lại OTP đặt lại mật khẩu
export const ResendResetOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        const auth = await Auth.findOne({ email });

        if (!auth) {
            return res.status(400).json({
                success: false,
                message: "Email not found"
            })
        }

        // Giới hạn 60 giây gửi 1 lần
        const now = Date.now();
        if (auth.resetOtpLastSentAt && now - auth.resetOtpLastSentAt < 60 * 1000) {
            return res.status(429).json({
                success: false,
                message: "Please wait before resending OTP"
            })
        }

        // Giới hạn số lần 3 lần
        if (auth.resetOtpResendCount >= 3) {
            return res.status(429).json({
                success: false,
                message: "OTP resend limit reached, please try later"
            })
        }

        // Tạo OTP mới
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Cập nhật OTP và thời gian hết hạn
        auth.resetOtp = otp;
        auth.resetOtpExpires = now + 5 * 60 * 1000; // Hết hạn sau 5 phút
        auth.resetOtpResendCount += 1;
        auth.resetOtpLastSentAt = now;
        await auth.save();

        // Gửi OTP qua email
        await sendOTPEmail(email, otp);

        // Trả kết quả cho client
        return res.status(200).json({
            success: true,
            message: "OTP resend successfully"
        })

    } catch (error) {
        next(error);
    }
}

// Xác minh OTP đặt lại mật khẩu
export const VerifyResetOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const auth = await Auth.findOne({ email });

        if (!auth || auth.resetOtp !== otp || auth.resetOtpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            })
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified"
        })
    } catch (error) {
        next(error);
    }
}

// Đặt lại mật khẩu
export const ResetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Tìm user theo email
        const auth = await Auth.findOne({ email });

        // Kiểm tra otp hợp lệ
        if (!auth || auth.resetOtp !== otp || auth.resetOtpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            })
        }

        // Kiểm tra độ dài password mới
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        auth.password = await bcrypt.hash(newPassword, salt);

        // Xóa resetOTP sau khi dùng
        auth.resetOtp = undefined;
        auth.resetOtpExpires = undefined;

        await auth.save();

        // Trả kết quả cho client
        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        })
    } catch (error) {
        next(error);
    }
}

