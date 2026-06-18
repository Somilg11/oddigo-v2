import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Bell, Wifi, WifiOff } from "lucide-react";

export function WorkerTopBar() {
    const navigate = useNavigate();
    const { worker } = useAuthStore();

    return (
        <header className="bg-white shadow-sm sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6">
            <div className="md:hidden w-10" />
            <div className="flex items-center gap-2">
                <span className="font-bold text-primary hidden md:block">Oddigo Worker</span>
            </div>
            <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
                    ${worker?.isOnline ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {worker?.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {worker?.isOnline ? "Online" : "Offline"}
                </div>
                <Button variant="ghost" size="icon" onClick={() => navigate("/notifications")}>
                    <Bell className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}
