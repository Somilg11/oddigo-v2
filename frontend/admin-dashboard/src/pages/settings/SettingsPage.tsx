import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface HealthStatus {
    status: string;
    uptime: number;
    database: string;
    redis: string;
}

export default function SettingsPage() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [maintenance, setMaintenance] = useState({ app: "user-app", enabled: false });
    const [toggling, setToggling] = useState(false);

    const fetchHealth = async () => {
        try {
            setError(null);
            const response = await api.get("/admin/health");
            setHealth(extractData(response));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch health";
            setError(message);
            logger.error("Failed to fetch health:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    const toggleMaintenance = async (app: string, enabled: boolean) => {
        setToggling(true);
        try {
            await api.post("/admin/maintenance", { app, enabled });
            setMaintenance({ app, enabled });
            const action = enabled ? "enabled" : "disabled";
            setSuccess(`Maintenance mode ${action} for ${app}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to toggle maintenance";
            setError(message);
            logger.error("Failed to toggle maintenance:", err);
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={fetchHealth} />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                    {success}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm">API Status</span>
                        <span className={`flex items-center gap-1 text-sm font-medium ${health?.status === "ok" ? "text-green-600" : "text-red-500"}`}>
                            {health?.status === "ok" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            {health?.status || "Unknown"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Database</span>
                        <span className={`flex items-center gap-1 text-sm font-medium ${health?.database === "connected" ? "text-green-600" : "text-red-500"}`}>
                            {health?.database === "connected" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            {health?.database || "Unknown"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Redis</span>
                        <span className={`flex items-center gap-1 text-sm font-medium ${health?.redis === "connected" ? "text-green-600" : "text-red-500"}`}>
                            {health?.redis === "connected" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            {health?.redis || "Unknown"}
                        </span>
                    </div>
                    {health?.uptime !== undefined && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Uptime</span>
                            <span className="text-sm font-medium">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Maintenance Mode
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">Toggle maintenance mode for each app. Users will see a maintenance screen.</p>
                    {["user-app", "worker-app"].map((app) => (
                        <div key={app} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-sm">{app}</span>
                            <Button
                                variant={maintenance.app === app && maintenance.enabled ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => toggleMaintenance(app, !(maintenance.app === app && maintenance.enabled))}
                                disabled={toggling}
                            >
                                {maintenance.app === app && maintenance.enabled ? "Disable" : "Enable"}
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
