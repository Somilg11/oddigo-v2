import axios from 'axios';
import type { AxiosError } from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('oddigo_worker_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string }>) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('oddigo_worker_token');
            localStorage.removeItem('oddigo_worker_auth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
