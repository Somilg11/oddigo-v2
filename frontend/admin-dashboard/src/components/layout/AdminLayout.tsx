import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

export function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />
            <div className="lg:ml-64">
                <AdminTopBar />
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
