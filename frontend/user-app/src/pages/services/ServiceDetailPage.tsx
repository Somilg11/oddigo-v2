import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useJobStore } from "@/store/job.store";
import { ArrowLeft, Clock, IndianRupee, Wrench } from "lucide-react";
import type { SubService } from "@/types";

export default function ServiceDetailPage() {
    const { subServiceId } = useParams<{ subServiceId: string }>();
    const navigate = useNavigate();
    const { setSubService } = useJobStore();
    const [service, setService] = useState<SubService | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const response = await api.get(`/services/sub-services/${subServiceId}`);
                setService(response.data.data);
                setSubService(response.data.data);
            } catch (error) {
                console.error("Failed to fetch service detail", error);
            } finally {
                setLoading(false);
            }
        };
        if (subServiceId) fetchService();
    }, [subServiceId, setSubService]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="p-4 text-center text-gray-500 py-20">
                Service not found.
            </div>
        );
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wrench className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{service.name}</CardTitle>
                            <p className="text-sm text-gray-500">{service.category && typeof service.category === 'object' ? service.category.name : ''}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-gray-700">{service.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <IndianRupee className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                            <p className="text-lg font-bold">
                                {service.pricingType === "FIXED" ? `₹${service.basePrice}` : `~₹${service.basePrice}`}
                            </p>
                            <p className="text-xs text-gray-500">
                                {service.pricingType === "FIXED" ? "Fixed Price" : "Estimated Price"}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <Clock className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                            <p className="text-lg font-bold">{service.estimatedTime} min</p>
                            <p className="text-xs text-gray-500">Estimated Time</p>
                        </div>
                    </div>

                    <Button className="w-full" size="lg" onClick={() => navigate("/booking/issue")}>
                        Book Now
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
