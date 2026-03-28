import api from './api';

export const getWatchHistory = async (limit = 12) => {
    const response = await api.get(`/watch-history?limit=${limit}`);
    return response.data;
};

export const saveWatchHistory = async (movieSlug, currentEp) => {
    const payload = {
        movieSlug,
        lastEpisode: currentEp ? { name: currentEp.name, slug: currentEp.slug } : null
    };
    const response = await api.post('/watch-history', payload);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('watch_history_change'));
    }
    return response.data;
};
