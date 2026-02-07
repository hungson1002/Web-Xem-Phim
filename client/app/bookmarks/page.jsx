'use client';

import BookmarkCard from '@/components/BookmarkCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { getBookmarks, removeBookmark } from '@/lib/bookmarks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './bookmarks.module.css';

export default function BookmarksPage() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
        if (isAuthenticated) {
            getBookmarks()
                .then(res => {
                    const data = res.bookmarks || res.data || res || [];
                    setBookmarks(Array.isArray(data) ? data : []);
                })
                .catch(e => {
                    console.error(e);
                    toast.error('Không thể tải danh sách phim đã lưu');
                    setBookmarks([]);
                })
                .finally(() => setLoading(false));
        }
    }, [isAuthenticated, authLoading, router]);

    const handleRemove = async (movieId) => {
        try {
            await removeBookmark(movieId);
            setBookmarks(prev => {
                const list = Array.isArray(prev) ? prev : [];
                return list.filter(b => b.movieId !== movieId);
            });
            toast.success('Đã xóa khỏi danh sách yêu thích');
        } catch (e) {
            console.error(e);
            toast.error('Không thể xóa phim');
        }
    };

    if (authLoading || loading) return <LoadingSpinner fullPage />;
    if (!isAuthenticated) return null;

    const bookmarksList = Array.isArray(bookmarks) ? bookmarks : [];

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>Phim yêu thích</h1>

                {bookmarksList.length === 0 ? (
                    <div className={styles.empty}>
                        <p>Bạn chưa lưu phim nào</p>
                        <Link href="/movies" className={styles.browseBtn}>Khám phá phim</Link>
                    </div>
                ) : (
                    <>
                        <p className={styles.count}>Bạn đã lưu <strong>{bookmarksList.length}</strong> phim</p>
                        <div className={styles.grid}>
                            {bookmarksList.map((bookmark) => (
                                <BookmarkCard 
                                    key={bookmark.movieId} 
                                    bookmark={bookmark} 
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
