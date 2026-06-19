import type { AxiosResponse } from "axios";
import type { ApiResponse } from "@/types";

export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
    const data = response.data?.data;
    if (data === undefined || data === null) {
        throw new Error("Unexpected API response: missing data");
    }
    return data;
}

export function extractList<T>(response: AxiosResponse<ApiResponse<T[] | { items?: T[] }>>): T[] {
    const raw = response.data?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if ("items" in raw && Array.isArray(raw.items)) return raw.items;
    return [];
}

export function extractPaginated<T>(response: AxiosResponse<ApiResponse<{ items: T[]; total: number; page: number; limit: number; pages: number }>>) {
    return response.data?.data ?? { items: [] as T[], total: 0, page: 1, limit: 10, pages: 0 };
}
