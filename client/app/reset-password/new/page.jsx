'use client';

import { resetPassword } from '@/lib/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'react-hot-toast';
import styles from '../../login/auth.module.css';

function ResetNewPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const otp = searchParams.get('otp') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !otp) {
            setError('Thiếu email hoặc mã OTP. Vui lòng nhập lại mã.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword({ email, otp, newPassword });
            toast.success('Đặt lại mật khẩu thành công!');
            router.push('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <h1>Tạo mật khẩu mới</h1>
                    <p>{email ? `Áp dụng cho: ${email}` : 'Vui lòng quay lại và nhập email cùng mã OTP.'}</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Mật khẩu mới</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới"
                            minLength={6}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Nhập lại mật khẩu</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu"
                            minLength={6}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                    </button>
                </form>

                <p className={styles.switchText}>
                    <Link href="/reset-password">← Nhập lại mã OTP</Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetNewPasswordPage() {
    return (
        <Suspense fallback={<div className={styles.authPage}><div className={styles.authCard}>Loading...</div></div>}>
            <ResetNewPasswordContent />
        </Suspense>
    );
}
