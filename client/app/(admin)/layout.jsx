'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.replace('/login');
        }
    }, [user, loading]);

    if (loading || !user) return null;

    const navItems = [
        {
            href: '/admin/dashboard',
            label: 'Dashboard',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                </svg>
            )
        },
        {
            href: '/admin/users',
            label: 'Quản lý User',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        },
    ];

    return (
        <div className={styles.adminLayout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo}>
                    <div className={styles.logoIcon}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                    <div>
                        <div className={styles.logoText}>ChillPhim</div>
                        <div className={styles.logoSub}>Admin Panel</div>
                    </div>
                </div>

                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href || pathname.startsWith(item.href + '/') ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.adminInfo}>
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className={styles.adminAvatar} />
                        ) : (
                            <div className={styles.adminAvatarPlaceholder}>
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <div className={styles.adminName}>{user.name}</div>
                            <div className={styles.adminRole}>Admin</div>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={() => { logout(); router.push('/login'); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
