import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <div className={styles.logoIcon}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                            <span>ChillPhim</span>
                        </Link>
                        <p>Xem phim trực tuyến miễn phí với chất lượng cao, cập nhật nhanh nhất</p>
                    </div>

                    <div className={styles.links}>
                        <div className={styles.linkGroup}>
                            <h4>Khám phá</h4>
                            <Link href="/movies">Tất cả phim</Link>
                            <Link href="/movies?type=series">Phim bộ</Link>
                            <Link href="/movies?type=single">Phim lẻ</Link>
                        </div>
                        <div className={styles.linkGroup}>
                            <h4>Thể loại</h4>
                            <Link href="/movies?category=hanh-dong">Hành động</Link>
                            <Link href="/movies?category=tinh-cam">Tình cảm</Link>
                            <Link href="/movies?category=hai-huoc">Hài hước</Link>
                        </div>
                        <div className={styles.linkGroup}>
                            <h4>Hỗ trợ</h4>
                            <Link href="#">Liên hệ</Link>
                            <Link href="#">Điều khoản</Link>
                            <Link href="#">Chính sách</Link>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>© 2024 PhimHay. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
