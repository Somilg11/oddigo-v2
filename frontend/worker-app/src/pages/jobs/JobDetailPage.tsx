import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ArrowLeft, MapPin, Clock, User, AlertTriangle } from "lucide-react";
import type { Job } from "@/types";

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchJob();
    }, [id]);

    const fetchJob = async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/jobs/${id}`);
            setJob(extractData(response));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setError(message);
            logger.error("Failed to fetch job:", err);
        } finally {
            setLoading(false);
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
        return <PageError message={error} onRetry={fetchJob} />;
    }

    if (!job) {
        return (
            <div className="p-4 text-center py-20">
                <p className="text-gray-500">Job not found.</p>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Job Details</h1>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Service</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="font-medium">{job.subServiceName || job.serviceType}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location?.address || "No address provided"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(job.createdAt).toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {job.customer && typeof job.customer === "object" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" /> Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">{job.customer.name}</p>
                            <p className="text-sm text-gray-500">{job.customer.phone}</p>
                        </CardContent>
                    </Card>
                )}

                {job.aiAnalysis && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> AI Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="font-medium">{job.aiAnalysis.problemType}</p>
                            {job.aiAnalysis.possibleCauses?.length > 0 && (
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {job.aiAnalysis.possibleCauses.map((cause: string, i: number) => (
                                        <li key={i}>• {cause}</li>
                                    ))}
                                </ul>
                            )}
                            {job.aiAnalysis.estimatedCostRange && (
                                <p className="text-sm font-medium">
                                    Est: ₹{job.aiAnalysis.estimatedCostRange.low} - ₹{job.aiAnalysis.estimatedCostRange.high}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {job.photos.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Photos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {job.photos.map((url, i) => (
                                    <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                            {job.status.replace(/_/g, " ")}
                        </span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
