'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { updateUser } from '@/lib/users';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './profile.module.css';

export default function ProfilePage() {
    const { user, isAuthenticated, loading: authLoading, updateUser: updateAuthUser, logout } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({ username: '', email: '', currentPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push('/login');
        if (user) {
            setFormData(p => ({ ...p, username: user.name || user.username || '', email: user.email || '' }));
            setAvatarPreview(user.avatar || null);
        }
    }, [user, isAuthenticated, authLoading, router]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Kích thước ảnh không được vượt quá 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userId = user?.id || user?._id;
            if (!userId) {
                toast.error('Không tìm thấy thông tin người dùng');
                setLoading(false);
                return;
            }

            const data = { name: formData.username };
            const hasAvatarChange = avatarPreview && avatarPreview !== user?.avatar;
            const hasPasswordChange = formData.newPassword && formData.currentPassword;
            
            if (hasAvatarChange) {
                data.avatar = avatarPreview;
            }
            if (hasPasswordChange) {
                data.currentPassword = formData.currentPassword;
                data.newPassword = formData.newPassword;
            }
            
            const res = await updateUser(userId, data);
            updateAuthUser(res.user || res);
            
            // Thông báo cụ thể dựa vào những gì đã cập nhật
            if (hasAvatarChange && hasPasswordChange) {
                toast.success('Cập nhật ảnh đại diện và mật khẩu thành công!');
            } else if (hasAvatarChange) {
                toast.success('Cập nhật ảnh đại diện thành công!');
            } else if (hasPasswordChange) {
                toast.success('Cập nhật mật khẩu thành công!');
            } else {
                toast.success('Cập nhật thông tin thành công!');
            }
            
            setFormData(p => ({ ...p, currentPassword: '', newPassword: '' }));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <LoadingSpinner fullPage />;
    if (!isAuthenticated) return null;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Left Sidebar - Avatar & Info */}
                <div className={styles.sidebar}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className={styles.avatarImage} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {(user?.name || user?.username)?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <button 
                                type="button" 
                                className={styles.uploadBtn}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </button>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <h2 className={styles.userName}>{user?.name || user?.username || 'User'}</h2>
                        <p className={styles.userEmail}>{user?.email}</p>
                    </div>

                    <div className={styles.infoCard}>
                        <h3>Thông tin tài khoản</h3>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Trạng thái:</span>
                            <span className={styles.infoBadge}>
                                {user?.isVerified ? '✓ Đã xác thực' : '⚠ Chưa xác thực'}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Ngày tham gia:</span>
                            <span className={styles.infoValue}>
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <button onClick={logout} className={styles.logoutBtn}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Đăng xuất
                    </button>
                </div>

                {/* Right Content - Edit Form */}
                <div className={styles.content}>
                    <div className={styles.card}>
                        <h1 className={styles.cardTitle}>Chỉnh sửa hồ sơ</h1>
                        
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Tên hiển thị</label>
                                <input 
                                    type="text" 
                                    value={formData.username} 
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="Nhập tên của bạn"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    value={formData.email} 
                                    disabled 
                                    className={styles.disabled} 
                                />
                                <span className={styles.hint}>Email không thể thay đổi</span>
                            </div>

                            <div className={styles.divider}>
                                <span>Thay đổi mật khẩu</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Mật khẩu hiện tại</label>
                                <input 
                                    type="password" 
                                    value={formData.currentPassword} 
                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Mật khẩu mới</label>
                                <input 
                                    type="password" 
                                    value={formData.newPassword} 
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    placeholder="Nhập mật khẩu mới (tùy chọn)"
                                />
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                            <polyline points="7 3 7 8 15 8"></polyline>
                                        </svg>
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
