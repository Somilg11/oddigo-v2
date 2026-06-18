import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Wifi, WifiOff, Clock, Briefcase, Users } from "lucide-react";
import type { LiveOperations } from "@/types";

export default function LiveOpsPage() {
    const [ops, setOps] = useState<LiveOperations | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOps = async () => {
            try {
                const response = await api.get("/admin/operations/live");
                setOps(response.data.data);
            } catch (error) {
                console.error("Failed to fetch live operations", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOps();
        const interval = setInterval(fetchOps, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Live Operations</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Auto-refreshing every 30s
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <Briefcase className="h-4 w-4" /> Active Jobs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{ops?.activeJobs || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Pending Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{ops?.pendingRequests || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <Wifi className="h-4 w-4 text-green-600" /> Workers Online
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{ops?.workersOnline || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <Users className="h-4 w-4" /> Workers Busy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{ops?.workersBusy || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Worker Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm"><Wifi className="h-4 w-4 text-green-600" /> Online</span>
                            <span className="font-bold">{ops?.workersOnline || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm"><Briefcase className="h-4 w-4 text-blue-600" /> Busy</span>
                            <span className="font-bold">{ops?.workersBusy || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm"><WifiOff className="h-4 w-4 text-gray-400" /> Offline</span>
                            <span className="font-bold">{ops?.workersOffline || 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
