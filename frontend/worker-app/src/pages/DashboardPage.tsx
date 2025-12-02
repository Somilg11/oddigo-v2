import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
    const { worker, setAvailability, logout } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const toggleAvailability = async () => {
        try {
            setLoading(true);
            const response = await api.patch("/workers/toggle-availability");
            setAvailability(response.data.data.isAvailable);
        } catch (error) {
            console.error("Failed to toggle availability", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        localStorage.removeItem("worker_token");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Worker Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span>{worker?.name} ({worker?.serviceType})</span>
                    <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </div>
            </header>

            <main className="p-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <div className={`text-2xl font-bold mb-4 ${worker?.isAvailable ? "text-green-600" : "text-gray-500"}`}>
                                {worker?.isAvailable ? "ONLINE" : "OFFLINE"}
                            </div>
                            <Button onClick={toggleAvailability} disabled={loading}>
                                {worker?.isAvailable ? "Go Offline" : "Go Online"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Verification</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4">Status: <span className="font-bold">{worker?.isVerified ? "Verified" : "Pending"}</span></p>
                            {!worker?.isVerified && (
                                <Button variant="secondary">Upload Documents</Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
