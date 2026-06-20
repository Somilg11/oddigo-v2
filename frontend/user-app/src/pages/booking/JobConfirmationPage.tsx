import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useJobStore } from "@/store/job.store";
import { useState } from "react";
import { Star, ArrowLeft, CheckCircle } from "lucide-react";

export default function JobConfirmationPage() {
    const navigate = useNavigate();
    const { selectedWorker, createdJob, subService } = useJobStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleApprove = async () => {
        if (!createdJob?._id) return;
        setLoading(true);
        setError(null);
        try {
            navigate(`/job/${createdJob._id}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to confirm job.";
            setError(message);
            setLoading(false);
        }
    };

    if (!selectedWorker) {
        return (
            <div className="p-4 text-center py-20">
                <p className="text-muted-foreground">No worker selected.</p>
                <Button className="mt-4" onClick={() => navigate("/booking/workers")}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Confirm Booking</h1>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Worker Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                {selectedWorker.user?.name?.charAt(0) || "W"}
                            </div>
                            <div>
                                <p className="font-medium text-lg">{selectedWorker.user?.name || "Worker"}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{selectedWorker.avgRating?.toFixed(1) || "N/A"}</span>
                                    <span>•</span>
                                    <span>{selectedWorker.totalJobs || 0} jobs completed</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedWorker.skills?.map((skill: string) => (
                                <span key={skill} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Service Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Service</span>
                            <span className="font-medium">{subService?.name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Estimated Cost</span>
                            <span className="font-medium">~₹{subService?.basePrice || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Estimated Time</span>
                            <span className="font-medium">{subService?.estimatedTime || 0} min</span>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate("/booking/workers")}
                    >
                        Reject
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleApprove}
                        disabled={loading}
                    >
                        {loading ? <LoadingSpinner size="sm" /> : <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
