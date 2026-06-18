import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function OTPDisplayPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [otp, setOtp] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchOtp = async () => {
            try {
                const response = await api.get(`/jobs/${id}`);
                const job = response.data.data;
                setOtp(job?.otp || null);
            } catch (error) {
                console.error("Failed to fetch OTP", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchOtp();
    }, [id]);

    const copyOtp = () => {
        if (otp) {
            navigator.clipboard.writeText(otp);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <Card>
                <CardHeader className="text-center">
                    <CardTitle>Share OTP with Worker</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    {otp ? (
                        <>
                            <div className="text-5xl font-mono font-bold tracking-[0.5em] py-8">
                                {otp}
                            </div>
                            <Button variant="outline" onClick={copyOtp} className="mb-4">
                                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                {copied ? "Copied!" : "Copy OTP"}
                            </Button>
                            <p className="text-sm text-gray-500">
                                Share this code with the worker when they arrive to verify the job.
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-500 py-8">OTP not available yet. Waiting for worker to request.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
