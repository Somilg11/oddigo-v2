import axios from "axios";
import type { AxiosError } from "axios";
import { logger } from "./logger";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("oddigo_exec_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string }>) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("oddigo_exec_token");
            localStorage.removeItem("oddigo_exec_auth");
            window.location.href = "/login";
        }
        const message = error.response?.data?.message || error.message || "Request failed";
        logger.error("API Error:", message);
        return Promise.reject(error);
    }
);

export default api;
