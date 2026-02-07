import api from './api';

export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const verifyEmail = async (data) => {
    const response = await api.post('/auth/verify-email', data);
    return response.data;
};

export const resendOTP = async (email) => {
    const response = await api.post('/auth/resend-verify-otp', { email });
    return response.data;
};

export const googleLogin = async (credential) => {
    const response = await api.post('/auth/google-login', { credential });
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const verifyResetOtp = async (data) => {
    const response = await api.post('/auth/verify-reset-otp', data);
    return response.data;
};

export const resendResetOtp = async (email) => {
    const response = await api.post('/auth/resend-reset-otp', { email });
    return response.data;
};

export const resetPassword = async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
};
