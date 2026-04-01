import api from './api';

export const adminGetAllUsers = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/users?${query}`);
    return response.data;
};

export const adminGetUserDetail = async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
};

export const adminToggleUserActive = async (id) => {
    const response = await api.patch(`/admin/users/${id}/toggle-active`);
    return response.data;
};

export const adminSoftDeleteUser = async (id) => {
    const response = await api.patch(`/admin/users/${id}/soft-delete`);
    return response.data;
};

export const adminRestoreUser = async (id) => {
    const response = await api.patch(`/admin/users/${id}/restore`);
    return response.data;
};
