'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import MovieCard from '@/components/MovieCard';
import { getAllCategories, getAllCountries, getAllMovies, getMoviesByCategory, getMoviesByCountry, getMoviesByYear } from '@/lib/movies';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import styles from './movies.module.css';

function MoviesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [movies, setMovies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMovies, setTotalMovies] = useState(0);
    const [sortBy, setSortBy] = useState('');
    const [searchError, setSearchError] = useState('');

    // Hàm xóa dấu tiếng Việt để tìm kiếm không dấu (TK03)
    const removeVietnameseAccents = (str) => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    };

    const categoryFilter = searchParams.get('category') || '';
    const countryFilter = searchParams.get('country') || '';
    const yearFilter = searchParams.get('year') || '';
    const typeFilter = searchParams.get('type') || '';
    const sortParam = searchParams.get('sort') || '';

    // Sync sortBy với URL
    useEffect(() => {
        setSortBy(sortParam);
    }, [sortParam]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [catRes, countryRes] = await Promise.all([getAllCategories(), getAllCountries()]);
                setCategories(catRes.data || catRes || []);
                setCountries(countryRes.data || countryRes || []);
            } catch (e) { console.error(e); }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            try {
                let res;
                const sort = sortParam || sortBy;
                if (categoryFilter) res = await getMoviesByCategory(categoryFilter, currentPage, 20, sort);
                else if (countryFilter) res = await getMoviesByCountry(countryFilter, currentPage, 20, sort);
                else if (yearFilter) res = await getMoviesByYear(yearFilter, currentPage, 20, sort);
                else res = await getAllMovies(currentPage, 20, sort, typeFilter);

                setMovies(res.data || res || []);
                if (res.pagination) {
                    setTotalPages(res.pagination.totalPages || 1);
                    setTotalMovies(res.pagination.total || 0);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchMovies();

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [categoryFilter, countryFilter, yearFilter, typeFilter, currentPage, sortBy, sortParam]);

    const handleFilter = (type, value) => {
        setCurrentPage(1);
        const params = new URLSearchParams(searchParams);

        if (value) {
            params.set(type, value);
        } else {
            params.delete(type);
        }

        router.push(`/movies${params.toString() ? '?' + params.toString() : ''}`);
    };

    const handleSort = (value) => {
        setSortBy(value);
        handleFilter('sort', value);
    };

    const clearFilters = () => {
        setCurrentPage(1);
        setSortBy('');
        setSearchQuery('');
        router.push('/movies');
    };

    const hasActiveFilters = categoryFilter || countryFilter || yearFilter || typeFilter || sortBy || searchQuery;

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const filteredMovies = movies.filter(m => {
        const query = removeVietnameseAccents(searchQuery.toLowerCase());
        const name = removeVietnameseAccents(m.name.toLowerCase());
        const originName = removeVietnameseAccents(m.origin_name?.toLowerCase() || '');
        return name.includes(query) || originName.includes(query);
    });

    // TK05: Validation cho tìm kiếm rỗng
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (value.trim() === '' && searchError) {
            setSearchError('');
        }
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim() === '') {
            setSearchError('Vui lòng nhập từ khóa tìm kiếm');
            return false;
        }
        setSearchError('');
        return true;
    };

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    const getPageTitle = () => {
        if (typeFilter === 'series') return 'Phim bộ';
        if (typeFilter === 'single') return 'Phim lẻ';
        return 'Tất cả phim';
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>{getPageTitle()}</h1>

                <div className={styles.filters}>
                    <div className={styles.searchBox}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm kiếm phim..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        />
                        {searchError && <span className={styles.searchError}>{searchError}</span>}
                    </div>

                    <div className={styles.filterRow}>
                        <select value={categoryFilter} onChange={(e) => handleFilter('category', e.target.value)}>
                            <option value="">Tất cả thể loại</option>
                            {categories.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
                        </select>

                        <select value={countryFilter} onChange={(e) => handleFilter('country', e.target.value)}>
                            <option value="">Tất cả quốc gia</option>
                            {countries.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
                        </select>

                        <select value={yearFilter} onChange={(e) => handleFilter('year', e.target.value)}>
                            <option value="">Tất cả năm</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>

                        <select value={sortBy} onChange={(e) => handleSort(e.target.value)} className={styles.sortSelect}>
                            <option value="">Sắp xếp</option>
                            <option value="year-desc">Năm: Mới nhất</option>
                            <option value="year-asc">Năm: Cũ nhất</option>
                            <option value="rating-desc">Điểm: Cao nhất</option>
                            <option value="rating-asc">Điểm: Thấp nhất</option>
                        </select>

                        {hasActiveFilters && (
                            <button onClick={clearFilters} className={styles.clearBtn}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <div className={styles.activeTags}>
                            {searchQuery && (
                                <span className={styles.tag}>
                                    Tìm: "{searchQuery}"
                                    <button onClick={() => setSearchQuery('')}>&times;</button>
                                </span>
                            )}
                            {typeFilter && (
                                <span className={styles.tag}>
                                    {typeFilter === 'series' && 'Phim bộ'}
                                    {typeFilter === 'single' && 'Phim lẻ'}
                                    <button onClick={() => handleFilter('type', '')}>&times;</button>
                                </span>
                            )}
                            {categoryFilter && (
                                <span className={styles.tag}>
                                    {categories.find(c => c.slug === categoryFilter)?.name || categoryFilter}
                                    <button onClick={() => handleFilter('category', '')}>&times;</button>
                                </span>
                            )}
                            {countryFilter && (
                                <span className={styles.tag}>
                                    {countries.find(c => c.slug === countryFilter)?.name || countryFilter}
                                    <button onClick={() => handleFilter('country', '')}>&times;</button>
                                </span>
                            )}
                            {yearFilter && (
                                <span className={styles.tag}>
                                    Năm {yearFilter}
                                    <button onClick={() => handleFilter('year', '')}>&times;</button>
                                </span>
                            )}
                            {sortBy && (
                                <span className={styles.tag}>
                                    {sortBy === 'year-desc' && 'Năm: Mới nhất'}
                                    {sortBy === 'year-asc' && 'Năm: Cũ nhất'}
                                    {sortBy === 'rating-desc' && 'Điểm: Cao nhất'}
                                    {sortBy === 'rating-asc' && 'Điểm: Thấp nhất'}
                                    <button onClick={() => handleSort('')}>&times;</button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className={styles.loading}><LoadingSpinner size="large" /></div>
                ) : (
                    <>
                        <p className={styles.count}>
                            Tìm thấy <strong>{searchQuery ? filteredMovies.length : totalMovies}</strong> phim
                            {totalPages > 1 && !searchQuery && ` - Trang ${currentPage}/${totalPages}`}
                        </p>
                        <div className={styles.grid}>
                            {filteredMovies.map(movie => <MovieCard key={movie._id} movie={movie} />)}
                        </div>
                        {filteredMovies.length === 0 && <p className={styles.empty}>Không tìm thấy phim nào</p>}

                        {totalPages > 1 && !searchQuery && (
                            <div className={styles.pagination}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={styles.pageBtn}
                                >
                                    ← Trước
                                </button>

                                {currentPage > 3 && (
                                    <>
                                        <button onClick={() => handlePageChange(1)} className={styles.pageNum}>1</button>
                                        {currentPage > 4 && <span className={styles.dots}>...</span>}
                                    </>
                                )}

                                {getPageNumbers().map(page => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`${styles.pageNum} ${page === currentPage ? styles.active : ''}`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                {currentPage < totalPages - 2 && (
                                    <>
                                        {currentPage < totalPages - 3 && <span className={styles.dots}>...</span>}
                                        <button onClick={() => handlePageChange(totalPages)} className={styles.pageNum}>{totalPages}</button>
                                    </>
                                )}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={styles.pageBtn}
                                >
                                    Sau →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function MoviesPage() {
    return (
        <Suspense fallback={<LoadingSpinner fullPage />}>
            <MoviesContent />
        </Suspense>
    );
}
