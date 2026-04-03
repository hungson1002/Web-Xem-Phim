import express from 'express';
import { ForgotPassword, GoogleLogin, Login, Register, ResendResetOTP, ResendVerifyOTP, ResetPassword, VerifyEmail, VerifyResetOTP } from '../controllers/Auth.controller.js';
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

router.post('/register', handle(Register));
router.post('/login', handle(Login));
router.post('/verify-email', handle(VerifyEmail));
router.post('/google-login', handle(GoogleLogin));
router.post('/resend-verify-otp', handle(ResendVerifyOTP));
router.post('/forgot-password', handle(ForgotPassword));
router.post('/verify-reset-otp', handle(VerifyResetOTP));
router.post('/resend-reset-otp', handle(ResendResetOTP));
router.post('/reset-password', handle(ResetPassword));

export default router;