'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { getMovieBySlug } from '@/lib/movies';
import { getSocket } from '@/lib/socket';
import { getRoom, joinRoom, leaveRoom, closeRoom } from '@/lib/watchRooms';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './watchRoom.module.css';

export default function WatchRoomPage() {
    const { code } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const isRemoteAction = useRef(false);
    const socketRef = useRef(null);

    const [room, setRoom] = useState(null);
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentServerIdx, setCurrentServerIdx] = useState(0);
    const [currentEpIdx, setCurrentEpIdx] = useState(0);
    const [participants, setParticipants] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [copied, setCopied] = useState(false);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch room + movie data
    useEffect(() => {
        if (!isAuthenticated || !code) return;

        const init = async () => {
            try {
                // Join room via REST
                const joinRes = await joinRoom(code);
                const roomData = joinRes.data || joinRes;
                setRoom(roomData);
                setParticipants(roomData.participants || []);
                setIsHost(roomData.host === user?._id || roomData.host === user?.id);
                setCurrentServerIdx(roomData.currentServer || 0);
                setCurrentEpIdx(roomData.currentEpisode || 0);

                // Fetch movie details
                const movieRes = await getMovieBySlug(roomData.movieSlug);
                const movieData = movieRes.data || movieRes;
                setMovie(movieData);
            } catch (error) {
                console.error('Init error:', error);
                toast.error('Không thể tham gia phòng');
                router.push('/watch-party');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [isAuthenticated, code, user]);

    // Get current m3u8 link
    const getCurrentM3U8 = useCallback(() => {
        if (!movie?.episodes) return null;
        const server = movie.episodes[currentServerIdx];
        if (!server) return null;
        const ep = server.server_data?.[currentEpIdx];
        return ep?.link_m3u8 || null;
    }, [movie, currentServerIdx, currentEpIdx]);

    // Initialize HLS player
    useEffect(() => {
        const m3u8Url = getCurrentM3U8();
        if (!m3u8Url || !videoRef.current) return;

        const initHLS = async () => {
            const Hls = (await import('hls.js')).default;

            if (hlsRef.current) {
                hlsRef.current.destroy();
            }

            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                });
                hls.loadSource(m3u8Url);
                hls.attachMedia(videoRef.current);
                hlsRef.current = hls;

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        console.error('HLS fatal error:', data);
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            hls.startLoad();
                        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            hls.recoverMediaError();
                        }
                    }
                });
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                videoRef.current.src = m3u8Url;
            }
        };

        initHLS();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [getCurrentM3U8]);

    // Socket.IO connection + event handlers
    useEffect(() => {
        if (!room || !user) return;

        const socket = getSocket();
        socketRef.current = socket;

        // Join socket room
        socket.emit('join-room', {
            roomCode: code,
            userId: user._id || user.id,
            userName: user.name || user.email,
        });

        // Sync state from server (on join)
        socket.on('sync-state', (data) => {
            if (videoRef.current) {
                isRemoteAction.current = true;
                setCurrentServerIdx(data.currentServer || 0);
                setCurrentEpIdx(data.currentEpisode || 0);
                videoRef.current.currentTime = data.currentTime || 0;
                if (data.isPlaying) {
                    videoRef.current.play().catch(() => { });
                }
                setTimeout(() => { isRemoteAction.current = false; }, 500);
            }
        });

        // Remote play
        socket.on('video-play', (data) => {
            if (videoRef.current) {
                isRemoteAction.current = true;
                videoRef.current.currentTime = data.currentTime;
                videoRef.current.play().catch(() => { });
                setTimeout(() => { isRemoteAction.current = false; }, 500);
            }
        });

        // Remote pause
        socket.on('video-pause', (data) => {
            if (videoRef.current) {
                isRemoteAction.current = true;
                videoRef.current.currentTime = data.currentTime;
                videoRef.current.pause();
                setTimeout(() => { isRemoteAction.current = false; }, 500);
            }
        });

        // Remote seek
        socket.on('video-seek', (data) => {
            if (videoRef.current) {
                isRemoteAction.current = true;
                videoRef.current.currentTime = data.currentTime;
                setTimeout(() => { isRemoteAction.current = false; }, 500);
            }
        });

        // Remote episode change
        socket.on('episode-change', (data) => {
            isRemoteAction.current = true;
            setCurrentServerIdx(data.serverIndex);
            setCurrentEpIdx(data.episodeIndex);
            setTimeout(() => { isRemoteAction.current = false; }, 1000);
        });

        // User joined
        socket.on('user-joined', (data) => {
            toast.success(`${data.userName} đã tham gia phòng`);
            // Refetch room to update participant list
            refreshRoom();
        });

        // User left
        socket.on('user-left', () => {
            refreshRoom();
        });

        // Room closed
        socket.on('room-closed', () => {
            toast.error('Phòng đã bị đóng bởi host');
            router.push('/watch-party');
        });

        return () => {
            socket.emit('leave-room', { roomCode: code });
            socket.off('sync-state');
            socket.off('video-play');
            socket.off('video-pause');
            socket.off('video-seek');
            socket.off('episode-change');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('room-closed');
        };
    }, [room, user, code]);

    const refreshRoom = async () => {
        try {
            const res = await getRoom(code);
            const data = res.data || res;
            setParticipants(data.participants || []);
        } catch (e) {
            console.error('Refresh room error:', e);
        }
    };

    // Video event handlers (emit to socket)
    const handlePlay = () => {
        if (isRemoteAction.current || !socketRef.current) return;
        socketRef.current.emit('video-play', {
            roomCode: code,
            currentTime: videoRef.current?.currentTime || 0,
            userId: user?._id || user?.id,
        });
    };

    const handlePause = () => {
        if (isRemoteAction.current || !socketRef.current) return;
        socketRef.current.emit('video-pause', {
            roomCode: code,
            currentTime: videoRef.current?.currentTime || 0,
            userId: user?._id || user?.id,
        });
    };

    const handleSeeked = () => {
        if (isRemoteAction.current || !socketRef.current) return;
        socketRef.current.emit('video-seek', {
            roomCode: code,
            currentTime: videoRef.current?.currentTime || 0,
            userId: user?._id || user?.id,
        });
    };

    const handleEpisodeChange = (serverIdx, epIdx) => {
        if (serverIdx === currentServerIdx && epIdx === currentEpIdx) return;
        setCurrentServerIdx(serverIdx);
        setCurrentEpIdx(epIdx);

        if (socketRef.current) {
            socketRef.current.emit('episode-change', {
                roomCode: code,
                serverIndex: serverIdx,
                episodeIndex: epIdx,
                userId: user?._id || user?.id,
            });
        }
    };

    const handleLeaveRoom = async () => {
        try {
            await leaveRoom(code);
            toast.success('Đã rời phòng');
            router.push('/watch-party');
        } catch (error) {
            console.error('Leave room error:', error);
        }
    };

    const handleCloseRoom = async () => {
        if (!confirm('Bạn có chắc muốn đóng phòng? Tất cả mọi người sẽ bị kick.')) return;
        try {
            if (socketRef.current) {
                socketRef.current.emit('close-room', { roomCode: code });
            }
            await closeRoom(code);
            toast.success('Đã đóng phòng');
            router.push('/watch-party');
        } catch (error) {
            console.error('Close room error:', error);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success('Đã copy mã phòng!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (authLoading || loading) return <LoadingSpinner fullPage />;
    if (!room || !movie) return null;

    const servers = movie.episodes || [];
    const currentServer = servers[currentServerIdx];
    const episodes = currentServer?.server_data || [];
    const currentEp = episodes[currentEpIdx];

    return (
        <div className={styles.page}>
            <div className={styles.layout}>
                {/* Video Player Area */}
                <div className={styles.playerArea}>
                    <div className={styles.playerWrapper}>
                        <video
                            ref={videoRef}
                            className={styles.video}
                            controls
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onSeeked={handleSeeked}
                        />
                    </div>

                    {/* Video Info */}
                    <div className={styles.videoInfo}>
                        <h1 className={styles.movieTitle}>{movie.name}</h1>
                        <p className={styles.episodeLabel}>
                            Đang xem: <strong>{currentEp?.name || 'Tập 1'}</strong>
                            {currentServer && <span> — {currentServer.server_name}</span>}
                        </p>
                    </div>

                    {/* Server Selection */}
                    {servers.length > 1 && (
                        <div className={styles.serverSection}>
                            <h3>Nguồn phát</h3>
                            <div className={styles.serverList}>
                                {servers.map((server, idx) => (
                                    <button
                                        key={idx}
                                        className={`${styles.serverBtn} ${idx === currentServerIdx ? styles.active : ''}`}
                                        onClick={() => handleEpisodeChange(idx, 0)}
                                    >
                                        {server.server_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Episode List */}
                    {episodes.length > 1 && (
                        <div className={styles.epSection}>
                            <h3>Danh sách tập</h3>
                            <div className={styles.epList}>
                                {episodes.map((ep, idx) => (
                                    <button
                                        key={idx}
                                        className={`${styles.epBtn} ${idx === currentEpIdx ? styles.active : ''}`}
                                        onClick={() => handleEpisodeChange(currentServerIdx, idx)}
                                    >
                                        {ep.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    {/* Room Info */}
                    <div className={styles.roomInfoCard}>
                        <h3>Thông tin phòng</h3>
                        <div className={styles.roomCodeDisplay}>
                            <span className={styles.codeLabel}>Mã phòng</span>
                            <div className={styles.codeRow}>
                                <span className={styles.codeValue}>{code}</span>
                                <button onClick={handleCopyCode} className={styles.copyBtn}>
                                    {copied ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className={styles.participantsCard}>
                        <h3>Thành viên ({participants.length})</h3>
                        <div className={styles.participantsList}>
                            {participants.map((p, i) => (
                                <div key={i} className={styles.participant}>
                                    <div className={styles.participantAvatar}>
                                        {p.avatar ? (
                                            <img src={p.avatar} alt={p.name} />
                                        ) : (
                                            <span>{p.name?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span className={styles.participantName}>
                                        {p.name}
                                        {p.user === room.host && (
                                            <span className={styles.hostTag}>👑 Host</span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        {isHost ? (
                            <button onClick={handleCloseRoom} className={styles.closeBtn}>
                                Đóng phòng
                            </button>
                        ) : (
                            <button onClick={handleLeaveRoom} className={styles.leaveBtn}>
                                Rời phòng
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
