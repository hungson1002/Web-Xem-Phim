import Cookies from 'js-cookie';
import api from './api';

const LOCAL_STORAGE_KEY = 'guest_search_history';
const MAX_LOCAL_ITEMS = 20;

const hasToken = () => typeof window !== 'undefined' && Boolean(Cookies.get('token'));

const emitHistoryChanged = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('search_history_change'));
    }
};

const readLocalHistory = () => {
    if (typeof window === 'undefined') return [];

    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeLocalHistory = (items) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
};

export const getSearchHistory = async (limit = 10) => {
    if (hasToken()) {
        const response = await api.get(`/search-history?limit=${limit}`);
        return response.data;
    }

    const history = readLocalHistory().slice(0, limit);
    return {
        success: true,
        data: history
    };
};

export const saveSearchHistory = async (keyword) => {
    const cleanKeyword = keyword?.trim();
    if (!cleanKeyword) {
        return { success: false, message: 'Keyword is required' };
    }

    if (hasToken()) {
        const response = await api.post('/search-history', { keyword: cleanKeyword });
        emitHistoryChanged();
        return response.data;
    }

    const normalized = cleanKeyword.toLowerCase();
    const current = readLocalHistory();
    const filtered = current.filter((item) => item.keyword?.toLowerCase() !== normalized);
    const nextItems = [
        {
            _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            keyword: cleanKeyword,
            searchedAt: new Date().toISOString()
        },
        ...filtered
    ].slice(0, MAX_LOCAL_ITEMS);

    writeLocalHistory(nextItems);
    emitHistoryChanged();

    return {
        success: true,
        data: nextItems[0]
    };
};

export const deleteSearchHistoryItem = async (id) => {
    if (hasToken()) {
        const response = await api.delete(`/search-history/${id}`);
        emitHistoryChanged();
        return response.data;
    }

    const nextItems = readLocalHistory().filter((item) => item._id !== id);
    writeLocalHistory(nextItems);
    emitHistoryChanged();

    return {
        success: true
    };
};

export const clearSearchHistory = async () => {
    if (hasToken()) {
        const response = await api.delete('/search-history/all');
        emitHistoryChanged();
        return response.data;
    }

    if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    emitHistoryChanged();

    return {
        success: true
    };
};
