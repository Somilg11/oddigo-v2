import axios from "axios";
import type { AxiosError } from "axios";
import { logger } from "./logger";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("oddigo_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["x-app-type"] = "USER";
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string }>) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("oddigo_token");
            localStorage.removeItem("oddigo_user_auth");
            window.location.href = "/login";
        }
        if (error.response?.status === 503) {
            window.location.href = "/maintenance";
            return Promise.reject(error);
        }
        const message = error.response?.data?.message || error.message || "Request failed";
        logger.error("API Error:", message);
        return Promise.reject(error);
    }
);

export default api;
