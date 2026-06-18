import { useAuthStore } from "@/store/auth.store";
import { User } from "lucide-react";

export function AdminTopBar() {
    const { user } = useAuthStore();

    return (
        <header className="bg-white shadow-sm sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6">
            <div className="lg:hidden w-10" />
            <div className="flex items-center gap-2">
                <span className="font-bold text-primary hidden lg:block">Oddigo Admin</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline">{user?.name}</span>
                </div>
            </div>
        </header>
    );
}
