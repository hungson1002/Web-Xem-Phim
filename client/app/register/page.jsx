'use client';

import { useAuth } from '@/context/AuthContext';
import { googleLogin as googleLoginApi, register as registerApi } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import styles from '../login/auth.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);

    // Tải script Google Identity
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (document.getElementById('google-identity')) {
            setGoogleReady(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.id = 'google-identity';
        script.onload = () => setGoogleReady(true);
        script.onerror = () => toast.error('Không tải được Google SDK');
        document.body.appendChild(script);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const nameTrimmed = formData.name.trim();
        const emailTrimmed = formData.email.trim();
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;

        // DK02: Kiểm tra họ tên trống
        if (!nameTrimmed) {
            setError('Vui lòng nhập họ và tên');
            return;
        }

        // DK03: Kiểm tra email trống
        if (!emailTrimmed) {
            setError('Vui lòng nhập email');
            return;
        }

        // DK04: Kiểm tra format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTrimmed)) {
            setError('Email không đúng định dạng');
            return;
        }

        // DK06: Kiểm tra password ngắn
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        // DK07: Kiểm tra password khớp
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        // DK08: Kiểm tra đồng ý điều khoản
        if (!agreeTerms) {
            setError('Vui lòng đồng ý với điều khoản sử dụng');
            return;
        }

        setLoading(true);

        try {
            await registerApi({
                name: nameTrimmed,
                email: emailTrimmed,
                password: password
            });
            toast.success('Đăng ký thành công! Vui lòng kiểm tra email để nhập mã OTP.');
            router.push(`/verify-email?email=${encodeURIComponent(emailTrimmed)}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    // DK10: Đăng ký bằng Google
    const handleGoogleRegister = async () => {
        const clientId = "583406887266-jn56n8o9rfp5bpqvlscnlvso9vp5td4e.apps.googleusercontent.com";
        if (!googleReady || !window.google?.accounts?.id) {
            toast.error('Google chưa sẵn sàng, thử lại sau');
            return;
        }

        setGoogleLoading(true);

        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    try {
                        const res = await googleLoginApi(response.credential);
                        login(res.auth, res.token);
                        toast.success('Đăng ký với Google thành công!');
                        router.push('/');
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Đăng ký với Google thất bại');
                    } finally {
                        setGoogleLoading(false);
                    }
                },
                cancel_on_tap_outside: false,
                use_fedcm_for_prompt: true,
            });

            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed()) {
                    const buttonDiv = document.createElement('div');
                    buttonDiv.id = 'google-signin-button-register';
                    buttonDiv.style.display = 'none';
                    document.body.appendChild(buttonDiv);

                    window.google.accounts.id.renderButton(buttonDiv, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                    });

                    const button = buttonDiv.querySelector('div[role="button"]');
                    if (button) {
                        button.click();
                    } else {
                        setGoogleLoading(false);
                        toast.error('Không thể mở đăng ký Google. Hãy thử lại sau.');
                    }

                    setTimeout(() => buttonDiv.remove(), 60000);
                } else if (notification.isSkippedMoment()) {
                    setGoogleLoading(false);
                }
            });
        } catch (err) {
            setGoogleLoading(false);
            toast.error('Không khởi tạo được Google');
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <h1>Đăng ký</h1>
                    <p>Tạo tài khoản mới</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Tên người dùng</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập tên của bạn"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input
                            type="text"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Nhập email của bạn"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mật khẩu</label>
                        <div className={styles.passwordField}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Tối thiểu 6 ký tự"
                            />
                            <button
                                type="button"
                                className={styles.toggleBtn}
                                onClick={() => setShowPassword((p) => !p)}
                                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                                {showPassword ? 'Ẩn' : 'Hiện'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Xác nhận mật khẩu</label>
                        <div className={styles.passwordField}>
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Nhập lại mật khẩu"
                            />
                            <button
                                type="button"
                                className={styles.toggleBtn}
                                onClick={() => setShowConfirm((p) => !p)}
                                aria-label={showConfirm ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                            >
                                {showConfirm ? 'Ẩn' : 'Hiện'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.checkboxGroup}>
                        <input
                            type="checkbox"
                            id="agreeTerms"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                        />
                        <label htmlFor="agreeTerms">
                            Tôi đồng ý với <Link href="/terms">điều khoản sử dụng</Link>
                        </label>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>hoặc</span>
                </div>

                <button className={styles.googleBtn} type="button" onClick={handleGoogleRegister} disabled={googleLoading}>
                    <svg viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {googleLoading ? 'Đang mở Google...' : 'Đăng ký với Google'}
                </button>

                <p className={styles.switchText}>
                    Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}
