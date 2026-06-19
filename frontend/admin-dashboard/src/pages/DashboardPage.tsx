import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Users, Briefcase, DollarSign, AlertTriangle, Activity } from "lucide-react";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setError(null);
            const response = await api.get("/admin/analytics");
            setStats(extractData(response));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch dashboard stats";
            setError(message);
            logger.error("Failed to fetch dashboard stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={fetchStats} />;
    }

    const cards = [
        { title: "Total Jobs", value: stats?.totalJobs || 0, sub: `${stats?.activeJobs || 0} active`, icon: Briefcase },
        { title: "Revenue", value: `₹${stats?.totalRevenue || 0}`, sub: `${stats?.completedJobs || 0} completed`, icon: DollarSign },
        { title: "Workers", value: stats?.totalWorkers || 0, sub: `${stats?.activeWorkers || 0} online`, icon: Users },
        { title: "Customers", value: stats?.totalCustomers || 0, sub: "", icon: Users },
        { title: "Pending Approvals", value: stats?.pendingApprovals || 0, sub: "", icon: AlertTriangle },
        { title: "Open Complaints", value: stats?.openComplaints || 0, sub: "", icon: Activity },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">{card.title}</CardTitle>
                                <Icon className="h-4 w-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
