import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (user, token) => {
                localStorage.setItem('oddigo_exec_token', token);
                set({ user, token });
            },
            logout: () => {
                set({ user: null, token: null });
                localStorage.removeItem('oddigo_exec_token');
                localStorage.removeItem('oddigo_exec_auth');
            },
        }),
        {
            name: 'oddigo_exec_auth',
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
);
