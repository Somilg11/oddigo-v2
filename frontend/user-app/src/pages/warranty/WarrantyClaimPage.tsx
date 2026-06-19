import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, Upload, X } from "lucide-react";

export default function WarrantyClaimPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [description, setDescription] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setUploading(true);
        try {
            const results = await Promise.all(
                Array.from(files).map((file) => uploadToCloudinary(file, "oddigo/warranty"))
            );
            setPhotos((prev) => [...prev, ...results.map((r) => r.secure_url)]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            logger.error("Warranty photo upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        if (!description.trim()) {
            setError("Please describe the issue.");
            return;
        }
        if (!jobId) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(`/warranty/${jobId}/claim`, {
                description,
                photos,
            });
            setSuccess(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to submit claim.";
            setError(message);
            setLoading(false);
            logger.error("Failed to submit warranty claim", err);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <span className="text-2xl">✓</span>
                </div>
                <h2 className="text-xl font-bold mb-2">Claim Submitted</h2>
                <p className="text-gray-500 text-center mb-6">We'll review your claim and get back to you shortly.</p>
                <Button onClick={() => navigate("/")}>Back to Home</Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-2">File Warranty Claim</h1>
            <p className="text-gray-500 mb-6">Describe the issue and provide evidence</p>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Description *</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Describe what went wrong..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Photos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {photos.map((url, i) => (
                                <div key={i} className="relative w-20 h-20">
                                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                                    <button
                                        onClick={() => removePhoto(i)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                                disabled={uploading}
                            >
                                <Upload className="h-6 w-6" />
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handlePhotoUpload}
                        />
                    </CardContent>
                </Card>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <Button className="w-full" onClick={handleSubmit} disabled={loading || uploading}>
                    {loading ? <LoadingSpinner size="sm" /> : "Submit Claim"}
                </Button>
            </div>
        </div>
    );
}
