import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { CheckCircle, XCircle } from "lucide-react";
import type { QualityAudit } from "@/types";

export default function QualityAuditsPage() {
    const [audits, setAudits] = useState<QualityAudit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setError(null);
                const res = await api.get("/field-executive/quality-audit");
                const data = extractData(res) as { audits: QualityAudit[] };
                setAudits(data.audits || []);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load audits");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} />;

    return (
        <div className="p-4 space-y-3">
            <h1 className="text-lg font-bold">Quality Audits</h1>
            {audits.length === 0 ? (
                <EmptyState title="No audits yet" />
            ) : (
                audits.map((audit) => (
                    <Card key={audit._id}>
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    {audit.status === "PASSED" ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className={`font-medium text-sm ${audit.status === "PASSED" ? "text-green-600" : "text-red-600"}`}>
                                        {audit.status}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">{new Date(audit.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {typeof audit.job === "object" ? audit.job.serviceType : "Job"} &middot;{" "}
                                {typeof audit.worker === "object" ? audit.worker.name : "Worker"}
                            </p>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
