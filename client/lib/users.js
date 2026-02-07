import api from './api';

export const getUser = async (id) => {
    const response = await api.get(`/user/${id}`);
    return response.data;
};

export const getAllUsers = async () => {
    const response = await api.get('/user');
    return response.data;
};

export const updateUser = async (id, userData) => {
    const response = await api.put(`/user/${id}`, userData);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await api.delete(`/user/${id}`);
    return response.data;
};
