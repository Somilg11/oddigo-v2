import { Outlet } from "react-router-dom";
import { WorkerSidebar } from "./WorkerSidebar";
import { WorkerTopBar } from "./WorkerTopBar";
import { WorkerBottomNav } from "./WorkerBottomNav";

export function WorkerLayout() {
    return (
        <div className="min-h-screen bg-muted/50">
            <WorkerSidebar />
            <div className="md:ml-64">
                <WorkerTopBar />
                <main className="p-4 md:p-6 pb-20 md:pb-6">
                    <Outlet />
                </main>
            </div>
            <WorkerBottomNav />
        </div>
    );
}
