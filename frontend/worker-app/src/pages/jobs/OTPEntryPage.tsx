import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function OTPEntryPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        if (!id || otp.length !== 6) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(`/jobs/${id}/verify-otp`, { otp });
            navigate(`/jobs/${id}/active`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Invalid OTP. Please try again.";
            setError(message);
            logger.error("Failed to verify OTP:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Enter OTP</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Customer OTP</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                        Ask the customer for the 6-digit OTP they received.
                    </p>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                            {error}
                        </div>
                    )}
                    <Input
                        placeholder="6-digit OTP"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="text-center text-lg tracking-widest mb-4"
                    />
                    <Button className="w-full" onClick={handleVerify} disabled={otp.length !== 6 || loading}>
                        {loading ? <LoadingSpinner size="sm" /> : "Verify OTP"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
