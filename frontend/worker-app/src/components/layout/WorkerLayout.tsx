import { Outlet } from "react-router-dom";
import { WorkerSidebar } from "./WorkerSidebar";
import { WorkerTopBar } from "./WorkerTopBar";

export function WorkerLayout() {
    return (
        <div className="min-h-screen bg-gray-50">
            <WorkerSidebar />
            <div className="md:ml-64">
                <WorkerTopBar />
                <main className="p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
