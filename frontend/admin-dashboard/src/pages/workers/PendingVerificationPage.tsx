import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
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

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const response = await api.get("/admin/workers/pending-verification");
                const all = response.data.data.items || response.data.data || [];
                setWorkers(all.filter((w: WorkerProfile) => w.verificationStatus === "PENDING"));
            } catch (error) {
                console.error("Failed to fetch pending workers", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPending();
    }, []);

    const handleBulkVerify = async (status: "VERIFIED" | "REJECTED") => {
        const docIds = workers.map((w) => w._id);
        if (docIds.length === 0) return;
        try {
            await api.post("/admin/workers/bulk-verify", { documentIds: docIds, status });
            setWorkers([]);
        } catch (error) {
            console.error("Failed to bulk verify", error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
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

            {workers.length === 0 ? (
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
