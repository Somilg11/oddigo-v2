import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";

interface KYCDocument {
    _id: string;
    worker: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    documentType: string;
    documentUrl: string;
    status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
    createdAt: string;
}

interface PendingVerificationsResponse {
    documents: KYCDocument[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export default function PendingVerificationPage() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<KYCDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    const fetchPending = useCallback(async () => {
        try {
            setError(null);
            const response = await api.get(`/admin/workers/pending-verification?page=${page}&limit=15`);
            const result = extractData<PendingVerificationsResponse>(response);
            setDocuments(result.documents || []);
            if (result.pagination) {
                setPagination(result.pagination);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch pending verifications";
            setError(message);
            logger.error("Failed to fetch pending verifications:", err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleBulkVerify = async (status: "VERIFIED" | "REJECTED") => {
        const docIds = documents.map((d) => d._id);
        if (docIds.length === 0) return;
        try {
            await api.post("/admin/workers/bulk-verify", { documentIds: docIds, status });
            setDocuments([]);
            const action = status === "VERIFIED" ? "approved" : "rejected";
            setSuccess(`Successfully ${action} all documents`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to bulk verify";
            setError(message);
            logger.error("Failed to bulk verify:", err);
        }
    };

    const getDocTypeLabel = (type: string) => {
        switch (type) {
            case "AADHAAR": return "Aadhaar Card";
            case "PAN": return "PAN Card";
            case "BANK_DETAILS": return "Bank Details";
            case "SKILL_TEST": return "Skill Test";
            case "POLICE_VERIFICATION": return "Police Verification";
            default: return type;
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
                {documents.length > 0 && (
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

            {documents.length === 0 && !success ? (
                <EmptyState
                    title="No pending verifications"
                    description="All worker KYC documents have been reviewed."
                />
            ) : (
                <div className="space-y-3">
                    {documents.map((doc) => (
                        <Card
                            key={doc._id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/workers/${doc.worker?._id}`)}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{doc.worker?.name || "Worker"}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <FileText className="h-3 w-3" /> {getDocTypeLabel(doc.documentType)} — Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">Review</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </div>
    );
}
