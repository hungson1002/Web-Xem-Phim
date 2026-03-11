'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { getRooms, joinRoom } from '@/lib/watchRooms';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './watchParty.module.css';

export default function WatchPartyLobby() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [roomCode, setRoomCode] = useState('');
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchRooms();
        }
    }, [isAuthenticated]);

    const fetchRooms = async () => {
        try {
            const res = await getRooms();
            setRooms(res.data || []);
        } catch (error) {
            console.error('Fetch rooms error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!roomCode.trim()) {
            toast.error('Vui lòng nhập mã phòng');
            return;
        }

        setJoining(true);
        try {
            await joinRoom(roomCode.trim().toUpperCase());
            router.push(`/watch-party/${roomCode.trim().toUpperCase()}`);
        } catch (error) {
            toast.error(error.message || 'Không tìm thấy phòng');
        } finally {
            setJoining(false);
        }
    };

    const handleQuickJoin = async (code) => {
        setJoining(true);
        try {
            await joinRoom(code);
            router.push(`/watch-party/${code}`);
        } catch (error) {
            toast.error(error.message || 'Không thể tham gia phòng');
        } finally {
            setJoining(false);
        }
    };

    if (authLoading) return <LoadingSpinner fullPage />;
    if (!isAuthenticated) return null;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>Watch Party</h1>
                <p className={styles.subtitle}>Xem phim cùng bạn bè theo thời gian thực</p>

                <div className={styles.optionsGrid}>
                    {/* Option 1: Tạo phòng */}
                    <div className={styles.optionCard}>
                        <div className={styles.optionIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v8M8 12h8" />
                            </svg>
                        </div>
                        <h2>Tạo phòng mới</h2>
                        <p>Chọn phim và mời bạn bè cùng xem</p>
                        <Link href="/watch-party/create" className={styles.optionBtn}>
                            Tạo phòng
                        </Link>
                    </div>

                    {/* Option 2: Tham gia phòng */}
                    <div className={styles.optionCard}>
                        <div className={styles.optionIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                        </div>
                        <h2>Tham gia phòng</h2>
                        <p>Nhập mã phòng để xem cùng bạn bè</p>
                        <form onSubmit={handleJoinRoom} className={styles.joinForm}>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="Nhập mã phòng (6 ký tự)"
                                maxLength={6}
                                className={styles.codeInput}
                            />
                            <button type="submit" disabled={joining || roomCode.length < 6} className={styles.joinBtn}>
                                {joining ? 'Đang tham gia...' : 'Tham gia'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Danh sách phòng active */}
                <div className={styles.activeRooms}>
                    <h2 className={styles.sectionTitle}>Phòng đang hoạt động</h2>
                    {loading ? (
                        <LoadingSpinner />
                    ) : rooms.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Chưa có phòng nào đang hoạt động</p>
                            <p>Hãy tạo phòng mới để bắt đầu!</p>
                        </div>
                    ) : (
                        <div className={styles.roomsGrid}>
                            {rooms.map((room) => (
                                <div key={room._id} className={styles.roomCard}>
                                    <div className={styles.roomPoster}>
                                        {room.moviePoster ? (
                                            <img src={room.moviePoster} alt={room.movieName} />
                                        ) : (
                                            <div className={styles.noPoster}>🎬</div>
                                        )}
                                    </div>
                                    <div className={styles.roomInfo}>
                                        <h3>{room.movieName}</h3>
                                        <div className={styles.roomMeta}>
                                            <span className={styles.hostBadge}>
                                                👑 {room.hostName}
                                            </span>
                                            <span className={styles.participantCount}>
                                                👥 {room.participants?.length || 0}/{room.maxParticipants}
                                            </span>
                                        </div>
                                        <div className={styles.roomCode}>
                                            Mã phòng: <strong>{room.roomCode}</strong>
                                        </div>
                                        <button
                                            onClick={() => handleQuickJoin(room.roomCode)}
                                            disabled={joining}
                                            className={styles.quickJoinBtn}
                                        >
                                            Tham gia
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
