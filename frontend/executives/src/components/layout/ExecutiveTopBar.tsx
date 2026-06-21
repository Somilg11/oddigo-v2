import { useAuthStore } from "@/store/auth.store";
import { ThemeToggle } from "@/components/theme-toggle";

export function ExecutiveTopBar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="bg-card shadow-sm sticky top-0 z-50 md:ml-64">
      <div className="flex items-center justify-between px-4 h-14">
        <span className="font-bold text-primary hidden md:block">Oddigo</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{user?.name?.charAt(0) || "E"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
