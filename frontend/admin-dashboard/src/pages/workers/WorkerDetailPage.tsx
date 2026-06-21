import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData, extractList } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import {
    ArrowLeft, CheckCircle, XCircle, Star, Shield, FileText, ExternalLink,
    Phone, Mail, MapPin, Clock, Briefcase, AlertTriangle, Award, TrendingUp
} from "lucide-react";
import type { WorkerProfile } from "@/types";

interface KYCDocument {
    _id: string;
    documentType: string;
    documentUrl: string;
    status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
    rejectionReason?: string;
    createdAt: string;
}

const docTypeLabels: Record<string, string> = {
    AADHAAR: "Aadhaar Card",
    PAN: "PAN Card",
    BANK_DETAILS: "Bank Details",
    SKILL_TEST: "Skill Test",
    POLICE_VERIFICATION: "Police Verification",
};

const docStatusVariant: Record<string, "success" | "danger" | "warning" | "default"> = {
    VERIFIED: "success",
    REJECTED: "danger",
    SUBMITTED: "warning",
    PENDING: "default",
};

const verificationVariant: Record<string, "success" | "danger" | "warning"> = {
    VERIFIED: "success",
    REJECTED: "danger",
    PENDING: "warning",
};

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

    useEffect(() => { if (id) fetchWorker(); }, [id]);

    const handleVerify = async (status: "VERIFIED" | "REJECTED") => {
        if (!id) return;
        setActionLoading(true);
        try {
            await api.post("/admin/verify-worker", { workerId: id, status });
            setWorker(prev => prev ? { ...prev, verificationStatus: status } : prev);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to verify worker";
            setError(message);
            logger.error("Failed to verify worker:", err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} onRetry={fetchWorker} />;
    if (!worker) return <div className="p-4 text-center py-20"><p className="text-muted-foreground">Worker not found.</p></div>;

    const user = worker.user;
    const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "W";
    const completionRate = worker.totalJobs > 0 ? Math.round((worker.onTimeJobs / worker.totalJobs) * 100) : 0;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{user?.name || "Worker"}</h1>
                    <p className="text-sm text-muted-foreground">Worker Profile & Verification</p>
                </div>
            </div>

            {/* Hero Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-shrink-0">
                            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                                {initials}
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 className="text-xl font-bold">{user?.name}</h2>
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                                    {user?.email && (
                                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user.email}</span>
                                    )}
                                    {user?.phone && (
                                        <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{user.phone}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={verificationVariant[worker.verificationStatus] || "warning"}>
                                    <Shield className="h-3 w-3 mr-1" />
                                    {worker.verificationStatus}
                                </Badge>
                                {worker.isOnline ? (
                                    <Badge variant="success">Online</Badge>
                                ) : (
                                    <Badge variant="default">Offline</Badge>
                                )}
                                {worker.creditEligibility === "ELIGIBLE" && (
                                    <Badge variant="info">Credit Eligible</Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                            {worker.verificationStatus !== "VERIFIED" && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={actionLoading}
                                        onClick={() => handleVerify("VERIFIED")}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={actionLoading}
                                        onClick={() => handleVerify("REJECTED")}
                                    >
                                        <XCircle className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="text-2xl font-bold">{worker.avgRating?.toFixed(1) || "N/A"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Avg Rating</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Briefcase className="h-5 w-5 text-blue-500" />
                            <span className="text-2xl font-bold">{worker.totalJobs || 0}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total Jobs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <span className="text-2xl font-bold">{completionRate}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">On-Time Rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Award className="h-5 w-5 text-purple-500" />
                            <span className="text-2xl font-bold">{worker.wilsonScore?.toFixed(1) || "N/A"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Wilson Score</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Verification Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant={verificationVariant[worker.verificationStatus] || "warning"}>
                                {worker.verificationStatus}
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Credit Eligibility</span>
                            <span className="text-sm font-medium">{worker.creditEligibility || "N/A"}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Reliability Score</span>
                            <span className="text-sm font-medium">{worker.reliabilityScore?.toFixed(1) || "N/A"}</span>
                        </div>
                        {worker.verificationStatus !== "VERIFIED" && (
                            <>
                                <Separator />
                                <div className="flex gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        disabled={actionLoading}
                                        onClick={() => handleVerify("VERIFIED")}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="flex-1"
                                        disabled={actionLoading}
                                        onClick={() => handleVerify("REJECTED")}
                                    >
                                        <XCircle className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Skills Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Award className="h-4 w-4" /> Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {worker.skills && worker.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {worker.skills.map((skill: string) => (
                                    <span key={skill} className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No skills listed</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* KYC Documents */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" /> KYC Documents
                        {kycDocs.length > 0 && (
                            <span className="text-xs font-normal text-muted-foreground ml-1">({kycDocs.length})</span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {kycDocs.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No KYC documents uploaded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {kycDocs.map((doc) => (
                                <div key={doc._id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{docTypeLabels[doc.documentType] || doc.documentType}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant={docStatusVariant[doc.status] || "default"} className="text-[10px]">
                                                    {doc.status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {doc.rejectionReason && (
                                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> {doc.rejectionReason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <a
                                        href={doc.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 font-medium"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        View <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
