import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
    MapPin, Users, Briefcase, DollarSign, Clock, TrendingUp,
    AlertTriangle, CheckCircle, XCircle, Phone, Star, Activity, Siren
} from "lucide-react";
import type { CityOverview } from "@/types";

const complaintStatusColor: Record<string, string> = {
    OPEN: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
    IN_REVIEW: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    ESCALATED: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
    RESOLVED: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
    CLOSED: "text-gray-600 bg-muted",
};

const priorityColor: Record<string, string> = {
    URGENT: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
    HIGH: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
    MEDIUM: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400",
    LOW: "text-gray-600 bg-muted",
};

const emergencyStatusColor: Record<string, string> = {
    PAUSED_APPROVAL_PENDING: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
    ON_SITE_DIAGNOSIS: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
};

export default function CityDashboardPage() {
    const [data, setData] = useState<CityOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setError(null);
                const res = await api.get("/city-manager/overview");
                setData(extractData(res));
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load overview");
                logger.error("Failed to fetch city overview:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} />;
    if (!data) return null;

    const { zones, cityStats, complaints, disputes, emergencies, complaintSummary } = data;
    const totalComplaints = complaints.length;
    const openComplaints = (complaintSummary["OPEN"] || 0) + (complaintSummary["ESCALATED"] || 0);

    return (
        <div className="p-4 space-y-5">
            <div>
                <h1 className="text-lg font-bold">City Overview</h1>
                <p className="text-sm text-muted-foreground">{zones.length} zones &middot; {cityStats.totalJobs} total jobs</p>
            </div>

            {/* City-level stats */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Total Jobs</span>
                        </div>
                        <p className="text-xl font-bold">{cityStats.totalJobs}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Revenue</span>
                        </div>
                        <p className="text-xl font-bold">₹{cityStats.revenue.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">{cityStats.activeJobs}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-muted-foreground">Done Today</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">{cityStats.todayCompleted}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts row */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="border-orange-200 dark:border-orange-800">
                    <CardContent className="p-3 text-center">
                        <Siren className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-orange-600">{emergencies.length}</p>
                        <p className="text-xs text-muted-foreground">Emergencies</p>
                    </CardContent>
                </Card>
                <Card className={openComplaints > 0 ? "border-red-200 dark:border-red-800" : ""}>
                    <CardContent className="p-3 text-center">
                        <AlertTriangle className={`h-5 w-5 mx-auto mb-1 ${openComplaints > 0 ? "text-red-600" : "text-muted-foreground"}`} />
                        <p className={`text-lg font-bold ${openComplaints > 0 ? "text-red-600" : ""}`}>{openComplaints}</p>
                        <p className="text-xs text-muted-foreground">Open Complaints</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 text-center">
                        <XCircle className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-orange-600">{disputes.length}</p>
                        <p className="text-xs text-muted-foreground">Disputes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Zones */}
            <div>
                <h2 className="text-base font-semibold mb-3">Zones</h2>
                {zones.length === 0 ? (
                    <EmptyState title="No zones" description="No zones found in your assigned cities." />
                ) : (
                    <div className="space-y-3">
                        {zones.map((zone) => {
                            const stats = zone.stats;
                            const completionRate = stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0;
                            return (
                                <Card key={zone._id}>
                                    <CardContent className="p-4">
                                        {/* Zone header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <MapPin className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{zone.name}</p>
                                                    <p className="text-xs text-muted-foreground">{zone.city} &middot; {zone.radiusKm} km radius</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground">{completionRate}% done</span>
                                        </div>

                                        {/* Zone manager */}
                                        {zone.manager && typeof zone.manager === "object" && (
                                            <div className="flex items-center gap-3 mb-2 p-2 bg-muted/50 rounded-lg">
                                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-medium text-primary">{zone.manager.name?.charAt(0) || "M"}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium">{zone.manager.name}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">{zone.manager.email}</p>
                                                </div>
                                                {zone.manager.phone && (
                                                    <a href={`tel:${zone.manager.phone}`} className="text-muted-foreground hover:text-foreground">
                                                        <Phone className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Field executives */}
                                        {zone.fieldExecutives && zone.fieldExecutives.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-[11px] text-muted-foreground mb-1.5">Field Executives ({zone.fieldExecutives.length})</p>
                                                <div className="space-y-1.5">
                                                    {zone.fieldExecutives.map((fe) => {
                                                        if (typeof fe !== "object") return null;
                                                        return (
                                                            <div key={fe._id} className="flex items-center gap-2 text-xs">
                                                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                                    <span className="text-[10px] font-medium">{fe.name?.charAt(0) || "E"}</span>
                                                                </div>
                                                                <span className="truncate">{fe.name}</span>
                                                                {fe.phone && (
                                                                    <a href={`tel:${fe.phone}`} className="ml-auto text-muted-foreground hover:text-foreground shrink-0">
                                                                        <Phone className="h-3 w-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Zone stats */}
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="text-center p-1.5 bg-muted/50 rounded-lg">
                                                <p className="text-sm font-bold">{stats.totalJobs}</p>
                                                <p className="text-[10px] text-muted-foreground">Jobs</p>
                                            </div>
                                            <div className="text-center p-1.5 bg-muted/50 rounded-lg">
                                                <p className="text-sm font-bold text-green-600">{stats.completedJobs}</p>
                                                <p className="text-[10px] text-muted-foreground">Done</p>
                                            </div>
                                            <div className="text-center p-1.5 bg-muted/50 rounded-lg">
                                                <p className="text-sm font-bold text-blue-600">{stats.activeJobs}</p>
                                                <p className="text-[10px] text-muted-foreground">Active</p>
                                            </div>
                                            <div className="text-center p-1.5 bg-muted/50 rounded-lg">
                                                <p className="text-sm font-bold">₹{stats.revenue.toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground">Revenue</p>
                                            </div>
                                        </div>

                                        {/* Additional stats row */}
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <div className="text-center p-1.5 bg-muted/30 rounded-lg">
                                                <p className="text-xs font-bold text-red-600">{stats.cancelledJobs}</p>
                                                <p className="text-[10px] text-muted-foreground">Cancelled</p>
                                            </div>
                                            <div className="text-center p-1.5 bg-muted/30 rounded-lg">
                                                <p className="text-xs font-bold">{stats.todayJobs}</p>
                                                <p className="text-[10px] text-muted-foreground">Today</p>
                                            </div>
                                            <div className="text-center p-1.5 bg-muted/30 rounded-lg">
                                                <p className="text-xs font-bold">{zone.fieldExecutives?.length || 0}</p>
                                                <p className="text-[10px] text-muted-foreground">Team</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Emergencies */}
            {emergencies.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                        <Siren className="h-4 w-4 text-orange-600" /> Emergencies
                    </h2>
                    <div className="space-y-2">
                        {emergencies.map((job) => (
                            <Card key={job._id} className="border-orange-200 dark:border-orange-800">
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{job.subServiceName || job.serviceType}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {typeof job.customer === "object" ? job.customer.name : "Customer"}
                                                {job.worker && typeof job.worker === "object" && ` → ${job.worker.name}`}
                                            </p>
                                            {job.location?.address && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3" /> {job.location.address}
                                                </p>
                                            )}
                                        </div>
                                        <Badge className={emergencyStatusColor[job.status] || "text-muted-foreground bg-muted"}>
                                            {job.status.replace(/_/g, " ")}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Complaints */}
            {complaints.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold mb-3">Recent Complaints</h2>
                    <div className="space-y-2">
                        {complaints.slice(0, 10).map((c) => (
                            <Card key={c._id}>
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm line-clamp-1">{c.description}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                {typeof c.customer === "object" && <span>{c.customer.name}</span>}
                                                {typeof c.worker === "object" && <span>• {c.worker.name}</span>}
                                                <span>• {new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <Badge className={priorityColor[c.priority] || ""}>{c.priority}</Badge>
                                            <Badge className={complaintStatusColor[c.status] || ""}>{c.status}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Disputes */}
            {disputes.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold mb-3">Disputes</h2>
                    <div className="space-y-2">
                        {disputes.slice(0, 10).map((d) => (
                            <Card key={d._id}>
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{d.subServiceName || d.serviceType}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {typeof d.customer === "object" ? d.customer.name : "Customer"}
                                            </p>
                                            {d.location?.address && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3" /> {d.location.address}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <Badge className="text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                {d.status.replace(/_/g, " ")}
                                            </Badge>
                                            {d.finalQuote && (
                                                <p className="text-xs font-medium mt-1">₹{d.finalQuote}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
