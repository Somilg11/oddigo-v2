import { Outlet } from "react-router-dom";
import { ExecutiveSidebar } from "./ExecutiveSidebar";
import { ExecutiveTopBar } from "./ExecutiveTopBar";
import { ExecutiveBottomNav } from "./ExecutiveBottomNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      <ExecutiveSidebar />
      <ExecutiveTopBar />
      <main className="pt-14 pb-16 md:pb-0 md:ml-64">
        <Outlet />
      </main>
      <ExecutiveBottomNav />
    </div>
  );
}
