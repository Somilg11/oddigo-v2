import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (user, token) => {
                localStorage.setItem('oddigo_token', token);
                set({ user, token });
            },
            setUser: (user) => {
                set({ user });
            },
            logout: () => {
                set({ user: null, token: null });
                localStorage.removeItem('oddigo_token');
            },
        }),
        {
            name: 'oddigo_user_auth',
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
);
