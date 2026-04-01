import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Tạo headers với token
const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };
    const token = Cookies.get('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Xử lý response - trả về format { data } giống axios
const handleResponse = async (response) => {
    if (!response.ok) {
        if (response.status === 401) {
            Cookies.remove('token');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined') window.location.href = '/login';
        }
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP Error: ${response.status}`);
        error.response = { status: response.status, data: errorData };
        throw error;
    }
    const data = await response.json();
    return { data }; // Trả về { data } để tương thích với axios
};

// API object với các method giống axios
const api = {
    get: async (url) => {
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include',
        });
        return handleResponse(response);
    },

    post: async (url, body) => {
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify(body),
        });
        return handleResponse(response);
    },

    put: async (url, body) => {
        const isFormData = body instanceof FormData;
        const headers = getHeaders();
        if (isFormData) {
            delete headers['Content-Type'];
        }
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: isFormData ? body : JSON.stringify(body),
        });
        return handleResponse(response);
    },

    delete: async (url) => {
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'DELETE',
            headers: getHeaders(),
            credentials: 'include',
        });
        return handleResponse(response);
    },

    patch: async (url, body) => {
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'PATCH',
            headers: getHeaders(),
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined,
        });
        return handleResponse(response);
    },
};

export default api;
