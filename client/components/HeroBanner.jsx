'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './HeroBanner.module.css';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function HeroBanner({ movies }) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!movies || movies.length === 0) return null;

    return (
        <section className={styles.hero}>
            <Swiper
                modules={[Autoplay, Pagination, EffectFade, Navigation]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                speed={1000}
                autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                pagination={{ clickable: true }}
                navigation={true}
                loop={true}
                onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                className={styles.swiper}
            >
                {movies.slice(0, 5).map((movie, index) => (
                    <SwiperSlide key={movie._id}>
                        <div className={`${styles.slide} ${activeIndex === index ? styles.active : ''}`}>
                            <div className={styles.backdrop}>
                                <Image
                                    src={movie.thumb_url || movie.poster_url}
                                    alt={movie.name}
                                    fill
                                    priority
                                    className={styles.backdropImg}
                                />
                                <div className={styles.overlay} />
                            </div>

                            <div className={styles.content}>
                                <div className={styles.info}>
                                    <div className={styles.tags}>
                                        {movie.quality && (
                                            <span className={styles.quality}>{movie.quality}</span>
                                        )}
                                        {movie.year && (
                                            <span className={styles.year}>{movie.year}</span>
                                        )}
                                        {movie.tmdb?.vote_average > 0 && (
                                            <span className={styles.rating}>
                                                ⭐ {movie.tmdb.vote_average.toFixed(1)}
                                            </span>
                                        )}
                                    </div>

                                    <h1 className={styles.title}>{movie.name}</h1>
                                    <h2 className={styles.subtitle}>{movie.origin_name}</h2>

                                    {movie.category?.length > 0 && (
                                        <div className={styles.genres}>
                                            {movie.category.slice(0, 4).map((cat) => (
                                                <span key={cat.slug} className={styles.genre}>
                                                    {cat.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className={styles.description}>
                                        {movie.content?.replace(/<[^>]*>/g, '').slice(0, 200)}...
                                    </p>

                                    <div className={styles.actions}>
                                        <Link href={`/movies/${movie.slug}/watch`} className={styles.watchBtn}>
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            Xem ngay
                                        </Link>
                                        <Link href={`/movies/${movie.slug}`} className={styles.detailBtn}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 16v-4M12 8h.01" />
                                            </svg>
                                            Chi tiết
                                        </Link>
                                    </div>
                                </div>

                                <div className={styles.posterWrapper}>
                                    <Image
                                        src={movie.poster_url || movie.thumb_url}
                                        alt={movie.name}
                                        fill
                                        className={styles.poster}
                                    />
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}
