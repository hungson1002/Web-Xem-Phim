'use client';

import { adminGetUserDetail, adminRestoreUser, adminSoftDeleteUser, adminToggleUserActive } from '@/lib/admin';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function AdminUserDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [fetching, setFetching] = useState(true);

    const fetchUser = async () => {
        setFetching(true);
        try {
            const data = await adminGetUserDetail(id);
            setProfile(data.user);
        } catch {
            toast.error('Không thể tải thông tin user');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user) fetchUser();
    }, [user]);

    const handleToggleActive = async () => {
        try {
            const res = await adminToggleUserActive(id);
            toast.success(res.message);
            fetchUser();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi');
        }
    };

    const handleSoftDelete = async () => {
        if (!confirm('Xác nhận xóa tài khoản này?')) return;
        try {
            const res = await adminSoftDeleteUser(id);
            toast.success(res.message);
            fetchUser();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi');
        }
    };

    const handleRestore = async () => {
        try {
            const res = await adminRestoreUser(id);
            toast.success(res.message);
            fetchUser();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi');
        }
    };

    if (fetching) return <div className={styles.loading}>Đang tải...</div>;
    if (!profile) return <div className={styles.loading}>Không tìm thấy user</div>;

    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => router.push('/admin/users')}>
                ← Quay lại
            </button>

            <div className={styles.card}>
                <div className={styles.avatarSection}>
                    {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {profile.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h2 className={styles.name}>{profile.name}</h2>
                        <span className={styles.username}>@{profile.username}</span>
                    </div>
                    <div className={styles.statusBadge}>
                        {profile.isDeleted ? (
                            <span className={styles.badgeDeleted}>Đã xóa</span>
                        ) : profile.isActive ? (
                            <span className={styles.badgeActive}>Hoạt động</span>
                        ) : (
                            <span className={styles.badgeInactive}>Vô hiệu</span>
                        )}
                    </div>
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Email</span>
                        <span className={styles.value}>{profile.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Xác thực email</span>
                        <span className={styles.value}>
                            <span className={profile.isVerified ? styles.dotGreen : styles.dotRed} />
                            {profile.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Đăng nhập qua</span>
                        <span className={styles.value}>{profile.provider === 'google' ? '🔵 Google' : ' Email/Password'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Ngày tạo</span>
                        <span className={styles.value}>{new Date(profile.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    {profile.isDeleted && profile.deletedAt && (
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Ngày xóa</span>
                            <span className={styles.value}>{new Date(profile.deletedAt).toLocaleString('vi-VN')}</span>
                        </div>
                    )}
                </div>

                <div className={styles.actionRow}>
                    {!profile.isDeleted ? (
                        <>
                            <button
                                className={profile.isActive ? styles.btnDisable : styles.btnEnable}
                                onClick={handleToggleActive}
                            >
                                {profile.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                            </button>
                            <button className={styles.btnDelete} onClick={handleSoftDelete}>
                                Xóa tài khoản
                            </button>
                        </>
                    ) : (
                        <button className={styles.btnEnable} onClick={handleRestore}>
                            Khôi phục tài khoản
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
