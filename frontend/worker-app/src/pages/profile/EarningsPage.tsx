import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DollarSign, CheckCircle, Clock } from "lucide-react";

interface EarningsData {
    totalEarnings: number;
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    completedJobs: number;
}

export default function EarningsPage() {
    const [earnings, setEarnings] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const response = await api.get("/workers/stats");
                setEarnings(response.data.data);
            } catch (error) {
                console.error("Failed to fetch earnings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
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
            <h1 className="text-2xl font-bold">Earnings</h1>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" /> Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{earnings?.todayEarnings || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-4 w-4" /> This Week
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{earnings?.weekEarnings || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" /> This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{earnings?.monthEarnings || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> Total Earned
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{earnings?.totalEarnings || 0}</div>
                        <p className="text-xs text-gray-400">{earnings?.completedJobs || 0} jobs</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
