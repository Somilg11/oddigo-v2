import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileCheck } from "lucide-react";

const docLabels: Record<string, string> = {
    AADHAAR: "Aadhaar Card",
    PAN: "PAN Card",
    BANK_DETAILS: "Bank Details",
};

export default function KYCUploadPage() {
    const { docType } = useParams<{ docType: string }>();
    const navigate = useNavigate();
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await uploadToCloudinary(file, "oddigo/kyc");
            setFileUrl(result.secure_url);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!docType || !fileUrl) return;
        setLoading(true);
        setError(null);
        try {
            await api.post("/workers/kyc/upload", {
                documentType: docType,
                documentUrl: fileUrl,
            });
            navigate("/kyc");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to upload document.");
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-2">Upload {docLabels[docType || ""] || "Document"}</h1>
            <p className="text-gray-500 mb-6">Take a photo or upload an image of your document</p>

            <Card>
                <CardContent className="py-8">
                    {fileUrl ? (
                        <div className="text-center">
                            <FileCheck className="h-16 w-16 text-green-600 mx-auto mb-4" />
                            <p className="font-medium text-green-600">Document uploaded</p>
                            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setFileUrl(null)}>
                                Upload different file
                            </Button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                            disabled={uploading}
                        >
                            <Upload className="h-10 w-10 mb-2" />
                            <span>{uploading ? "Uploading..." : "Tap to upload"}</span>
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleUpload}
                    />
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mt-4">
                    {error}
                </div>
            )}

            <Button className="w-full mt-4" onClick={handleSubmit} disabled={!fileUrl || loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Submit Document"}
            </Button>
        </div>
    );
}
