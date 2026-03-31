'use client';

import { adminGetAllUsers, adminRestoreUser, adminSoftDeleteUser, adminToggleUserActive } from '@/lib/admin';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const STATUS_FILTERS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Vô hiệu' },
    { value: 'deleted', label: 'Đã xóa' },
];

export default function AdminUsersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [status, setStatus] = useState('all');
    const [fetching, setFetching] = useState(true);

    const fetchUsers = async () => {
        setFetching(true);
        try {
            const data = await adminGetAllUsers({ page, limit: 15, search, status });
            setUsers(data.users);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch {
            toast.error('Không thể tải danh sách user');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user) fetchUsers();
    }, [page, search, status, user]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput);
    };

    const handleStatusChange = (val) => {
        setStatus(val);
        setPage(1);
    };

    const handleToggleActive = async (id) => {
        try {
            const res = await adminToggleUserActive(id);
            toast.success(res.message);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi');
        }
    };

    const handleSoftDelete = async (id) => {
        if (!confirm('Xác nhận xóa tài khoản này?')) return;
        try {
            const res = await adminSoftDeleteUser(id);
            toast.success(res.message);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi');
        }
    };

    const handleRestore = async (id) => {
        try {
            const res = await adminRestoreUser(id);
            toast.success(res.message);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Quản lý User</h1>
                <span className={styles.total}>Tổng: {total} tài khoản</span>
            </div>

            <div className={styles.toolbar}>
                <form className={styles.searchBar} onSubmit={handleSearch}>
                    <div className={styles.searchWrapper}>
                        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, username..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button type="submit" className={styles.searchBtn} aria-label="Tìm kiếm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        </button>
                    </div>
                </form>

                <div className={styles.filterGroup}>
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            className={`${styles.filterBtn} ${status === f.value ? styles.filterActive : ''}`}
                            onClick={() => handleStatusChange(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {fetching ? (
                <div className={styles.loading}>Đang tải...</div>
            ) : users.length === 0 ? (
                <div className={styles.empty}>Không có user nào</div>
            ) : (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Avatar</th>
                                    <th>Tên</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} className={u.isDeleted ? styles.deletedRow : ''}>
                                        <td>
                                            {u.avatar ? (
                                                <img src={u.avatar} alt={u.name} className={styles.avatar} />
                                            ) : (
                                                <div className={styles.avatarPlaceholder}>
                                                    {u.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </td>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>{u.username}</td>
                                        <td>
                                            {u.isDeleted ? (
                                                <span className={styles.badgeDeleted}>Đã xóa</span>
                                            ) : u.isActive ? (
                                                <span className={styles.badgeActive}>Hoạt động</span>
                                            ) : (
                                                <span className={styles.badgeInactive}>Vô hiệu</span>
                                            )}
                                        </td>
                                        <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td className={styles.actions}>
                                            <button className={styles.btnDetail} onClick={() => router.push(`/admin/users/${u._id}`)}>
                                                Chi tiết
                                            </button>
                                            {!u.isDeleted ? (
                                                <>
                                                    <button
                                                        className={u.isActive ? styles.btnDisable : styles.btnEnable}
                                                        onClick={() => handleToggleActive(u._id)}
                                                    >
                                                        {u.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                    </button>
                                                    <button className={styles.btnDelete} onClick={() => handleSoftDelete(u._id)}>
                                                        Xóa
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className={styles.btnEnable} onClick={() => handleRestore(u._id)}>
                                                        Khôi phục
                                                    </button>
                                                    <span className={styles.btnPlaceholder} />
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.pagination}>
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>
                            &laquo; Trước
                        </button>
                        <span className={styles.pageInfo}>{page} / {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>
                            Sau &raquo;
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
