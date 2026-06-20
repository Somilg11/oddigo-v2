import { useLocation, useNavigate } from "react-router-dom";
import { Home, Briefcase, FileCheck, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
    { path: "/", label: "Home", icon: Home },
    { path: "/jobs/requests", label: "Jobs", icon: Briefcase },
    { path: "/jobs/history", label: "History", icon: FileCheck },
    { path: "/earnings", label: "Earnings", icon: Wallet },
    { path: "/profile", label: "Profile", icon: User },
];

export function WorkerBottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 md:hidden">
            <div className="flex items-center justify-around h-14">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.path);
                    return (
                        <button
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            className={cn(
                                "flex flex-col items-center gap-0.5 py-1 px-3 text-xs transition-colors",
                                active ? "text-primary font-semibold" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
