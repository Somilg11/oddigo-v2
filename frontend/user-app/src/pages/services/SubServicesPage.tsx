import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { useJobStore } from "@/store/job.store";
import { ArrowLeft, Clock, IndianRupee } from "lucide-react";
import type { SubService } from "@/types";

export default function SubServicesPage() {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const setSubService = useJobStore((s) => s.setSubService);
    const [subServices, setSubServices] = useState<SubService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubServices = async () => {
            try {
                const response = await api.get(`/services/sub-services?categoryId=${categoryId}`);
                setSubServices(extractData(response));
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load data";
                setError(message);
                logger.error("Failed to fetch sub-services", err);
            } finally {
                setLoading(false);
            }
        };
        if (categoryId) fetchSubServices();
    }, [categoryId]);

    const handleSelect = (sub: SubService) => {
        setSubService(sub);
        navigate(`/services/sub/${sub._id}`);
    };

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

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate("/services")} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold mb-6">Select a Service</h1>
            {subServices.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No sub-services available.</p>
            ) : (
                <div className="space-y-3">
                    {subServices.map((sub) => (
                        <Card
                            key={sub._id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleSelect(sub)}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{sub.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-2">{sub.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <IndianRupee className="h-3 w-3" />
                                        {sub.pricingType === "FIXED" ? `₹${sub.basePrice}` : `~₹${sub.basePrice}`}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {sub.estimatedTime} min
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
