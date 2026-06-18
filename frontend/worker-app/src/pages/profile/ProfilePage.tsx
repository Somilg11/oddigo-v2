import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight, User, FileCheck, DollarSign, LogOut } from "lucide-react";

export default function ProfilePage() {
    const navigate = useNavigate();
    const { worker, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const menuItems = [
        { label: "Edit Profile", icon: User, path: "/profile/edit" },
        { label: "KYC Verification", icon: FileCheck, path: "/kyc" },
        { label: "Earnings", icon: DollarSign, path: "/earnings" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Profile</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                    {worker?.user?.name?.charAt(0) || "W"}
                </div>
                <div>
                    <p className="text-xl font-bold">{worker?.user?.name}</p>
                    <p className="text-sm text-gray-500">{worker?.user?.email}</p>
                    <p className="text-sm text-gray-500">{worker?.user?.phone}</p>
                </div>
            </div>

            <div className="space-y-3">
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
