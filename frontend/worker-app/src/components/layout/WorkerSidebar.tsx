import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Briefcase, FileCheck, User } from "lucide-react";

const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/jobs/requests", label: "Job Requests", icon: Briefcase },
    { path: "/jobs/history", label: "Job History", icon: FileCheck },
    { path: "/kyc", label: "KYC", icon: FileCheck },
    { path: "/profile", label: "Profile", icon: User },
];

export function WorkerSidebar() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-card border-r z-40 transform transition-transform duration-200
                    -translate-x-full md:translate-x-0`}
            >
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold text-primary">Oddigo Worker</h2>
                </div>
                <nav className="p-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path ||
                            (item.path !== "/" && location.pathname.startsWith(item.path));
                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                                    ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </div>
            </aside>
        </>
    );
}
