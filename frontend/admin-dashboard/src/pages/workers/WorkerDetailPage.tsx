import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData, extractList } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, Star, Shield, FileText, ExternalLink } from "lucide-react";
import type { WorkerProfile } from "@/types";

interface KYCDocument {
    _id: string;
    documentType: string;
    documentUrl: string;
    status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
    rejectionReason?: string;
    createdAt: string;
}

export default function WorkerDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [worker, setWorker] = useState<WorkerProfile | null>(null);
    const [kycDocs, setKycDocs] = useState<KYCDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWorker = async () => {
        try {
            setError(null);
            const response = await api.get(`/admin/workers/${id}`);
            setWorker(extractData(response));

            const kycResponse = await api.get(`/admin/workers/${id}/kyc`);
            const docs = extractList<KYCDocument>(kycResponse);
            setKycDocs(docs);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch worker";
            setError(message);
            logger.error("Failed to fetch worker:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchWorker();
    }, [id]);

    const handleVerify = async (status: "VERIFIED" | "REJECTED") => {
        if (!id) return;
        setActionLoading(true);
        try {
            await api.post("/admin/verify-worker", { workerId: id, status });
            navigate("/workers");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to verify worker";
            setError(message);
            logger.error("Failed to verify worker:", err);
        } finally {
            setActionLoading(false);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "VERIFIED": return "text-green-600";
            case "REJECTED": return "text-red-500";
            case "SUBMITTED": return "text-amber-500";
            default: return "text-muted-foreground";
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
        return <PageError message={error} onRetry={fetchWorker} />;
    }

    if (!worker) {
        return (
            <div className="p-4 text-center py-20">
                <p className="text-muted-foreground">Worker not found.</p>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Worker Details</h1>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                {worker.user?.name?.charAt(0) || "W"}
                            </div>
                            <div>
                                <p className="font-medium text-lg">{worker.user?.name}</p>
                                <p className="text-sm text-muted-foreground">{worker.user?.email}</p>
                                <p className="text-sm text-muted-foreground">{worker.user?.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {worker.avgRating?.toFixed(1) || "N/A"} rating
                            </span>
                            <span>{worker.totalJobs || 0} jobs completed</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">
                            Status: <span className="font-bold">{worker.verificationStatus}</span>
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleVerify("VERIFIED")}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleVerify("REJECTED")}
                                disabled={actionLoading}
                            >
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" /> KYC Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {kycDocs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No KYC documents uploaded yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {kycDocs.map((doc) => (
                                    <div key={doc._id} className="flex items-center justify-between border rounded-lg p-3">
                                        <div>
                                            <p className="font-medium text-sm">{getDocTypeLabel(doc.documentType)}</p>
                                            <p className={`text-xs ${getStatusColor(doc.status)}`}>{doc.status}</p>
                                            {doc.rejectionReason && (
                                                <p className="text-xs text-red-500 mt-1">Reason: {doc.rejectionReason}</p>
                                            )}
                                        </div>
                                        <a
                                            href={doc.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-sm flex items-center gap-1"
                                        >
                                            View <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {worker.skills?.map((skill: string) => (
                                <span key={skill} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                    {skill}
                                </span>
                            ))}
                            {(!worker.skills || worker.skills.length === 0) && (
                                <p className="text-sm text-muted-foreground">No skills listed</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
