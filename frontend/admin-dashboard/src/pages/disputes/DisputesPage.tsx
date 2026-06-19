import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractList } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { AlertTriangle } from "lucide-react";
import type { Job } from "@/types";

export default function DisputesPage() {
    const [disputes, setDisputes] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDisputes = async () => {
        try {
            setError(null);
            const response = await api.get("/admin/disputes");
            setDisputes(extractList(response));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch disputes";
            setError(message);
            logger.error("Failed to fetch disputes:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={fetchDisputes} />;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Disputes</h1>

            {disputes.length === 0 ? (
                <EmptyState title="No disputes" description="Cancelled or charged jobs will appear here." />
            ) : (
                <div className="space-y-3">
                    {disputes.map((job) => (
                        <Card key={job._id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">{job.subServiceName || job.serviceType}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {job.location?.address || "No address"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-orange-600 bg-orange-50">
                                        <AlertTriangle className="h-3 w-3" />
                                        {job.status.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
