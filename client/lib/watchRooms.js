import api from './api';

export const createRoom = async (data) => {
    const response = await api.post('/watch-rooms', data);
    return response.data;
};

export const getRooms = async () => {
    const response = await api.get('/watch-rooms');
    return response.data;
};

export const getRoom = async (code) => {
    const response = await api.get(`/watch-rooms/${code}`);
    return response.data;
};

export const joinRoom = async (code) => {
    const response = await api.post(`/watch-rooms/${code}/join`);
    return response.data;
};

export const leaveRoom = async (code) => {
    const response = await api.post(`/watch-rooms/${code}/leave`);
    return response.data;
};

export const closeRoom = async (code) => {
    const response = await api.delete(`/watch-rooms/${code}`);
    return response.data;
};
