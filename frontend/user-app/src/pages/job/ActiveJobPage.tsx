import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ArrowLeft, MapPin, Clock, CheckCircle, Circle, Loader2 } from "lucide-react";
import { useActiveJobSocket, useWorkerTracking } from "@/hooks/useSocket";
import type { Job, JobStatus } from "@/types";

const statusSteps: { status: JobStatus; label: string }[] = [
    { status: "CREATED", label: "Job Created" },
    { status: "MATCHING", label: "Finding Worker" },
    { status: "ACCEPTED", label: "Worker Assigned" },
    { status: "OTP_PENDING", label: "OTP Verification" },
    { status: "IN_PROGRESS", label: "In Progress" },
    { status: "FINAL_APPROVAL_PENDING", label: "Approval Pending" },
    { status: "COMPLETED", label: "Completed" },
];

export default function ActiveJobPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [workerLocation, setWorkerLocation] = useState<{ lat: number; long: number } | null>(null);

    const fetchJob = useCallback(async () => {
        if (!id) return;
        try {
            const response = await api.get(`/jobs/${id}`);
            setJob(extractData(response));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load data";
            setError(message);
            logger.error("Failed to fetch job", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    const handleWorkerLocation = useCallback((location: { lat: number; long: number }) => {
        setWorkerLocation(location);
    }, []);

    useActiveJobSocket(id || null);
    useWorkerTracking(id || null, handleWorkerLocation);

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
                <p className="text-gray-500">Job not found.</p>
            </div>
        );
    }

    const currentStep = getStepIndex(job.status);

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Button>

            <h1 className="text-2xl font-bold mb-2">Active Job</h1>
            <p className="text-gray-500 mb-6">{job.subServiceName || job.serviceType}</p>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base">Job Status</CardTitle>
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
                                    <span className={`text-sm ${isCurrent ? "font-medium text-primary" : isCompleted ? "text-green-600" : "text-gray-400"}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {workerLocation && (job.status === "IN_PROGRESS" || job.status === "OTP_PENDING") && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" /> Worker Live Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-100 rounded-lg p-4 text-center">
                            <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                                Lat: {workerLocation.lat.toFixed(4)}, Long: {workerLocation.long.toFixed(4)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Live tracking active</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {job.status === "OTP_PENDING" && (
                    <Button className="w-full" onClick={() => navigate(`/job/${id}/otp`)}>
                        View OTP
                    </Button>
                )}
                {job.status === "FINAL_APPROVAL_PENDING" && (
                    <Button className="w-full" onClick={() => navigate(`/job/${id}/approve-estimate`)}>
                        Review Estimate
                    </Button>
                )}
                {job.status === "COMPLETED" && (
                    <div className="space-y-3">
                        <Button className="w-full" onClick={() => navigate(`/job/${id}/signature`)}>
                            Sign & Complete
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => navigate(`/job/${id}/rate`)}>
                            Rate Worker
                        </Button>
                    </div>
                )}
            </div>

            <Card className="mt-6">
                <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Job ID</span>
                        <span className="font-mono text-xs">{job._id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium">{job.status.replace(/_/g, " ")}</span>
                    </div>
                    {job.location?.address && (
                        <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                            <span>{job.location.address}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Created {new Date(job.createdAt).toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
