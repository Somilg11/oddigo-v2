import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { MapPin, Clock, IndianRupee } from "lucide-react";
import type { Job } from "@/types";

export default function JobRequestsPage() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await api.get("/jobs/history");
                const allJobs = response.data.data.items || response.data.data || [];
                setJobs(allJobs.filter((j: Job) => j.status === "MATCHING" || j.status === "CREATED"));
            } catch (error) {
                console.error("Failed to fetch job requests", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const handleAccept = async (jobId: string) => {
        try {
            await api.post(`/jobs/${jobId}/accept`);
            setJobs((prev) => prev.filter((j) => j._id !== jobId));
            navigate(`/jobs/${jobId}/active`);
        } catch (error) {
            console.error("Failed to accept job", error);
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
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Job Requests</h1>

            {jobs.length === 0 ? (
                <EmptyState
                    title="No pending requests"
                    description="New job requests will appear here when customers book services in your area."
                />
            ) : (
                <div className="space-y-3">
                    {jobs.map((job) => (
                        <Card key={job._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-medium">{job.subServiceName || job.serviceType}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {job.location?.address || "Location TBD"}
                                        </p>
                                    </div>
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                        {job.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                    <span className="flex items-center gap-1">
                                        <IndianRupee className="h-3 w-3" />
                                        ~₹{job.initialQuote || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(job.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleAccept(job._id)}>
                                        Accept
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/jobs/${job._id}`)}>
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
