import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { BarChart3, TrendingUp, DollarSign, Star } from "lucide-react";

interface AnalyticsData {
    totalRevenue: number;
    revenueGrowth: number;
    totalJobs: number;
    jobsGrowth: number;
    avgRating: number;
    cancellationRate: number;
    topServices: { name: string; count: number }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get("/admin/analytics");
                setData(response.data.data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Analytics</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" /> Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data?.totalRevenue || 0}</div>
                        {data?.revenueGrowth !== undefined && (
                            <p className={`text-xs mt-1 ${data.revenueGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {data.revenueGrowth >= 0 ? "+" : ""}{data.revenueGrowth}% from last period
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" /> Total Jobs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.totalJobs || 0}</div>
                        {data?.jobsGrowth !== undefined && (
                            <p className={`text-xs mt-1 ${data.jobsGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {data.jobsGrowth >= 0 ? "+" : ""}{data.jobsGrowth}% from last period
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <Star className="h-4 w-4" /> Avg Rating
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.avgRating?.toFixed(1) || "N/A"}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" /> Cancellation %
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.cancellationRate?.toFixed(1) || 0}%</div>
                    </CardContent>
                </Card>
            </div>

            {data?.topServices && data.topServices.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Top Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.topServices.map((service, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm">{service.name}</span>
                                    <span className="text-sm font-medium">{service.count} jobs</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
