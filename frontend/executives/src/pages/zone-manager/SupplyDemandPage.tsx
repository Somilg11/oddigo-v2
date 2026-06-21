import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, Users, Briefcase, AlertTriangle } from "lucide-react";
import type { SupplyDemand } from "@/types";

export default function SupplyDemandPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<SupplyDemand | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setError(null);
                const res = await api.get(`/zone-manager/zones/${id}/supply-demand`);
                setData(extractData(res));
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load data");
                logger.error("Failed to fetch supply/demand:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} />;
    if (!data) return null;

    const ratioPercent = data.ratio === Infinity ? 100 : Math.min(data.ratio * 100, 100);
    const ratioColor = data.needsRecruitment ? "bg-red-500" : data.ratio > 0.5 ? "bg-yellow-500" : "bg-green-500";

    return (
        <div className="space-y-6">
            <button onClick={() => navigate(`/zones/${id}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h1 className="text-2xl font-bold">Supply & Demand</h1>

            {data.needsRecruitment && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                        <p className="text-sm text-destructive">High demand! Pending requests exceed available workers.</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Demand Ratio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div className={`absolute left-0 top-0 h-full ${ratioColor} rounded-full transition-all duration-500`} style={{ width: `${ratioPercent}%` }} />
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold">{data.ratio === Infinity ? "No workers" : `${data.ratio.toFixed(1)}x`}</p>
                        <p className="text-sm text-muted-foreground">demand ratio</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Available", value: data.supply.available, color: "text-green-600 dark:text-green-400" },
                    { label: "Busy", value: data.supply.busy, color: "text-blue-600 dark:text-blue-400" },
                    { label: "Pending", value: data.demand.pendingRequests, color: "text-orange-600 dark:text-orange-400" },
                ].map((item) => (
                    <Card key={item.label}>
                        <CardContent className="p-4 text-center">
                            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {data.needsRecruitment && (
                <Button className="w-full h-12" onClick={() => navigate(`/zones/${id}/recruit`)}>
                    Trigger Recruitment
                </Button>
            )}
        </div>
    );
}
