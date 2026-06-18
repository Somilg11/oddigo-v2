import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";

export function TopBar() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="flex items-center justify-between px-4 h-14">
                <button onClick={() => navigate("/")} className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">Oddigo</span>
                </button>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/notifications")}
                        className="relative"
                    >
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/profile")}
                    >
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                            <User className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>
        </header>
    );
}
