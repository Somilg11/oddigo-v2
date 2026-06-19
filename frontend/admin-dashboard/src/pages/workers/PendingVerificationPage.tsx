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
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import type { WorkerProfile } from "@/types";

export default function PendingVerificationPage() {
    const navigate = useNavigate();
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchPending = async () => {
        try {
            setError(null);
            const response = await api.get("/admin/workers/pending-verification");
            const all = extractList<WorkerProfile>(response);
            setWorkers(all.filter((w: WorkerProfile) => w.verificationStatus === "PENDING"));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch pending workers";
            setError(message);
            logger.error("Failed to fetch pending workers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleBulkVerify = async (status: "VERIFIED" | "REJECTED") => {
        const docIds = workers.map((w) => w._id);
        if (docIds.length === 0) return;
        try {
            await api.post("/admin/workers/bulk-verify", { documentIds: docIds, status });
            setWorkers([]);
            const action = status === "VERIFIED" ? "approved" : "rejected";
            setSuccess(`Successfully ${action} all workers`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to bulk verify";
            setError(message);
            logger.error("Failed to bulk verify:", err);
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
        return <PageError message={error} onRetry={fetchPending} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Pending Verification</h1>
                {workers.length > 0 && (
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleBulkVerify("VERIFIED")}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve All
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleBulkVerify("REJECTED")}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject All
                        </Button>
                    </div>
                )}
            </div>

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                    {success}
                </div>
            )}

            {workers.length === 0 && !success ? (
                <EmptyState
                    title="No pending verifications"
                    description="All worker KYC documents have been reviewed."
                />
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
                                    <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{worker.user?.name || "Worker"}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <FileText className="h-3 w-3" /> KYC documents pending review
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">Review</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
