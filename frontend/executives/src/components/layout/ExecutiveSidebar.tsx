import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Map,
  Building2,
  ClipboardCheck,
  LogOut,
} from "lucide-react";
import type { UserRole } from "@/types";

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { path: "/city", label: "Dashboard", icon: Building2, roles: ["CITY_MANAGER"] },
  { path: "/city/zones", label: "Zones", icon: Map, roles: ["CITY_MANAGER"] },
  { path: "/zone", label: "Dashboard", icon: LayoutDashboard, roles: ["ZONE_MANAGER"] },
  { path: "/field", label: "My Tasks", icon: ClipboardCheck, roles: ["FIELD_EXECUTIVE"] },
];

export function ExecutiveSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const filteredNav = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = user?.role?.replace(/_/g, " ") || "";

  return (
    <aside className="hidden md:flex md:fixed md:top-0 md:left-0 md:h-full md:w-64 md:flex-col md:border-r md:bg-card z-30">
      <div className="p-4 border-b">
        <button onClick={() => navigate("/")} className="text-xl font-bold text-primary">
          Oddigo
        </button>
        <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const hasSubNav = filteredNav.some(
            (n) => n !== item && n.path.startsWith(item.path + "/")
          );
          const isActive = hasSubNav
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
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
