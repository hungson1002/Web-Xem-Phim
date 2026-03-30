'use client';

import { adminGetAllUsers } from '@/lib/admin';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminGetAllUsers({ limit: 1 });
                setStats({ total: data.total });
            } catch {
                // ignore
            }
        };
        fetchStats();
    }, []);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Chào mừng đến trang quản trị</p>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div>
                        <div className={styles.statValue}>{stats?.total ?? '...'}</div>
                        <div className={styles.statLabel}>Tổng người dùng</div>
                    </div>
                </div>
            </div>

            <div className={styles.quickLinks}>
                <h2 className={styles.sectionTitle}>Truy cập nhanh</h2>
                <div className={styles.linkGrid}>
                    <a href="/admin/users" className={styles.linkCard}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span>Quản lý User</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
