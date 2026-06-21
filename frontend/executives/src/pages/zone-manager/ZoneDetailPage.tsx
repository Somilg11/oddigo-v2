import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, DollarSign, Briefcase, Users, Clock, BarChart3, UserPlus } from "lucide-react";
import type { ZoneStats } from "@/types";

export default function ZoneDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [stats, setStats] = useState<ZoneStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setError(null);
                const res = await api.get(`/zone-manager/zones/${id}/stats`);
                setStats(extractData(res));
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load zone");
                logger.error("Failed to fetch zone stats:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} />;
    if (!stats) return <div className="text-center py-20"><p className="text-muted-foreground">Zone not found.</p></div>;

    const { metrics } = stats;

    return (
        <div className="space-y-6">
            <button onClick={() => navigate("/zones")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Zones
            </button>

            <div>
                <h1 className="text-2xl font-bold">{stats.zone.name}</h1>
                <p className="text-muted-foreground text-sm">{stats.zone.city}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: "Revenue", value: `₹${metrics.revenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600 dark:text-green-400" },
                    { label: "Completed", value: metrics.completedJobs.toString(), icon: Briefcase, color: "text-primary" },
                    { label: "Workers", value: metrics.activeWorkers.toString(), icon: Users, color: "text-blue-600 dark:text-blue-400" },
                    { label: "Pending", value: metrics.pendingJobs.toString(), icon: Clock, color: "text-orange-600 dark:text-orange-400" },
                ].map((item) => (
                    <Card key={item.label}>
                        <CardContent className="p-4">
                            <item.icon className={`h-5 w-5 ${item.color} mb-2`} />
                            <p className="text-2xl font-bold">{item.value}</p>
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-12" onClick={() => navigate(`/zones/${id}/supply-demand`)}>
                    <BarChart3 className="h-4 w-4 mr-2" /> Supply & Demand
                </Button>
                <Button variant="outline" className="w-full justify-start h-12" onClick={() => navigate(`/zones/${id}/recruit`)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Recruit Workers
                </Button>
            </div>
        </div>
    );
}
