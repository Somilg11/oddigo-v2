import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { openInGoogleMaps } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ArrowLeft, MapPin, Clock, CheckCircle, Circle, Loader2, Navigation, ExternalLink } from "lucide-react";
import { useWorkerSocket, useLocationUpdates } from "@/hooks/useSocket";
import type { Job, JobStatus } from "@/types";

const statusSteps: { status: JobStatus; label: string }[] = [
    { status: "ACCEPTED", label: "Job Accepted" },
    { status: "OTP_PENDING", label: "OTP Verification" },
    { status: "IN_PROGRESS", label: "Diagnosis" },
    { status: "FINAL_APPROVAL_PENDING", label: "Estimate Approval" },
    { status: "REPAIR_IN_PROGRESS", label: "Repair" },
    { status: "COMPLETED", label: "Completed" },
];

export default function ActiveJobPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchJob = useCallback(async () => {
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
    }, [id]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    useWorkerSocket();
    useLocationUpdates(id || null);

    const getStepIndex = (status: JobStatus) => statusSteps.findIndex((s) => s.status === status);

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
                <p className="text-muted-foreground">Job not found.</p>
            </div>
        );
    }

    const currentStep = getStepIndex(job.status);
    const hasJobLocation = job.location?.coordinates;

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>

            <h1 className="text-2xl font-bold mb-2">Active Job</h1>
            <p className="text-muted-foreground mb-6">{job.subServiceName || job.serviceType}</p>

            {job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
                <Card className="mb-4 border-green-200 bg-green-50">
                    <CardContent className="p-3 flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-green-600 animate-pulse" />
                        <p className="text-sm text-green-700">Location is being shared with the customer</p>
                    </CardContent>
                </Card>
            )}

            {hasJobLocation && (
                <Card className="mb-4">
                    <CardContent className="p-3">
                        <Button
                            variant="outline"
                            className="w-full flex items-center gap-2"
                            onClick={() => {
                                const coords = job.location.coordinates;
                                openInGoogleMaps(coords[1], coords[0]);
                            }}
                        >
                            <ExternalLink className="h-4 w-4" />
                            Navigate to Customer
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base">Job Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {statusSteps.map((step, index) => {
                            const isCompleted = index < currentStep;
                            const isCurrent = index === currentStep;
                            return (
                                <div key={step.status} className="flex items-center gap-3">
                                    {isCompleted ? (
                                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                                    ) : isCurrent ? (
                                        <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                                    )}
                                    <span className={`text-sm ${isCurrent ? "font-medium text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {job.status === "ACCEPTED" && (
                    <Button className="w-full" onClick={() => navigate(`/jobs/${id}/otp-request`)}>
                        Request OTP from Customer
                    </Button>
                )}
                {job.status === "OTP_PENDING" && (
                    <Button className="w-full" onClick={() => navigate(`/jobs/${id}/otp-verify`)}>
                        Enter Customer OTP
                    </Button>
                )}
                {job.status === "IN_PROGRESS" && (
                    <Button className="w-full" onClick={() => navigate(`/jobs/${id}/estimate`)}>
                        Submit Estimate
                    </Button>
                )}
                {job.status === "REPAIR_IN_PROGRESS" && (
                    <div className="space-y-3">
                        <Button className="w-full" onClick={() => navigate(`/jobs/${id}/before-photo`)}>
                            Upload Before Photo
                        </Button>
                        <Button className="w-full" onClick={() => navigate(`/jobs/${id}/after-photo`)}>
                            Upload After Photo
                        </Button>
                        <Button className="w-full" onClick={() => navigate(`/jobs/${id}/complete`)}>
                            Complete Job
                        </Button>
                    </div>
                )}
            </div>

            <Card className="mt-6">
                <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Job ID</span>
                        <span className="font-mono text-xs">{job._id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">{job.status.replace(/_/g, " ")}</span>
                    </div>
                    {job.location?.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location.address}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Started {new Date(job.createdAt).toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
