import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, IndianRupee } from "lucide-react";
import type { Job } from "@/types";

export default function EstimateApprovalPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await api.get(`/jobs/${id}`);
                setJob(response.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load job details.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchJob();
    }, [id]);

    const handleApprove = async (approved: boolean) => {
        if (!id) return;
        setSubmitting(true);
        setError(null);
        try {
            await api.patch(`/jobs/${id}/final-approval`, { approved });
            if (approved) {
                navigate(`/job/${id}`);
            } else {
                navigate("/");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to submit response.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const estimate = job?.estimate;

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Cost Estimate</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <IndianRupee className="h-5 w-5" />
                        Cost Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Visit Charge</span>
                        <span>₹{estimate?.visitCharge || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Labour Cost</span>
                        <span>₹{estimate?.labourCost || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Parts Cost</span>
                        <span>₹{estimate?.partsCost || 0}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold">
                        <span>Total</span>
                        <span>₹{estimate?.totalEstimate || 0}</span>
                    </div>
                    {estimate?.notes && (
                        <p className="text-sm text-gray-500 pt-2">{estimate.notes}</p>
                    )}
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleApprove(false)}
                    disabled={submitting}
                >
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button
                    className="flex-1"
                    onClick={() => handleApprove(true)}
                    disabled={submitting}
                >
                    {submitting ? <LoadingSpinner size="sm" /> : <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>}
                </Button>
            </div>
        </div>
    );
}
