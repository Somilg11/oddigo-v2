import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ArrowLeft, Upload, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface KYCDocument {
    _id: string;
    documentType: string;
    documentUrl: string;
    status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
    rejectionReason?: string;
    createdAt: string;
}

const docTypes = [
    { type: "AADHAAR", label: "Aadhaar Card" },
    { type: "PAN", label: "PAN Card" },
    { type: "BANK_DETAILS", label: "Bank Details" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "PENDING", className: "bg-amber-100 text-amber-700 border-amber-200" },
    SUBMITTED: { label: "SUBMITTED", className: "bg-blue-100 text-blue-700 border-blue-200" },
    VERIFIED: { label: "VERIFIED", className: "bg-green-100 text-green-700 border-green-200" },
    REJECTED: { label: "REJECTED", className: "bg-red-100 text-red-700 border-red-200" },
    NOT_UPLOADED: { label: "NOT UPLOADED", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function KYCPage() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<KYCDocument[]>([]);
    const [verificationStatus, setVerificationStatus] = useState<string>("PENDING");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchKyc();
    }, []);

    const fetchKyc = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/workers/kyc");
            const result = extractData<{ documents: KYCDocument[]; verificationStatus: string }>(response);
            setDocuments(result.documents || []);
            setVerificationStatus(result.verificationStatus || "PENDING");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setError(message);
            logger.error("Failed to fetch KYC:", err);
        } finally {
            setLoading(false);
        }
    };

    const getDocForType = (type: string) => documents.find((d) => d.documentType === type);

    const verifiedCount = docTypes.filter((doc) => {
        const existing = getDocForType(doc.type);
        return existing?.status === "VERIFIED";
    }).length;

    const allUploaded = docTypes.every((doc) => {
        const existing = getDocForType(doc.type);
        return existing && (existing.status === "SUBMITTED" || existing.status === "VERIFIED");
    });

    const handleSubmitForVerification = async () => {
        try {
            setSubmitting(true);
            const response = await api.post("/workers/kyc/submit");
            const result = extractData<{ verificationStatus: string }>(response);
            setVerificationStatus(result.verificationStatus);
            toast.success("KYC submitted for verification!");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to submit";
            toast.error(message);
            logger.error("Failed to submit KYC:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const getDocStatus = (docType: string): keyof typeof statusConfig => {
        const existing = getDocForType(docType);
        if (!existing) return "NOT_UPLOADED";
        return existing.status as keyof typeof statusConfig;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "VERIFIED": return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "REJECTED": return <XCircle className="h-4 w-4 text-red-500" />;
            case "SUBMITTED": return <Clock className="h-4 w-4 text-blue-500" />;
            default: return <Clock className="h-4 w-4 text-amber-500" />;
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
        return <PageError message={error} onRetry={fetchKyc} />;
    }

    const alreadySubmitted = verificationStatus === "PENDING" || verificationStatus === "VERIFIED";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">KYC Verification</h1>
            </div>

            {/* Progress Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Documents Verified</p>
                        <p className="text-sm font-bold">{verifiedCount} of 3</p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(verifiedCount / 3) * 100}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Document Status Cards */}
            {docTypes.map((doc) => {
                const existing = getDocForType(doc.type);
                const docStatus = getDocStatus(doc.type);
                const config = statusConfig[docStatus];
                const isRejected = existing?.status === "REJECTED";
                const isSubmitted = existing?.status === "SUBMITTED";

                return (
                    <Card key={doc.type}>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(docStatus)}
                                    <p className="font-medium">{doc.label}</p>
                                </div>
                                <Badge className={config.className}>{config.label}</Badge>
                            </div>

                            {isRejected && existing?.rejectionReason && (
                                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-600">{existing.rejectionReason}</p>
                                </div>
                            )}

                            {existing?.createdAt && (
                                <p className="text-xs text-muted-foreground">
                                    Uploaded {new Date(existing.createdAt).toLocaleDateString()}
                                </p>
                            )}

                            <div>
                                {isSubmitted ? (
                                    <p className="text-sm text-blue-600 font-medium">Pending review</p>
                                ) : (
                                    <Button
                                        variant={existing ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => navigate(`/kyc/upload/${doc.type}`)}
                                    >
                                        <Upload className="h-4 w-4 mr-1" />
                                        {existing ? "Re-upload" : "Upload"}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Submit for Verification */}
            <div className="pt-2">
                {alreadySubmitted ? (
                    <Button disabled className="w-full" variant="outline">
                        Already Submitted
                    </Button>
                ) : (
                    <Button
                        className="w-full"
                        onClick={handleSubmitForVerification}
                        disabled={!allUploaded || submitting}
                    >
                        {submitting ? <LoadingSpinner size="sm" /> : "Submit for Verification"}
                    </Button>
                )}
                {!allUploaded && !alreadySubmitted && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                        All 3 documents required
                    </p>
                )}
            </div>
        </div>
    );
}
