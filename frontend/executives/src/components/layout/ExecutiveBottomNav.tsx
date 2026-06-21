import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { LayoutDashboard, Map, Building2, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { path: "/city", label: "Home", icon: Building2, roles: ["CITY_MANAGER"] },
  { path: "/city/zones", label: "Zones", icon: Map, roles: ["CITY_MANAGER"] },
  { path: "/zone", label: "Home", icon: LayoutDashboard, roles: ["ZONE_MANAGER"] },
  { path: "/field", label: "Tasks", icon: ClipboardCheck, roles: ["FIELD_EXECUTIVE"] },
];

export function ExecutiveBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const filteredNav = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const isActive = (path: string) => {
    const hasSubNav = filteredNav.some(
      (n) => n.path !== path && n.path.startsWith(path + "/")
    );
    return hasSubNav
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 md:hidden">
      <div className="flex items-center justify-around h-14">
        {filteredNav.map((tab) => {
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
