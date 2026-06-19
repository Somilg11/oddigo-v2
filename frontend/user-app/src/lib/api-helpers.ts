import type { AxiosResponse } from "axios";
import type { ApiResponse } from "@/types";

export function extractData<T>(response: AxiosResponse): T {
    const envelope = response.data as ApiResponse<T> | undefined;
    const data = envelope?.data;
    if (data === undefined || data === null) {
        throw new Error("Unexpected API response: missing data");
    }
    return data as T;
}

export function extractList<T>(response: AxiosResponse): T[] {
    const envelope = response.data as ApiResponse<T[] | { items?: T[] }> | undefined;
    const raw = envelope?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as T[];
    if (raw && "items" in raw && Array.isArray(raw.items)) return raw.items;
    return [];
}

export function extractPaginated<T>(response: AxiosResponse) {
    const envelope = response.data as ApiResponse<{ items: T[]; total: number; page: number; limit: number; pages: number }> | undefined;
    return envelope?.data ?? { items: [] as T[], total: 0, page: 1, limit: 10, pages: 0 };
}
