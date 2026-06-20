import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ArrowLeft, Shield } from "lucide-react";
import type { Warranty } from "@/types";

export default function WarrantyStatusPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [warranty, setWarranty] = useState<Warranty | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWarranty = async () => {
            try {
                const response = await api.get(`/warranty/${jobId}/status`);
                setWarranty(extractData(response));
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load data";
                setError(message);
                logger.error("Failed to fetch warranty", err);
            } finally {
                setLoading(false);
            }
        };
        if (jobId) fetchWarranty();
    }, [jobId]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={() => { setError(null); setLoading(true); window.location.reload(); }} />;
    }

    if (!warranty) {
        return (
            <div className="p-4 text-center py-20">
                <p className="text-muted-foreground">No warranty found for this job.</p>
                <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    const daysRemaining = Math.max(0, Math.ceil((new Date(warranty.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Warranty Status</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Warranty Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center py-4">
                        <div className={`text-4xl font-bold mb-2 ${warranty.isActive ? "text-green-600" : "text-red-500"}`}>
                            {warranty.isActive ? `${daysRemaining} days` : "Expired"}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {warranty.isActive ? "remaining" : "This warranty has expired"}
                        </p>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Coverage</span>
                            <span>{warranty.coverageDetails || "Standard warranty"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Expires</span>
                            <span>{new Date(warranty.expiresAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {warranty.isActive && (
                <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => navigate(`/warranty/${jobId}/claim`)}
                >
                    File a Claim
                </Button>
            )}
        </div>
    );
}
