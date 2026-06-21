import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ClipboardList, MapPin } from "lucide-react";

interface FieldVisit {
    _id: string;
    worker: { name: string; phone: string } | string;
    type: "CHECK_IN" | "FOLLOW_UP" | "QUALITY_AUDIT" | "COMPLAINT_HANDLE";
    notes: string;
    photos: string[];
    createdAt: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
    CHECK_IN: { label: "Check-in", color: "bg-green-100 text-green-700" },
    FOLLOW_UP: { label: "Follow-up", color: "bg-blue-100 text-blue-700" },
    QUALITY_AUDIT: { label: "Quality Audit", color: "bg-purple-100 text-purple-700" },
    COMPLAINT_HANDLE: { label: "Complaint", color: "bg-red-100 text-red-700" },
};

export default function FieldVisitsPage() {
    const [visits, setVisits] = useState<FieldVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setError(null);
                const res = await api.get("/field-executive/visits");
                const data = extractData(res) as { visits: FieldVisit[] };
                setVisits(data.visits || []);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load visits");
                logger.error("Failed to fetch visits:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} />;

    return (
        <div className="p-4 space-y-3">
            <h1 className="text-lg font-bold">Field Visits</h1>
            {visits.length === 0 ? (
                <EmptyState title="No visits yet" description="Visit history will appear here." />
            ) : (
                visits.map((visit) => {
                    const meta = typeLabels[visit.type] || { label: visit.type, color: "bg-gray-100 text-gray-700" };
                    return (
                        <Card key={visit._id}>
                            <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(visit.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm font-medium mt-1">
                                    {typeof visit.worker === "object" ? visit.worker.name : "Worker"}
                                </p>
                                {visit.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">{visit.notes}</p>
                                )}
                                {visit.photos.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {visit.photos.length} photo{visit.photos.length > 1 ? "s" : ""}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
    );
}
