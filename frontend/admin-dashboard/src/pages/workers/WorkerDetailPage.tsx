import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, Star, Shield } from "lucide-react";
import type { WorkerProfile } from "@/types";

export default function WorkerDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [worker, setWorker] = useState<WorkerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const response = await api.get(`/admin/workers/pending-verification`);
                const workers = response.data.data.items || response.data.data || [];
                setWorker(workers.find((w: WorkerProfile) => w._id === id) || null);
            } catch (error) {
                console.error("Failed to fetch worker", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchWorker();
    }, [id]);

    const handleVerify = async (status: "VERIFIED" | "REJECTED") => {
        if (!id) return;
        setActionLoading(true);
        try {
            await api.post("/admin/verify-worker", { workerId: id, status });
            navigate("/workers");
        } catch (error) {
            console.error("Failed to verify worker", error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!worker) {
        return (
            <div className="p-4 text-center py-20">
                <p className="text-gray-500">Worker not found.</p>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Worker Details</h1>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                {worker.user?.name?.charAt(0) || "W"}
                            </div>
                            <div>
                                <p className="font-medium text-lg">{worker.user?.name}</p>
                                <p className="text-sm text-gray-500">{worker.user?.email}</p>
                                <p className="text-sm text-gray-500">{worker.user?.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {worker.avgRating?.toFixed(1) || "N/A"} rating
                            </span>
                            <span>{worker.totalJobs || 0} jobs completed</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">
                            Status: <span className="font-bold">{worker.verificationStatus}</span>
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleVerify("VERIFIED")}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleVerify("REJECTED")}
                                disabled={actionLoading}
                            >
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {worker.skills?.map((skill: string) => (
                                <span key={skill} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                    {skill}
                                </span>
                            ))}
                            {(!worker.skills || worker.skills.length === 0) && (
                                <p className="text-sm text-gray-500">No skills listed</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
