import Image from 'next/image';
import Link from 'next/link';
import styles from './BookmarkCard.module.css';

export default function BookmarkCard({ bookmark, onRemove }) {
    const posterUrl = bookmark.posterUrl || '/placeholder.jpg';

    return (
        <div className={styles.card}>
            <Link href={`/movies/${bookmark.movieSlug}`} className={styles.posterLink}>
                <div className={styles.poster}>
                    <Image
                        src={posterUrl}
                        alt={bookmark.movieName}
                        fill
                        sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 20vw"
                        className={styles.image}
                    />
                </div>
            </Link>
            
            <div className={styles.info}>
                <Link href={`/movies/${bookmark.movieSlug}`} className={styles.title}>
                    {bookmark.movieName}
                </Link>
                
                <div className={styles.meta}>
                    {bookmark.year && <span className={styles.year}>{bookmark.year}</span>}
                    {bookmark.category && bookmark.category.length > 0 && (
                        <span className={styles.category}>{bookmark.category[0].name}</span>
                    )}
                </div>

                <div className={styles.actions}>
                    <Link href={`/movies/${bookmark.movieSlug}/watch`} className={styles.playButton}>
                        Xem phim
                    </Link>
                    <button 
                        onClick={() => onRemove(bookmark.movieId)} 
                        className={styles.removeButton}
                        aria-label="Xóa khỏi yêu thích"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
}
