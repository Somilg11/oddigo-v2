import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Worker {
    _id: string;
    name: string;
    email: string;
    serviceType: string;
    isAvailable: boolean;
    isVerified: boolean;
}

interface AuthState {
    worker: Worker | null;
    token: string | null;
    setAuth: (worker: Worker, token: string) => void;
    setAvailability: (isAvailable: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            worker: null,
            token: null,
            setAuth: (worker, token) => set({ worker, token }),
            setAvailability: (isAvailable) =>
                set((state) => ({
                    worker: state.worker ? { ...state.worker, isAvailable } : null,
                })),
            logout: () => set({ worker: null, token: null }),
        }),
        {
            name: 'worker-auth-storage',
        }
    )
);
