import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight, LogOut, User, Bell, Coins, Share2, MapPin, Shield, FileText, HelpCircle, Star } from "lucide-react";

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const formatDate = (d?: string) => {
        if (!d) return "Not set";
        return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const genderLabel = (g?: string) => {
        if (!g) return "Not set";
        return g.charAt(0) + g.slice(1).toLowerCase();
    };

    const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];

    const accountItems = [
        { label: "Edit Profile", icon: User, path: "/profile/edit" },
        { label: "My Addresses", icon: MapPin, path: "/profile/edit", hash: "#addresses" },
        { label: "My Points", icon: Coins, path: "/points" },
        { label: "Refer & Earn", icon: Share2, path: "/refer" },
    ];

    const supportItems = [
        { label: "Notifications", icon: Bell, path: "/notifications" },
        { label: "Help & Support", icon: HelpCircle, path: "/notifications" },
        { label: "Rate Us", icon: Star, path: "/notifications" },
    ];

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Profile</h1>
            </div>

            {/* Profile Header Card */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || "U"
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold truncate">{user?.name}</h2>
                            <p className="text-sm text-muted-foreground truncate">{user?.phone}</p>
                            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => navigate("/profile/edit")}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Details */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground">Gender</p>
                            <p className="font-medium">{genderLabel(user?.gender)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Date of Birth</p>
                            <p className="font-medium">{formatDate(user?.dateOfBirth)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Default Address */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Default Address</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/profile/edit#addresses")} className="text-xs h-7">
                            {user?.addresses?.length ? "Change" : "Add"}
                        </Button>
                    </div>
                    {defaultAddress ? (
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">{defaultAddress.label}</p>
                            <p>{defaultAddress.street}</p>
                            <p>{defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}</p>
                            {defaultAddress.landmark && <p>Landmark: {defaultAddress.landmark}</p>}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No address added yet</p>
                    )}
                </CardContent>
            </Card>

            {/* Account */}
            <section>
                <h3 className="font-semibold mb-2 px-1">Account</h3>
                <div className="space-y-2">
                    {accountItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.label} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(item.path)}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Support */}
            <section>
                <h3 className="font-semibold mb-2 px-1">Support</h3>
                <div className="space-y-2">
                    {supportItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.label} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(item.path)}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Logout */}
            <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>

            <p className="text-center text-xs text-muted-foreground pb-4">Oddigo v2.0</p>
        </div>
    );
}
