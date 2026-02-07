import api from './api';

export const getAllMovies = async (page = 1, limit = 20, sortBy = '', type = '') => {
    let url = `/movies?page=${page}&limit=${limit}`;
    if (sortBy) url += `&sort=${sortBy}`;
    if (type) url += `&type=${type}`;
    const response = await api.get(url);
    return response.data;
};

export const getMoviesByCategory = async (slug, page = 1, limit = 20, sortBy = '') => {
    let url = `/movies/category/${slug}?page=${page}&limit=${limit}`;
    if (sortBy) url += `&sort=${sortBy}`;
    const response = await api.get(url);
    return response.data;
};

export const getMoviesByCountry = async (slug, page = 1, limit = 20, sortBy = '') => {
    let url = `/movies/country/${slug}?page=${page}&limit=${limit}`;
    if (sortBy) url += `&sort=${sortBy}`;
    const response = await api.get(url);
    return response.data;
};

export const getMoviesByYear = async (year, page = 1, limit = 20, sortBy = '') => {
    let url = `/movies/year/${year}?page=${page}&limit=${limit}`;
    if (sortBy) url += `&sort=${sortBy}`;
    const response = await api.get(url);
    return response.data;
};

export const getMovieBySlug = async (slug) => {
    const response = await api.get(`/movies/${slug}`);
    return response.data;
};

export const getMoviesLimit = async (limit) => {
    const response = await api.get(`/movies/limit/${limit}`);
    return response.data;
};

export const getAllCategories = async () => {
    const response = await api.get('/categories');
    return response.data;
};

export const getAllCountries = async () => {
    const response = await api.get('/countries');
    return response.data;
};

export const getComments = async (movieId) => {
    const response = await api.get(`/comments/${movieId}`);
    return response.data;
};

export const addComment = async (data) => {
    const response = await api.post('/comments/add', data);
    return response.data;
};

export const updateComment = async (movieId, commentId, data) => {
    const response = await api.put(`/comments/${movieId}/${commentId}`, data);
    return response.data;
};

export const deleteComment = async (movieId, commentId) => {
    const response = await api.delete(`/comments/${movieId}/${commentId}`);
    return response.data;
};
