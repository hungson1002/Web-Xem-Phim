'use client';

import HeroBanner from '@/components/HeroBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import MovieSlider from '@/components/MovieSlider';
import { getAllMovies } from '@/lib/movies';
import { getWatchHistory } from '@/lib/watchHistory';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function HomePage() {
    const [featuredMovies, setFeaturedMovies] = useState([]);
    const [recentMovies, setRecentMovies] = useState([]);
    const [seriesMovies, setSeriesMovies] = useState([]);
    const [singleMovies, setSingleMovies] = useState([]);
    const [watchHistory, setWatchHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, loading: authLoading } = useAuth();

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                // Lấy phim mới nhất
                const recentRes = await getAllMovies(1, 20);
                const recent = recentRes.data || recentRes || [];
                setRecentMovies(recent);
                setFeaturedMovies(recent.slice(0, 5));

                // Lấy phim bộ
                const seriesRes = await getAllMovies(1, 12, '', 'series');
                setSeriesMovies(seriesRes.data || seriesRes || []);

                // Lấy phim lẻ
                const singleRes = await getAllMovies(1, 12, '', 'single');
                setSingleMovies(singleRes.data || singleRes || []);

            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, []);

    useEffect(() => {
        const loadHistory = async () => {
            if (authLoading || !isAuthenticated) {
                setWatchHistory([]);
                return;
            }
            try {
                const res = await getWatchHistory(12);
                const list = res.data || res || [];
                const movies = list
                    .map((item) => item.movie)
                    .filter(Boolean);
                setWatchHistory(movies);
            } catch (error) {
                console.error('Error loading watch history:', error);
            }
        };

        loadHistory();
        const handleChange = () => loadHistory();
        window.addEventListener('watch_history_change', handleChange);
        return () => window.removeEventListener('watch_history_change', handleChange);
    }, [isAuthenticated, authLoading]);

    if (loading) {
        return <LoadingSpinner fullPage />;
    }

    return (
        <div className={styles.home}>
            <HeroBanner movies={featuredMovies} />

            <div className={styles.container}>
                {watchHistory.length > 0 && (
                    <MovieSlider
                        title="Đã xem gần đây"
                        movies={watchHistory}
                    />
                )}

                {seriesMovies.length > 0 && (
                    <MovieSlider
                        title="Phim bộ"
                        movies={seriesMovies}
                        viewAllLink="/movies?type=series"
                    />
                )}

                {singleMovies.length > 0 && (
                    <MovieSlider
                        title="Phim lẻ"
                        movies={singleMovies}
                        viewAllLink="/movies?type=single"
                    />
                )}

                <MovieSlider
                    title="Phim mới cập nhật"
                    movies={recentMovies}
                    viewAllLink="/movies"
                />
            </div>
        </div>
    );
}
