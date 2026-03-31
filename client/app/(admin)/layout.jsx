'use client';

import { useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './layout.module.css';

function AdminSidebar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

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

                <button className={styles.themeToggle} onClick={toggleTheme}>
                    {theme === 'dark' ? (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                            Light mode
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                            Dark mode
                        </>
                    )}
                </button>

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
    );
}

export default function AdminLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        } else if (!loading && user && user.role !== 'admin') {
            router.replace('/403');
        }
    }, [user, loading]);

    if (loading || !user) return null;

    return (
        <ThemeProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </ThemeProvider>
    );
}

function AdminLayoutInner({ children }) {
    const { user, loading } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        } else if (!loading && user && user.role !== 'admin') {
            router.replace('/403');
        }
    }, [user, loading]);

    if (loading || !user) return null;

    return (
        <div className={`${styles.adminLayout} ${theme === 'light' ? styles.light : ''}`}>
            <AdminSidebar />
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
