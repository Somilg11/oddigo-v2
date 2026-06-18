import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, Upload, CheckCircle, Clock, XCircle } from "lucide-react";

interface KYCDocument {
    _id: string;
    documentType: string;
    documentUrl: string;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    createdAt: string;
}

const docTypes = [
    { type: "AADHAAR", label: "Aadhaar Card" },
    { type: "PAN", label: "PAN Card" },
    { type: "BANK_DETAILS", label: "Bank Details" },
];

export default function KYCPage() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<KYCDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKyc = async () => {
            try {
                const response = await api.get("/workers/kyc");
                setDocuments(response.data.data || []);
            } catch (error) {
                console.error("Failed to fetch KYC", error);
            } finally {
                setLoading(false);
            }
        };
        fetchKyc();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "VERIFIED": return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "REJECTED": return <XCircle className="h-4 w-4 text-red-500" />;
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

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">KYC Verification</h1>
            </div>

            {docTypes.map((doc) => {
                const existing = documents.find((d) => d.documentType === doc.type);
                return (
                    <Card key={doc.type}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium">{doc.label}</p>
                                {existing ? (
                                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                        {getStatusIcon(existing.status)}
                                        <span className={existing.status === "VERIFIED" ? "text-green-600" : existing.status === "REJECTED" ? "text-red-500" : "text-amber-500"}>
                                            {existing.status}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 mt-1">Not uploaded</p>
                                )}
                            </div>
                            <Button
                                variant={existing ? "outline" : "default"}
                                size="sm"
                                onClick={() => navigate(`/kyc/upload/${doc.type}`)}
                            >
                                <Upload className="h-4 w-4 mr-1" />
                                {existing ? "Re-upload" : "Upload"}
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
