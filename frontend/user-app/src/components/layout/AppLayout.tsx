import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-50">
            <TopBar />
            <main className="pt-14 pb-16 md:pb-0">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
