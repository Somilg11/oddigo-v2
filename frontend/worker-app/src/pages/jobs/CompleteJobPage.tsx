import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useState, useRef } from "react";
import { ArrowLeft, Upload, X, CheckCircle } from "lucide-react";

export default function CompleteJobPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [proofUrl, setProofUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await uploadToCloudinary(file, "oddigo/completion-proof");
            setProofUrl(result.secure_url);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            logger.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleComplete = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(`/jobs/${id}/complete`, {
                proofUrl: proofUrl || undefined,
            });
            navigate(`/jobs/${id}/active`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to complete job.";
            setError(message);
            logger.error("Failed to complete job:", err);
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-2">Complete Job</h1>
            <p className="text-muted-foreground mb-6">Upload proof of completion and submit</p>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle className="text-base">Completion Proof</CardTitle>
                </CardHeader>
                <CardContent>
                    {proofUrl ? (
                        <div className="relative">
                            <img src={proofUrl} alt="Proof" className="w-full rounded-lg" />
                            <button
                                onClick={() => setProofUrl(null)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                            disabled={uploading}
                        >
                            <Upload className="h-8 w-8 mb-1" />
                            <span className="text-sm">{uploading ? "Uploading..." : "Upload photo"}</span>
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                    />
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                    {error}
                </div>
            )}

            <Button className="w-full" onClick={handleComplete} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : <><CheckCircle className="h-4 w-4 mr-1" /> Mark as Complete</>}
            </Button>
        </div>
    );
}
