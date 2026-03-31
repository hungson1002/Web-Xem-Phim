import mongoose from 'mongoose';

const authSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: function () {
                return this.provider === 'local';
            }
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        otp: {
            type: String
        },

        otpExpires: {
            type: Date
        },
        googleId: {
            type: String
        },

        avatar: {
            type: String
        },

        provider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local'
        },
        resetOtp: {
            type: String
        },
        resetOtpExpires: {
            type: Date
        },
        resetOtpResendCount: {
            type: Number,
            default: 0
        },
        resetOtpLastSentAt: {
            type: Date
        },
        otpResendCount: {
            type: Number,
            default: 0
        },

        otpLastSentAt: {
            type: Date
        },
        roleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Auth = mongoose.model('Auth', authSchema);

export default Auth;
