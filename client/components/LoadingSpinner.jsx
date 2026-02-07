import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ size = 'medium', fullPage = false }) {
    if (fullPage) {
        return (
            <div className={styles.fullPage}>
                <div className={`${styles.spinner} ${styles[size]}`} />
                <span className={styles.text}>Đang tải...</span>
            </div>
        );
    }

    return <div className={`${styles.spinner} ${styles[size]}`} />;
}
