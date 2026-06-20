import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { UserSidebar } from "./UserSidebar";

export function AppLayout() {
    return (
        <div className="min-h-screen bg-muted/30">
            <UserSidebar />
            <TopBar />
            <main className="pt-14 pb-16 md:pb-0 md:ml-64">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
