import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useState, useRef } from "react";
import { ArrowLeft, Camera, X } from "lucide-react";

export default function BeforePhotoPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [photo, setPhoto] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await uploadToCloudinary(file, "oddigo/before-photos");
            setPhoto(result.secure_url);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            logger.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!id || !photo) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(`/jobs/${id}/before-photo`, { photoUrl: photo });
            navigate(`/jobs/${id}/active`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to upload photo.";
            setError(message);
            logger.error("Failed to upload photo:", err);
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-2">Before Photo</h1>
            <p className="text-gray-500 mb-6">Take a photo of the issue before starting repair</p>

            <Card>
                <CardContent className="py-8">
                    {photo ? (
                        <div className="relative">
                            <img src={photo} alt="Before" className="w-full rounded-lg" />
                            <button
                                onClick={() => setPhoto(null)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                            disabled={uploading}
                        >
                            <Camera className="h-10 w-10 mb-2" />
                            <span>{uploading ? "Uploading..." : "Tap to take photo"}</span>
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
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

            <Button className="w-full mt-4" onClick={handleSubmit} disabled={!photo || loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Submit Before Photo"}
            </Button>
        </div>
    );
}
