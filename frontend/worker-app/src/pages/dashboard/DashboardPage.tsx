import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { Wifi, WifiOff, CheckCircle, DollarSign, Clock, Briefcase } from "lucide-react";

interface WorkerStats {
    totalJobs: number;
    completedJobs: number;
    todayEarnings: number;
    totalEarnings: number;
    avgRating: number;
    activeJobId?: string;
}

export default function DashboardPage() {
    const { worker, setAvailability } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState<WorkerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get("/workers/stats");
                setStats(extractData(response));
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "An error occurred";
                setError(message);
                logger.error("Failed to fetch stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/workers/stats");
            setStats(extractData(response));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setError(message);
            logger.error("Failed to fetch stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async () => {
        try {
            setToggling(true);
            const newStatus = !worker?.isOnline;
            await api.post("/workers/availability", { isOnline: newStatus });
            setAvailability(newStatus);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setError(message);
            logger.error("Failed to toggle availability:", err);
        } finally {
            setToggling(false);
        }
    };

    const isVerified = worker?.verificationStatus === "VERIFIED";

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={() => { setError(null); setLoading(true); fetchStats(); }} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome back, {worker?.user?.name || "Worker"}</p>
                </div>
                <Button
                    onClick={toggleAvailability}
                    disabled={toggling || !isVerified}
                    variant={worker?.isOnline ? "outline" : "default"}
                >
                    {toggling ? (
                        <LoadingSpinner size="sm" />
                    ) : worker?.isOnline ? (
                        <><WifiOff className="h-4 w-4 mr-1" /> Go Offline</>
                    ) : (
                        <><Wifi className="h-4 w-4 mr-1" /> Go Online</>
                    )}
                </Button>
            </div>

            {!isVerified && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                        <p className="text-amber-700 text-sm">
                            Your account is pending verification. Complete KYC to start receiving jobs.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/kyc")}>
                            Complete KYC
                        </Button>
                    </CardContent>
                </Card>
            )}

            {stats?.activeJobId && (
                <Card className="border-primary bg-primary/5 cursor-pointer" onClick={() => navigate(`/jobs/${stats.activeJobId}/active`)}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-primary">Active Job</p>
                            <p className="text-sm text-gray-500">Tap to view details</p>
                        </div>
                        <Briefcase className="h-6 w-6 text-primary" />
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.completedJobs || 0}</div>
                        <p className="text-xs text-gray-400">{stats?.totalJobs || 0} total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" /> Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.todayEarnings || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" /> Total Earnings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.totalEarnings || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Rating
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.avgRating?.toFixed(1) || "N/A"}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
