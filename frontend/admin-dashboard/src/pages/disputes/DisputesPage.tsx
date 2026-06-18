import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { AlertTriangle } from "lucide-react";
import type { Job } from "@/types";

export default function DisputesPage() {
    const [disputes, setDisputes] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDisputes = async () => {
            try {
                const response = await api.get("/admin/disputes");
                setDisputes(response.data.data.items || response.data.data || []);
            } catch (error) {
                console.error("Failed to fetch disputes", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDisputes();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Disputes</h1>

            {disputes.length === 0 ? (
                <EmptyState title="No disputes" description="Cancelled or charged jobs will appear here." />
            ) : (
                <div className="space-y-3">
                    {disputes.map((job) => (
                        <Card key={job._id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">{job.subServiceName || job.serviceType}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {job.location?.address || "No address"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-orange-600 bg-orange-50">
                                        <AlertTriangle className="h-3 w-3" />
                                        {job.status.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
