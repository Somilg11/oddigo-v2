import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";

export default function OTPRequestPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequestOtp = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(`/jobs/${id}/request-otp`);
            setSent(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to request OTP.";
            setError(message);
            logger.error("Failed to request OTP:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Request OTP</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Customer Verification</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    {sent ? (
                        <div>
                            <p className="text-green-600 font-medium mb-4">OTP sent to customer!</p>
                            <p className="text-sm text-gray-500 mb-4">
                                Ask the customer for the 6-digit OTP they received.
                            </p>
                            <Button onClick={() => navigate(`/jobs/${id}/otp-verify`)}>
                                Enter OTP
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-500 mb-4">
                                Send an OTP to the customer to verify you are at the location.
                            </p>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                                    {error}
                                </div>
                            )}
                            <Button onClick={handleRequestOtp} disabled={loading}>
                                {loading ? <LoadingSpinner size="sm" /> : <><Send className="h-4 w-4 mr-1" /> Send OTP</>}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
