import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import { Clock, CheckCircle, XCircle, IndianRupee } from "lucide-react";
import type { Job } from "@/types";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    COMPLETED: { label: "Completed", color: "text-green-600 bg-green-50", icon: CheckCircle },
    CANCELLED: { label: "Cancelled", color: "text-red-600 bg-red-50", icon: XCircle },
    CANCELLED_CHARGED: { label: "Cancelled (Charged)", color: "text-orange-600 bg-orange-50", icon: XCircle },
    IN_PROGRESS: { label: "In Progress", color: "text-blue-600 bg-blue-50", icon: Clock },
};

export default function JobHistoryPage() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/jobs/history?page=${page}&limit=15`);
            setJobs(extractData(response));
            if (response.data.pagination) {
                setPagination(response.data.pagination);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setError(message);
            logger.error("Failed to fetch jobs:", err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={fetchJobs} />;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Job History</h1>

            {jobs.length === 0 ? (
                <EmptyState
                    title="No jobs yet"
                    description="Your completed jobs will appear here."
                />
            ) : (
                <div className="space-y-3">
                    {jobs.map((job) => {
                        const config = statusConfig[job.status] || { label: job.status, color: "text-gray-600 bg-muted/50", icon: Clock };
                        const Icon = config.icon;
                        return (
                            <Card
                                key={job._id}
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/jobs/history/${job._id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium">{job.subServiceName || job.serviceType}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {job.location?.address || "No address"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(job.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${config.color}`}>
                                                <Icon className="h-3 w-3" />
                                                {config.label}
                                            </span>
                                            {job.estimate && (
                                                <p className="text-sm font-medium mt-1 flex items-center gap-1 justify-end">
                                                    <IndianRupee className="h-3 w-3" />
                                                    {job.estimate.totalEstimate}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </div>
    );
}
