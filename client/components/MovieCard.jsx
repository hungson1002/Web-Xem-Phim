'use client';

import { useAuth } from '@/context/AuthContext';
import { addBookmark, checkBookmark, removeBookmark } from '@/lib/bookmarks';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './MovieCard.module.css';

export default function MovieCard({ movie }) {
    const { isAuthenticated } = useAuth();
    const [bookmarked, setBookmarked] = useState(false);
    const [loading, setLoading] = useState(false);

    const posterUrl = movie.poster_url || movie.thumb_url || '/placeholder.jpg';

    // Kiểm tra trạng thái bookmark khi component mount
    useEffect(() => {
        if (isAuthenticated && movie._id) {
            checkBookmark(movie._id)
                .then(res => setBookmarked(res.isBookmarked))
                .catch(() => { });
        }
    }, [isAuthenticated, movie._id]);

    // Lắng nghe sự kiện thay đổi bookmark từ các component khác
    useEffect(() => {
        const handleBookmarkChange = (e) => {
            if (e.detail && e.detail.movieId === movie._id) {
                setBookmarked(e.detail.isBookmarked);
            }
        };

        window.addEventListener('bookmark_change', handleBookmarkChange);
        return () => window.removeEventListener('bookmark_change', handleBookmarkChange);
    }, [movie._id]);

    const handleBookmark = async (e) => {
        e.preventDefault(); // Ngăn Link navigate
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để lưu phim');
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            if (bookmarked) {
                await removeBookmark(movie._id);
                setBookmarked(false);
                window.dispatchEvent(new CustomEvent('bookmark_change', {
                    detail: { movieId: movie._id, isBookmarked: false }
                }));
                toast.success('Đã xóa khỏi danh sách yêu thích');
            } else {
                const bookmarkData = {
                    movieId: movie._id,
                    movieSlug: movie.slug,
                    movieName: movie.name,
                    posterUrl: movie.poster_url || movie.thumb_url,
                    year: movie.year,
                    category: movie.category
                };
                await addBookmark(bookmarkData);
                setBookmarked(true);
                window.dispatchEvent(new CustomEvent('bookmark_change', {
                    detail: { movieId: movie._id, isBookmarked: true }
                }));
                toast.success('Đã thêm vào danh sách yêu thích');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Link href={`/movies/${movie.slug}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image
                    src={posterUrl}
                    alt={movie.name}
                    fill
                    sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 20vw"
                    className={styles.image}
                />
                <div className={styles.overlay}>
                    <div className={styles.playBtn}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>

                {/* Heart bookmark button */}
                <button
                    className={`${styles.heartBtn} ${bookmarked ? styles.hearted : ''}`}
                    onClick={handleBookmark}
                    disabled={loading}
                    aria-label={bookmarked ? 'Bỏ lưu phim' : 'Lưu phim'}
                >
                    {bookmarked ? '❤️' : '🤍'}
                </button>

                <div className={styles.badges}>
                    {movie.quality && (
                        <span className={styles.quality}>{movie.quality}</span>
                    )}
                    {movie.lang && (
                        <span className={styles.lang}>{movie.lang}</span>
                    )}
                </div>

                {movie.episode_current && (
                    <span className={styles.episode}>{movie.episode_current}</span>
                )}
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{movie.name}</h3>
                <p className={styles.subtitle}>{movie.origin_name}</p>
                <div className={styles.meta}>
                    {movie.year && <span>{movie.year}</span>}
                    {movie.tmdb?.vote_average > 0 && (
                        <span className={styles.rating}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {movie.tmdb.vote_average.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
