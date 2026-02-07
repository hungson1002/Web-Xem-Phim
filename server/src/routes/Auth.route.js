import express from 'express';
import { ForgotPassword, GoogleLogin, Login, Register, ResendResetOTP, ResendVerifyOTP, ResetPassword, VerifyEmail, VerifyResetOTP } from '../controllers/Auth.controller.js';
const router = express.Router();

router.post('/register', Register);
router.post('/login', Login);
router.post('/verify-email', VerifyEmail);
router.post('/google-login', GoogleLogin);
router.post('/resend-verify-otp', ResendVerifyOTP);
router.post('/forgot-password', ForgotPassword);
router.post('/verify-reset-otp', VerifyResetOTP);
router.post('/resend-reset-otp', ResendResetOTP);
router.post('/reset-password', ResetPassword);

export default router;