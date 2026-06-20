import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, LayoutDashboard, Users, AlertTriangle, BarChart3, Settings, Shield, Briefcase, Wrench, Megaphone, Tag } from "lucide-react";

const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/services", label: "Services", icon: Wrench },
    { path: "/content/banners", label: "Content", icon: Megaphone },
    { path: "/coupons", label: "Coupons", icon: Tag },
    { path: "/operations/live", label: "Live Operations", icon: Briefcase },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/workers", label: "Workers", icon: Users },
    { path: "/workers/verification", label: "Pending Verification", icon: Shield },
    { path: "/complaints", label: "Complaints", icon: AlertTriangle },
    { path: "/disputes", label: "Disputes", icon: AlertTriangle },
    { path: "/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
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
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-3 left-3 z-50"
                onClick={() => setOpen(!open)}
            >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-card border-r z-40 transform transition-transform duration-200
                    ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            >
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold text-primary">Oddigo Admin</h2>
                </div>
                <nav className="p-2 overflow-y-auto h-[calc(100%-120px)]">
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
