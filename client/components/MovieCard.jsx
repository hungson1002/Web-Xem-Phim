import Image from 'next/image';
import Link from 'next/link';
import styles from './MovieCard.module.css';

export default function MovieCard({ movie }) {
    const posterUrl = movie.poster_url || movie.thumb_url || '/placeholder.jpg';

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
