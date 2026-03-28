'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { getMovieBySlug } from '@/lib/movies';
import { saveWatchHistory } from '@/lib/watchHistory';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import styles from './watch.module.css';

function WatchContent() {
    const { slug } = useParams();
    const searchParams = useSearchParams();
    const epSlug = searchParams.get('ep');

    const [movie, setMovie] = useState(null);
    const [currentEp, setCurrentEp] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, loading: authLoading } = useAuth();

    useEffect(() => {
        window.scrollTo(0, 0);
        const load = async () => {
            try {
                const res = await getMovieBySlug(slug);
                const m = res.data || res;
                setMovie(m);
                const eps = m.episodes?.[0]?.server_data || [];
                setCurrentEp(epSlug ? eps.find(e => e.slug === epSlug) || eps[0] : eps[0]);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        if (slug) load();
    }, [slug, epSlug]);

    useEffect(() => {
        if (!authLoading && isAuthenticated && movie?.slug) {
            saveWatchHistory(movie.slug, currentEp).catch(() => {});
        }
    }, [movie, currentEp, isAuthenticated, authLoading]);

    if (loading) return <LoadingSpinner fullPage />;
    if (!movie) return <div className={styles.notFound}><h1>Không tìm thấy</h1><Link href="/movies">← Quay lại</Link></div>;

    const eps = movie.episodes?.[0]?.server_data || [];
    const idx = eps.findIndex(e => e.slug === currentEp?.slug);
    const prev = idx > 0 ? eps[idx - 1] : null;
    const next = idx < eps.length - 1 ? eps[idx + 1] : null;

    return (
        <div className={styles.page}>
            <div className={styles.player}>
                <div className={styles.playerWrapper}>
                    {currentEp?.link_embed ? (
                        <iframe src={currentEp.link_embed} allowFullScreen className={styles.iframe} />
                    ) : (
                        <div className={styles.noSource}>Không có nguồn phát</div>
                    )}
                </div>

                <div className={styles.controls}>
                    {prev ? <Link href={`/movies/${movie.slug}/watch?ep=${prev.slug}`} className={styles.navBtn}>← Tập trước</Link> : <span />}
                    {next && <Link href={`/movies/${movie.slug}/watch?ep=${next.slug}`} className={styles.navBtn}>Tập sau →</Link>}
                </div>
            </div>

            <div className={styles.container}>
                <h1 className={styles.title}>{movie.name}</h1>
                <p className={styles.currentEp}>Đang xem: <strong>{currentEp?.name || 'Tập 1'}</strong></p>

                <div className={styles.epSection}>
                    <h3>Danh sách tập</h3>
                    <div className={styles.epList}>
                        {eps.map((ep, i) => (
                            <Link key={i} href={`/movies/${movie.slug}/watch?ep=${ep.slug}`} className={`${styles.epBtn} ${ep.slug === currentEp?.slug ? styles.active : ''}`}>
                                {ep.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <Link href={`/movies/${movie.slug}`} className={styles.backLink}>← Xem thông tin phim</Link>
            </div>
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullPage />}>
            <WatchContent />
        </Suspense>
    );
}
