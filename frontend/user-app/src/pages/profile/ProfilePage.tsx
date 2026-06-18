import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight, LogOut, User, Bell } from "lucide-react";

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const menuItems = [
        { label: "Edit Profile", icon: User, path: "/profile/edit" },
        { label: "Notifications", icon: Bell, path: "/notifications" },
    ];

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Button>

            <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                    {user?.name?.charAt(0) || "U"}
                </div>
                <div>
                    <h1 className="text-xl font-bold">{user?.name}</h1>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-sm text-gray-500">{user?.phone}</p>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card
                            key={item.path}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(item.path)}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 text-gray-500" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
        </div>
    );
}
