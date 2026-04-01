'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function ForbiddenPage() {
    return (
        <div className={styles.container}>
            <div className={styles.code}>403</div>
            <h1 className={styles.title}>Không có quyền truy cập</h1>
            <p className={styles.desc}>Bạn không có quyền truy cập trang này.</p>
            <Link href="/" className={styles.btn}>Về trang chủ</Link>
        </div>
    );
}
