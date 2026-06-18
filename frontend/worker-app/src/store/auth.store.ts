import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkerProfile } from '@/types';

interface AuthState {
    worker: WorkerProfile | null;
    token: string | null;
    setAuth: (worker: WorkerProfile, token: string) => void;
    setAvailability: (isAvailable: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            worker: null,
            token: null,
            setAuth: (worker, token) => {
                localStorage.setItem('oddigo_worker_token', token);
                set({ worker, token });
            },
            setAvailability: (isAvailable) =>
                set((state) => ({
                    worker: state.worker
                        ? { ...state.worker, isOnline: isAvailable }
                        : null,
                })),
            logout: () => {
                set({ worker: null, token: null });
                localStorage.removeItem('oddigo_worker_token');
                localStorage.removeItem('oddigo_worker');
            },
        }),
        {
            name: 'oddigo_worker_auth',
            partialize: (state) => ({ worker: state.worker, token: state.token }),
        }
    )
);
