'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { getAllMovies } from '@/lib/movies';
import { createRoom } from '@/lib/watchRooms';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './create.module.css';

export default function CreateRoomPage() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [movies, setMovies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMovies();
        }
    }, [isAuthenticated]);

    const fetchMovies = async () => {
        try {
            const res = await getAllMovies(1, 50);
            setMovies(res.data || res || []);
        } catch (error) {
            console.error('Fetch movies error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovies = movies.filter(movie =>
        movie.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.origin_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateRoom = async (movie) => {
        setCreating(true);
        setSelectedMovie(movie._id);
        try {
            const res = await createRoom({
                movieSlug: movie.slug,
                movieName: movie.name,
                moviePoster: movie.poster_url || movie.thumb_url || ''
            });
            const room = res.data || res;
            toast.success(`Đã tạo phòng: ${room.roomCode}`);
            router.push(`/watch-party/${room.roomCode}`);
        } catch (error) {
            toast.error(error.message || 'Không thể tạo phòng');
            setCreating(false);
            setSelectedMovie(null);
        }
    };

    if (authLoading) return <LoadingSpinner fullPage />;
    if (!isAuthenticated) return null;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    ← Quay lại
                </button>

                <h1 className={styles.pageTitle}>Chọn phim để tạo phòng</h1>
                <p className={styles.subtitle}>Chọn một bộ phim bạn muốn xem cùng bạn bè</p>

                <div className={styles.searchBar}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm phim..."
                        className={styles.searchInput}
                    />
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : filteredMovies.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Không tìm thấy phim nào</p>
                    </div>
                ) : (
                    <div className={styles.moviesGrid}>
                        {filteredMovies.map((movie) => (
                            <button
                                key={movie._id}
                                className={`${styles.movieItem} ${selectedMovie === movie._id ? styles.selected : ''}`}
                                onClick={() => handleCreateRoom(movie)}
                                disabled={creating}
                            >
                                <div className={styles.moviePoster}>
                                    <img
                                        src={movie.poster_url || movie.thumb_url}
                                        alt={movie.name}
                                        loading="lazy"
                                    />
                                    <div className={styles.movieOverlay}>
                                        {creating && selectedMovie === movie._id ? (
                                            <div className={styles.creatingSpinner}>
                                                <div className="spinner" />
                                            </div>
                                        ) : (
                                            <span className={styles.selectLabel}>Chọn phim này</span>
                                        )}
                                    </div>
                                    {movie.quality && (
                                        <span className={styles.qualityBadge}>{movie.quality}</span>
                                    )}
                                </div>
                                <div className={styles.movieMeta}>
                                    <h3>{movie.name}</h3>
                                    <p className={styles.movieSub}>
                                        {movie.origin_name}
                                        {movie.year ? ` (${movie.year})` : ''}
                                    </p>
                                    <span className={styles.episodeBadge}>
                                        {movie.episode_current || 'Full'}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
