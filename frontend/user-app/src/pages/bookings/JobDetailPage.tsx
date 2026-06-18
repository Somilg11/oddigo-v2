import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, Clock, MapPin, Shield } from "lucide-react";
import type { Job } from "@/types";

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await api.get(`/jobs/${id}`);
                setJob(response.data.data);
            } catch (error) {
                console.error("Failed to fetch job", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchJob();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
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
                            <Clock className="h-4 w-4" />
                            <span>{new Date(job.createdAt).toLocaleString()}</span>
                        </div>
                        {job.location?.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location.address}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

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

                {job.estimate && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Cost Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Visit Charge</span>
                                <span>₹{job.estimate.visitCharge}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Labour Cost</span>
                                <span>₹{job.estimate.labourCost}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Parts Cost</span>
                                <span>₹{job.estimate.partsCost}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total</span>
                                <span>₹{job.estimate.totalEstimate}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {job.warrantyId && (
                    <Card>
                        <CardContent className="p-4">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate(`/warranty/${job._id}`)}
                            >
                                <Shield className="h-4 w-4 mr-2" /> View Warranty
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
