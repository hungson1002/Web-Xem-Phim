'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { getMovieBySlug } from '@/lib/movies';
import { getSocket } from '@/lib/socket';
import { closeRoom, getRoom, joinRoom, leaveRoom } from '@/lib/watchRooms';
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
    const chatListRef = useRef(null);
    const playerWrapperRef = useRef(null);

    const [room, setRoom] = useState(null);
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentServerIdx, setCurrentServerIdx] = useState(0);
    const [currentEpIdx, setCurrentEpIdx] = useState(0);
    const [participants, setParticipants] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [copied, setCopied] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [showAllParticipants, setShowAllParticipants] = useState(false);
    const [chatPanelHeight, setChatPanelHeight] = useState(0);
    const [isMobileView, setIsMobileView] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 980 : false
    ));

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
                setIsHost(String(roomData.host) === String(user?._id || user?.id));
                setCurrentServerIdx(roomData.currentServer || 0);
                setCurrentEpIdx(roomData.currentEpisode || 0);
                setMessages(roomData.messages || []);

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

        // Realtime chat
        socket.on('chat-message', (message) => {
            if (!message?.text) return;
            setMessages((prev) => [...prev, message]);
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
            socket.off('chat-message');
        };
    }, [room, user, code]);

    useEffect(() => {
        if (!chatListRef.current) return;
        chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }, [messages]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 980px)');
        const updateView = (event) => {
            setIsMobileView(event.matches);
        };

        setIsMobileView(mediaQuery.matches);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', updateView);
            return () => mediaQuery.removeEventListener('change', updateView);
        }

        mediaQuery.addListener(updateView);
        return () => mediaQuery.removeListener(updateView);
    }, []);

    useEffect(() => {
        if (!playerWrapperRef.current || typeof window === 'undefined') return;

        const element = playerWrapperRef.current;

        const updateHeight = () => {
            const nextHeight = Math.round(element.getBoundingClientRect().height);
            if (nextHeight > 0) {
                setChatPanelHeight(nextHeight);
            }
        };

        updateHeight();

        let frameId = null;
        const resizeObserver = new ResizeObserver(() => {
            if (frameId) {
                cancelAnimationFrame(frameId);
            }
            frameId = requestAnimationFrame(updateHeight);
        });

        resizeObserver.observe(element);
        window.addEventListener('resize', updateHeight);

        return () => {
            if (frameId) {
                cancelAnimationFrame(frameId);
            }
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateHeight);
        };
    }, []);

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

    const handleSendMessage = () => {
        const text = newMessage.trim();
        if (!text || !socketRef.current) return;

        socketRef.current.emit('chat-message', {
            roomCode: code,
            senderId: user?._id || user?.id,
            senderName: user?.name || user?.email || 'Anonymous',
            senderAvatar: user?.avatar || null,
            text,
        });

        setNewMessage('');
    };

    const handleMessageKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatChatTime = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (authLoading || loading) return <LoadingSpinner fullPage />;
    if (!room || !movie) return null;

    const servers = movie.episodes || [];
    const currentServer = servers[currentServerIdx];
    const episodes = currentServer?.server_data || [];
    const currentEp = episodes[currentEpIdx];
    const currentUserId = String(user?._id || user?.id || '');
    const hostUserId = String(room.host || '');
    const hasMoreParticipants = participants.length > 5;
    const visibleParticipants = showAllParticipants ? participants : participants.slice(0, 5);

    const renderChatPanel = () => (
        <div className={styles.chatCard}>
            <div className={styles.chatHeader}>
                <h3>Chat phòng</h3>
                <span className={styles.chatStatus}>Đang hoạt động</span>
            </div>

            <div ref={chatListRef} className={styles.chatList}>
                {messages.length === 0 ? (
                    <div className={styles.emptyChat}>
                        <p className={styles.emptyChatTitle}>Chưa có tin nhắn nào</p>
                        <p className={styles.emptyChatSub}>Hãy gửi lời chào để bắt đầu cuộc trò chuyện.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMine = String(msg.senderId) === currentUserId;
                        const isSenderHost = String(msg.senderId) === hostUserId;
                        const senderInitial = (msg.senderName || 'U').charAt(0).toUpperCase();

                        return (
                            <div
                                key={`${msg.senderId || 'u'}-${msg.sentAt || idx}-${idx}`}
                                className={`${styles.chatRow} ${isMine ? styles.mine : ''}`}
                            >
                                <div className={styles.chatAvatar}>
                                    {msg.senderAvatar ? (
                                        <img src={msg.senderAvatar} alt={msg.senderName || 'User'} />
                                    ) : (
                                        <span>{senderInitial}</span>
                                    )}
                                </div>

                                <div className={`${styles.chatMessage} ${isMine ? styles.mine : ''}`}>
                                    <div className={styles.chatMeta}>
                                        <span className={styles.chatSender}>
                                            {isMine ? 'Bạn' : (msg.senderName || 'Người dùng')}
                                        </span>

                                        {isSenderHost && (
                                            <span className={styles.chatRole}>Host</span>
                                        )}

                                        <span className={styles.chatTime}>{formatChatTime(msg.sentAt)}</span>
                                    </div>
                                    <p className={styles.chatText}>{msg.text}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className={styles.chatComposer}>
                <div className={styles.chatInputRow}>
                    <input
                        type="text"
                        value={newMessage}
                        maxLength={500}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleMessageKeyDown}
                        className={styles.chatInput}
                        placeholder="Nhập tin nhắn cho mọi người..."
                    />
                    <button
                        type="button"
                        onClick={handleSendMessage}
                        className={styles.sendBtn}
                        disabled={!newMessage.trim()}
                    >
                        Gửi
                    </button>
                </div>
                <div className={styles.chatHintRow}>
                    <span>Nhấn Enter để gửi nhanh</span>
                    <span>{newMessage.length}/500</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={`${styles.layout} ${isChatOpen ? styles.chatOpen : styles.chatClosed}`}>
                {/* Video Player Area */}
                <div className={styles.playerArea}>
                    <div ref={playerWrapperRef} className={styles.playerWrapper}>
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

                    {isMobileView && (
                        <section className={styles.mobileChatSection}>
                            <button
                                type="button"
                                className={`${styles.chatToggle} ${styles.mobileChatToggle}`}
                                onClick={() => setIsChatOpen((prev) => !prev)}
                                aria-expanded={isChatOpen}
                            >
                                <span>{isChatOpen ? '↓' : '→'}</span>
                                <span>{isChatOpen ? 'Thu gọn chat' : 'Mở chat'}</span>
                            </button>

                            <div className={`${styles.mobileChatContent} ${!isChatOpen ? styles.mobileChatContentHidden : ''}`}>
                                {renderChatPanel()}
                            </div>
                        </section>
                    )}

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

                    <div className={styles.detailsGrid}>
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
                            <div className={styles.participantsHeader}>
                                <h3 className={styles.participantsTitle}>Thành viên</h3>
                                <span className={styles.participantsBadge}>{participants.length}</span>
                            </div>

                            <div className={styles.participantsList}>
                                {visibleParticipants.map((p, i) => (
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
                                            {String(p.user) === String(room.host) && (
                                                <span className={styles.hostTag}>👑 Host</span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {hasMoreParticipants && (
                                <button
                                    type="button"
                                    className={styles.participantsToggle}
                                    onClick={() => setShowAllParticipants((prev) => !prev)}
                                >
                                    {showAllParticipants
                                        ? 'Thu gọn còn 5 người'
                                        : `Xem thêm ${participants.length - 5} người`}
                                </button>
                            )}
                        </div>

                        {/* Actions */}
                        <div className={styles.actionsCard}>
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

                {/* Chat Sidebar */}
                {!isMobileView && (
                <aside
                    className={`${styles.chatSidebar} ${styles.desktopChatSidebar} ${isChatOpen ? styles.open : styles.closed}`}
                    style={{ '--chat-panel-height': chatPanelHeight ? `${chatPanelHeight}px` : undefined }}
                >
                    <div className={styles.chatSidebarHeader}>
                        <button
                            type="button"
                            className={styles.chatToggle}
                            onClick={() => setIsChatOpen((prev) => !prev)}
                            aria-expanded={isChatOpen}
                        >
                            <span>{isChatOpen ? '→' : '←'}</span>
                            <span className={styles.chatToggleText}>
                                {isChatOpen ? 'Thu gọn chat' : 'Mở chat'}
                            </span>
                        </button>
                    </div>

                    <div className={`${styles.chatContent} ${!isChatOpen ? styles.chatContentHidden : ''}`}>
                        {renderChatPanel()}
                    </div>
                </aside>
                )}
            </div>
        </div>
    );
}
