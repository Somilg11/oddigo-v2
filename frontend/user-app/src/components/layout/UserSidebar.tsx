import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Home, ClipboardList, Coins, Bell, User, LogOut } from "lucide-react";

const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/bookings", label: "Bookings", icon: ClipboardList },
    { path: "/points", label: "Points", icon: Coins },
    { path: "/notifications", label: "Notifications", icon: Bell },
    { path: "/profile", label: "Profile", icon: User },
];

export function UserSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="hidden md:flex md:fixed md:top-0 md:left-0 md:h-full md:w-64 md:flex-col md:border-r md:bg-card z-40">
            <div className="p-4 border-b">
                <button onClick={() => navigate("/")} className="text-xl font-bold text-primary">
                    Oddigo
                </button>
            </div>
            <nav className="p-2 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path !== "/" && location.pathname.startsWith(item.path));
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                                ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
            <div className="p-4 border-t">
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
            </div>
        </aside>
    );
}
