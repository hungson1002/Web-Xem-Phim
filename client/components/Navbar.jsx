'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                    <span className={styles.logoText}>ChillPhim</span>
                </Link>

                <div className={styles.navLinks}>
                    <Link href="/" className={styles.navLink}>Trang chủ</Link>
                    <Link href="/movies" className={styles.navLink}>Phim</Link>
                    <Link href="/movies?type=series" className={styles.navLink}>Phim bộ</Link>
                    <Link href="/movies?type=single" className={styles.navLink}>Phim lẻ</Link>
                    <Link href="/watch-party" className={styles.navLink}>Xem Chung</Link>
                </div>

                <div className={styles.navRight}>
                    <Link href="/movies" className={styles.searchBtn}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                    </Link>

                    {isAuthenticated ? (
                        <div className={styles.userMenu} ref={dropdownRef}>
                            <button className={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
                                {user?.avatar ? (
                                    <img 
                                        src={user.avatar} 
                                        alt={user?.name || 'User'} 
                                        className={styles.avatarImage}
                                    />
                                ) : (
                                    <div className={styles.avatar}>
                                        {(user?.name || user?.username)?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </button>
                            {menuOpen && (
                                <div className={styles.dropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <span>{user?.name || user?.username}</span>
                                        <small>{user?.email}</small>
                                    </div>
                                    <Link href="/profile" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        Hồ sơ
                                    </Link>
                                    <Link href="/bookmarks" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                        </svg>
                                        Yêu thích
                                    </Link>
                                    <button onClick={() => { logout(); setMenuOpen(false); }} className={styles.dropdownItem}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.authBtns}>
                            <Link href="/login" className={styles.loginBtn}>Đăng nhập</Link>
                            <Link href="/register" className={styles.registerBtn}>Đăng ký</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
