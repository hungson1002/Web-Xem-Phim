'use client';

import { forgotPassword } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../login/auth.module.css';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await forgotPassword(email);
            router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Gửi yêu cầu thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <h1>Quên mật khẩu</h1>
                    <p>Nhập email để nhận link đặt lại mật khẩu</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </button>
                </form>

                <p className={styles.switchText}>
                    <Link href="/login">← Quay lại đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}
