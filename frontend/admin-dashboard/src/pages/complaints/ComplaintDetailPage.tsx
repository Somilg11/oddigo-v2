import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import type { Complaint } from "@/types";

export default function ComplaintDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolution, setResolution] = useState("");
    const [refundAmount, setRefundAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchComplaint = async () => {
        try {
            setError(null);
            const response = await api.get(`/admin/complaints/${id}`);
            setComplaint(extractData(response));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch complaint";
            setError(message);
            logger.error("Failed to fetch complaint:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchComplaint();
    }, [id]);

    const handleResolve = async () => {
        if (!id) return;
        setSubmitting(true);
        try {
            await api.post(`/admin/complaints/${id}/resolve`, {
                resolution,
                refundAmount: refundAmount ? Number(refundAmount) : undefined,
            });
            navigate("/complaints");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to resolve complaint";
            setError(message);
            logger.error("Failed to resolve complaint:", err);
        } finally {
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

    if (error) {
        return <PageError message={error} onRetry={fetchComplaint} />;
    }

    if (!complaint) {
        return (
            <div className="p-4 text-center py-20">
                <p className="text-muted-foreground">Complaint not found.</p>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Complaint Details</h1>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{complaint.description}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Status: <span className="font-medium">{complaint.status}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Filed: {new Date(complaint.createdAt).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                {complaint.status !== "RESOLVED" && complaint.status !== "CLOSED" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Resolve Complaint</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Resolution Notes</label>
                                <Textarea
                                    placeholder="Describe how this complaint was resolved..."
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Refund Amount (₹) - Optional</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleResolve} disabled={!resolution || submitting}>
                                {submitting ? <LoadingSpinner size="sm" /> : <><CheckCircle className="h-4 w-4 mr-1" /> Mark as Resolved</>}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
