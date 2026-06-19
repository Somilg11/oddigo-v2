import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractList } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ArrowUpRight } from "lucide-react";
import type { Complaint } from "@/types";

const statusColors: Record<string, string> = {
    OPEN: "text-red-600 bg-red-50",
    IN_REVIEW: "text-blue-600 bg-blue-50",
    ESCALATED: "text-orange-600 bg-orange-50",
    RESOLVED: "text-green-600 bg-green-50",
    CLOSED: "text-gray-600 bg-gray-50",
};

export default function ComplaintsListPage() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("");

    const fetchComplaints = async () => {
        try {
            setError(null);
            const params = new URLSearchParams();
            if (filter) params.set("status", filter);
            const response = await api.get(`/admin/complaints?${params.toString()}`);
            setComplaints(extractList(response));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch complaints";
            setError(message);
            logger.error("Failed to fetch complaints:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [filter]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={fetchComplaints} />;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Complaints</h1>

            <div className="flex flex-wrap gap-2">
                {["", "OPEN", "IN_REVIEW", "ESCALATED", "RESOLVED", "CLOSED"].map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(status)}
                    >
                        {status || "All"}
                    </Button>
                ))}
            </div>

            {complaints.length === 0 ? (
                <EmptyState title="No complaints" description="No complaints match the selected filter." />
            ) : (
                <div className="space-y-3">
                    {complaints.map((complaint) => (
                        <Card
                            key={complaint._id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/complaints/${complaint._id}`)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium">{complaint.description?.slice(0, 80) || "Complaint"}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[complaint.status] || ""}`}>
                                            {complaint.status}
                                        </span>
                                        <ArrowUpRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
