import type { AxiosResponse } from "axios";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
    const data = response.data?.data;
    if (data === undefined || data === null) {
        throw new Error("Unexpected API response: missing data");
    }
    return data;
}

export function extractList<T>(response: AxiosResponse<ApiResponse<T[]>>): T[] {
    const raw = response.data?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return [];
}
