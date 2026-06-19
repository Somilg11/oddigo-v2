import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import SignaturePad from "signature_pad";
import { ArrowLeft, Eraser } from "lucide-react";

export default function DigitalSignaturePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePad | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initCanvas = (canvas: HTMLCanvasElement) => {
        canvasRef.current = canvas;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(ratio, ratio);
        }
        padRef.current = new SignaturePad(canvas, {
            backgroundColor: "rgb(255, 255, 255)",
        });
    };

    const clear = () => padRef.current?.clear();

    const handleSubmit = async () => {
        if (!padRef.current || padRef.current.isEmpty()) {
            setError("Please provide a signature.");
            return;
        }
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const signatureData = padRef.current.toDataURL();
            await api.post(`/jobs/${id}/signature`, { signatureData });
            navigate(`/job/${id}/pay`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to submit signature.";
            setError(message);
            setLoading(false);
            logger.error("Failed to submit signature", err);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-2">Digital Signature</h1>
            <p className="text-gray-500 mb-6">Sign below to confirm job completion</p>

            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Your Signature</CardTitle>
                    <Button variant="ghost" size="sm" onClick={clear}>
                        <Eraser className="h-4 w-4 mr-1" /> Clear
                    </Button>
                </CardHeader>
                <CardContent>
                    <canvas
                        ref={initCanvas}
                        className="w-full h-48 border rounded-lg cursor-crosshair"
                    />
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                    {error}
                </div>
            )}

            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Submit Signature"}
            </Button>
        </div>
    );
}
