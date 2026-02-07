'use client';

import Link from 'next/link';
import { useRef } from 'react';
import MovieCard from './MovieCard';
import styles from './MovieSlider.module.css';

export default function MovieSlider({ title, movies, viewAllLink }) {
    const sliderRef = useRef(null);

    const scroll = (direction) => {
        if (sliderRef.current) {
            const scrollAmount = 320;
            sliderRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <div className={styles.controls}>
                    {viewAllLink && (
                        <Link href={viewAllLink} className={styles.viewAll}>
                            Xem tất cả
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </Link>
                    )}
                    <div className={styles.navBtns}>
                        <button className={styles.navBtn} onClick={() => scroll('left')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>
                        <button className={styles.navBtn} onClick={() => scroll('right')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.slider} ref={sliderRef}>
                {movies.map((movie) => (
                    <div key={movie._id} className={styles.slide}>
                        <MovieCard movie={movie} />
                    </div>
                ))}
            </div>
        </section>
    );
}
