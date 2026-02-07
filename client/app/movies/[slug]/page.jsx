'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import MovieCard from '@/components/MovieCard';
import { useAuth } from '@/context/AuthContext';
import { addBookmark, checkBookmark, removeBookmark } from '@/lib/bookmarks';
import { addComment, deleteComment, getComments, getMovieBySlug, getMoviesByCategory, getMoviesLimit, updateComment } from '@/lib/movies';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './detail.module.css';

export default function MovieDetailPage() {
    const { slug } = useParams();
    const { user, isAuthenticated } = useAuth();
    const [movie, setMovie] = useState(null);
    const [related, setRelated] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookmarked, setBookmarked] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [tab, setTab] = useState('info');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, commentId: null });

    useEffect(() => {
        window.scrollTo(0, 0);
        const load = async () => {
            try {
                const res = await getMovieBySlug(slug);
                const m = res.data || res;
                setMovie(m);

                // Lấy phim cùng thể loại
                const categorySlug = m.category?.[0]?.slug;
                if (categorySlug) {
                    const rel = await getMoviesByCategory(categorySlug, 1, 20);
                    setRelated((rel.data || rel || []).filter(x => x.slug !== slug).slice(0, 6));
                } else {
                    // Fallback nếu không có category
                    const rel = await getMoviesLimit(8);
                    setRelated((rel.data || rel || []).filter(x => x.slug !== slug).slice(0, 6));
                }

                const comm = await getComments(m._id);
                setComments(comm.data || comm || []);

                if (isAuthenticated) {
                    try {
                        const bk = await checkBookmark(m._id);
                        setBookmarked(bk.isBookmarked);
                    } catch { }
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        if (slug) load();
    }, [slug, isAuthenticated]);

    // Đóng menu khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = () => {
            if (activeMenu) setActiveMenu(null);
        };
        
        if (activeMenu) {
            document.addEventListener('click', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [activeMenu]);

    const handleBookmark = async () => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để lưu phim');
            return;
        }
        try {
            if (bookmarked) {
                await removeBookmark(movie._id);
                setBookmarked(false);
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
                toast.success('Đã thêm vào danh sách yêu thích');
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !isAuthenticated) return;
        try {
            const res = await addComment({ movieId: movie._id, content: newComment });
            setComments([res.data || res, ...comments]);
            setNewComment('');
            toast.success('Đã đăng bình luận!');
        } catch (e) {
            toast.error('Không thể đăng bình luận. Vui lòng thử lại!');
            console.error(e);
        }
    };

    const handleEditComment = async (commentId) => {
        if (!editContent.trim()) return;
        try {
            const res = await updateComment(movie._id, commentId, { content: editContent });
            setComments(comments.map(c => c._id === commentId ? (res.data || res) : c));
            setEditingCommentId(null);
            setEditContent('');
            setActiveMenu(null);
            toast.success('Đã cập nhật bình luận!');
        } catch (e) {
            toast.error('Không thể cập nhật bình luận!');
            console.error(e);
        }
    };

    const handleDeleteComment = async () => {
        try {
            await deleteComment(movie._id, deleteModal.commentId);
            setComments(comments.filter(c => c._id !== deleteModal.commentId));
            setActiveMenu(null);
            setDeleteModal({ show: false, commentId: null });
            toast.success('Đã xóa bình luận!');
        } catch (e) {
            toast.error('Không thể xóa bình luận!');
            console.error(e);
        }
    };

    const startEdit = (comment) => {
        setEditingCommentId(comment._id);
        setEditContent(comment.content);
        setActiveMenu(null);
    };

    const cancelEdit = () => {
        setEditingCommentId(null);
        setEditContent('');
    };

    if (loading) return <LoadingSpinner fullPage />;
    if (!movie) return <div className={styles.notFound}><h1>Không tìm thấy phim</h1><Link href="/movies">← Quay lại</Link></div>;

    const episodes = movie.episodes?.[0]?.server_data || [];

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <div className={styles.backdrop} style={{ backgroundImage: `url(${movie.thumb_url || movie.poster_url})` }} />
                <div className={styles.overlay} />
            </div>

            <div className={styles.container}>
                <div className={styles.main}>
                    <div className={styles.poster}>
                        <Image src={movie.poster_url || movie.thumb_url} alt={movie.name} fill className={styles.posterImg} />
                    </div>

                    <div className={styles.info}>
                        <h1 className={styles.title}>{movie.name}</h1>
                        <p className={styles.subtitle}>{movie.origin_name}</p>

                        <div className={styles.meta}>
                            {movie.year && <span>📅 {movie.year}</span>}
                            {movie.time && <span>⏱ {movie.time}</span>}
                            {movie.quality && <span className={styles.quality}>{movie.quality}</span>}
                            {movie.tmdb?.vote_average > 0 && <span className={styles.rating}>⭐ {movie.tmdb.vote_average.toFixed(1)}</span>}
                        </div>

                        <div className={styles.genres}>
                            {movie.category?.map(c => <Link key={c.slug} href={`/movies?category=${c.slug}`} className={styles.genre}>{c.name}</Link>)}
                        </div>

                        <div className={styles.actions}>
                            <Link href={`/movies/${movie.slug}/watch`} className={styles.watchBtn}>▶ Xem phim</Link>
                            <button onClick={handleBookmark} className={`${styles.bookmarkBtn} ${bookmarked ? styles.active : ''}`}>
                                {bookmarked ? '❤️ Đã lưu' : '🤍 Lưu phim'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.tabs}>
                    <button onClick={() => setTab('info')} className={tab === 'info' ? styles.active : ''}>Thông tin</button>
                    <button onClick={() => setTab('episodes')} className={tab === 'episodes' ? styles.active : ''}>Tập phim ({episodes.length})</button>
                    <button onClick={() => setTab('comments')} className={tab === 'comments' ? styles.active : ''}>Bình luận ({comments.length})</button>
                </div>

                <div className={styles.tabContent}>
                    {tab === 'info' && (
                        <div className={styles.infoTab}>
                            {movie.content && <div dangerouslySetInnerHTML={{ __html: movie.content }} className={styles.content} />}
                            {movie.director?.length > 0 && <p><strong>Đạo diễn:</strong> {movie.director.join(', ')}</p>}
                            {movie.actor?.length > 0 && <p><strong>Diễn viên:</strong> {movie.actor.join(', ')}</p>}
                        </div>
                    )}

                    {tab === 'episodes' && (
                        <div className={styles.episodesGrid}>
                            {episodes.map((ep, i) => (
                                <Link key={i} href={`/movies/${movie.slug}/watch?ep=${ep.slug}`} className={styles.epBtn}>{ep.name}</Link>
                            ))}
                        </div>
                    )}

                    {tab === 'comments' && (
                        <div className={styles.commentsTab}>
                            {isAuthenticated && !comments.some(c => (c.userId?._id || c.userId?.id) === (user?.id || user?._id)) && (
                                <form onSubmit={handleComment} className={styles.commentForm}>
                                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Viết bình luận..." rows={3} />
                                    <button type="submit">Gửi</button>
                                </form>
                            )}
                            {comments.length === 0 ? <p className={styles.noComments}>Chưa có bình luận</p> : (
                                comments.map((c) => (
                                    <div key={c._id} className={styles.comment}>
                                        <div className={styles.commentHeader}>
                                            {c.userId?.avatar ? (
                                                <img src={c.userId.avatar} alt={c.userId.name} className={styles.commentAvatar} />
                                            ) : (
                                                <div className={styles.commentAvatarPlaceholder}>
                                                    {(c.userId?.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className={styles.commentInfo}>
                                                <strong>{c.userId?.name || 'Ẩn danh'}</strong>
                                                {c.createdAt && (
                                                    <span className={styles.commentTime}>
                                                        {new Date(c.createdAt).toLocaleDateString('vi-VN', { 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Menu 3 chấm - chỉ hiện với comment của user */}
                                            {((user?.id || user?._id) === (c.userId?._id || c.userId?.id)) && (
                                                <div className={styles.commentMenu}>
                                                    <button 
                                                        className={styles.menuBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenu(activeMenu === c._id ? null : c._id);
                                                        }}
                                                    >
                                                        ⋮
                                                    </button>
                                                    {activeMenu === c._id && (
                                                        <div className={styles.menuDropdown}>
                                                            <button onClick={() => startEdit(c)}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                                Chỉnh sửa
                                                            </button>
                                                            <button onClick={() => setDeleteModal({ show: true, commentId: c._id })} className={styles.deleteBtn}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                </svg>
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Edit mode hoặc hiển thị content */}
                                        {editingCommentId === c._id ? (
                                            <div className={styles.editForm}>
                                                <textarea 
                                                    value={editContent} 
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    rows={3}
                                                    className={styles.editTextarea}
                                                />
                                                <div className={styles.editActions}>
                                                    <button onClick={() => handleEditComment(c._id)} className={styles.saveBtn}>Lưu</button>
                                                    <button onClick={cancelEdit} className={styles.cancelBtn}>Hủy</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={styles.commentContent}>{c.content}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {related.length > 0 && (
                    <section className={styles.related}>
                        <h3>Phim liên quan</h3>
                        <div className={styles.relatedGrid}>
                            {related.map(m => <MovieCard key={m._id} movie={m} />)}
                        </div>
                    </section>
                )}
            </div>

            {/* Modal xác nhận xóa */}
            {deleteModal.show && (
                <div className={styles.modalOverlay} onClick={() => setDeleteModal({ show: false, commentId: null })}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>XÁC NHẬN XÓA?</h3>
                        <p className={styles.modalMessage}>Bạn có chắc muốn xóa bình luận này?</p>
                        <div className={styles.modalActions}>
                            <button onClick={handleDeleteComment} className={styles.modalBtnOk}>OK</button>
                            <button onClick={() => setDeleteModal({ show: false, commentId: null })} className={styles.modalBtnCancel}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
