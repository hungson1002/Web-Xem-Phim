import api from './api';

export const getBookmarks = async () => {
    const response = await api.get('/bookmarks');
    return response.data;
};

export const addBookmark = async (movieData) => {
    const response = await api.post('/bookmarks', movieData);
    return response.data;
};

export const removeBookmark = async (movieId) => {
    const response = await api.delete(`/bookmarks/${movieId}`);
    return response.data;
};

export const checkBookmark = async (movieId) => {
    const response = await api.get(`/bookmarks/check/${movieId}`);
    return response.data;
};
