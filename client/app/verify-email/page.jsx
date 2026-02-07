'use client';

import { resendOTP, verifyEmail } from '@/lib/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import styles from '../login/auth.module.css';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Đếm ngược cho nút gửi lại OTP theo giới hạn 60s của BE
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await verifyEmail({ email, otp });
            toast.success('Xác thực thành công! Bạn có thể đăng nhập.');
            router.push('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Xác thực thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setSuccess('');

        try {
            await resendOTP(email);
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
                    <h1>Xác thực email</h1>
                    <p>Nhập mã OTP đã gửi đến {email}</p>
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
                        {loading ? 'Đang xác thực...' : 'Xác thực'}
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
                    <Link href="/login">← Quay lại đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className={styles.authPage}><div className={styles.authCard}>Loading...</div></div>}>
            <VerifyContent />
        </Suspense>
    );
}
