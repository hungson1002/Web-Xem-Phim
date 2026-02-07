'use client';

import { resendResetOtp, verifyResetOtp } from '@/lib/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import styles from '../login/auth.module.css';

function ResetContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!email) {
            setError('Không tìm thấy email. Vui lòng gửi lại yêu cầu.');
            return;
        }

        if (!otp || otp.length < 4) {
            setError('Vui lòng nhập mã OTP hợp lệ.');
            return;
        }

        setLoading(true);

        try {
            await verifyResetOtp({ email, otp });
            router.push(`/reset-password/new?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setSuccess('');
        if (!email) {
            setError('Không tìm thấy email. Vui lòng quay lại nhập email.');
            return;
        }
        try {
            await resendResetOtp(email);
            setSuccess('Đã gửi lại mã OTP!');
            setCooldown(60);
        } catch (err) {
            setError(err.response?.data?.message || 'Gửi lại thất bại');
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <h1>Nhập mã OTP</h1>
                    <p>{email ? `Nhập mã OTP đã gửi đến ${email}` : 'Vui lòng quay lại và nhập email để nhận mã OTP.'}</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Mã OTP</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Nhập mã 6 số"
                            maxLength={6}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
                    </button>
                </form>

                <button
                    onClick={handleResend}
                    className={styles.forgotLink}
                    style={{ marginTop: '20px', display: 'block', textAlign: 'center' }}
                    disabled={cooldown > 0}
                >
                    {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã OTP'}
                </button>

                <p className={styles.switchText}>
                    <Link href="/forgot-password">← Quay lại gửi email</Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className={styles.authPage}><div className={styles.authCard}>Loading...</div></div>}>
            <ResetContent />
        </Suspense>
    );
}
