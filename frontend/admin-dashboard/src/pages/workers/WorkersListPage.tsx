import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractList } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Star, CheckCircle, Clock, XCircle } from "lucide-react";
import type { WorkerProfile } from "@/types";

export default function WorkersListPage() {
    const navigate = useNavigate();
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWorkers = async () => {
        try {
            setError(null);
            const response = await api.get("/admin/workers");
            setWorkers(extractList(response));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch workers";
            setError(message);
            logger.error("Failed to fetch workers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    const getVerificationBadge = (status: string) => {
        switch (status) {
            case "VERIFIED": return <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle className="h-3 w-3" /> Verified</span>;
            case "REJECTED": return <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full"><XCircle className="h-3 w-3" /> Rejected</span>;
            default: return <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><Clock className="h-3 w-3" /> Pending</span>;
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
        return <PageError message={error} onRetry={fetchWorkers} />;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Workers</h1>

            {workers.length === 0 ? (
                <EmptyState title="No workers found" description="Worker list will appear here." />
            ) : (
                <div className="space-y-3">
                    {workers.map((worker) => (
                        <Card
                            key={worker._id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/workers/${worker._id}`)}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {worker.user?.name?.charAt(0) || "W"}
                                    </div>
                                    <div>
                                        <p className="font-medium">{worker.user?.name || "Worker"}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                {worker.avgRating?.toFixed(1) || "N/A"}
                                            </span>
                                            <span>{worker.totalJobs || 0} jobs</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getVerificationBadge(worker.verificationStatus)}
                                    <Button variant="ghost" size="sm">View</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
