import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { MapPin, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import type { Zone } from "@/types";

export default function ZoneDashboardPage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setError(null);
                const res = await api.get("/zone-manager/zones");
                setZones(extractData(res));
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load zones");
                logger.error("Failed to fetch zones:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} onRetry={() => window.location.reload()} />;

    return (
        <div className="space-y-4">
            {zones.length === 0 ? (
                <EmptyState title="No zones assigned" description="Contact admin to assign zones." />
            ) : (
                zones.map((zone) => (
                    <Card
                        key={zone._id}
                        className="active:scale-[0.98] transition-transform cursor-pointer"
                        onClick={() => navigate(`/zones/${zone._id}`)}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{zone.name}</p>
                                <p className="text-sm text-muted-foreground">{zone.city} &middot; {zone.radiusKm} km</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
