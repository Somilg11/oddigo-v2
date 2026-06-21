import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { CheckCircle, Clock, AlertTriangle, MapPin, ArrowUpRight, Play } from "lucide-react";
import type { Task } from "@/types";

const statusColor: Record<string, string> = {
    ASSIGNED: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    IN_PROGRESS: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
    RESOLVED: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
    ESCALATED: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
};

const priorityColor: Record<string, string> = {
    URGENT: "text-red-600",
    HIGH: "text-orange-600",
    MEDIUM: "text-yellow-600",
    LOW: "text-gray-600",
};

const typeLabel: Record<string, string> = {
    COMPLAINT_HANDLE: "Complaint",
    DISPUTE_RESOLVE: "Dispute",
    QUALITY_CHECK: "Quality Check",
    EMERGENCY: "Emergency",
    GENERAL: "General",
};

export default function FieldExecDashboardPage() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            setError(null);
            const res = await api.get("/field-executive/tasks");
            setTasks(extractData(res));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load tasks");
            logger.error("Failed to fetch tasks:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} onRetry={fetchTasks} />;

    const assignedTasks = tasks.filter(t => t.status === "ASSIGNED");
    const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS");
    const resolvedTasks = tasks.filter(t => t.status === "RESOLVED");
    const escalatedTasks = tasks.filter(t => t.status === "ESCALATED");

    const getName = (obj: unknown) => {
        if (typeof obj === "object" && obj !== null && "name" in obj) return (obj as { name: string }).name;
        return "Unknown";
    };

    const getAddress = (task: Task) => {
        if (task.location) return task.location;
        if (typeof task.job === "object" && task.job?.location?.address) return task.job.location.address;
        return null;
    };

    return (
        <div className="p-4 space-y-5">
            <div>
                <h1 className="text-lg font-bold">My Tasks</h1>
                <p className="text-sm text-muted-foreground">{assignedTasks.length + inProgressTasks.length} active &middot; {resolvedTasks.length} resolved</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-muted-foreground">Assigned</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">{assignedTasks.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Play className="h-4 w-4 text-orange-600" />
                            <span className="text-xs text-muted-foreground">In Progress</span>
                        </div>
                        <p className="text-xl font-bold text-orange-600">{inProgressTasks.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-muted-foreground">Resolved</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">{resolvedTasks.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-muted-foreground">Escalated</span>
                        </div>
                        <p className="text-xl font-bold text-red-600">{escalatedTasks.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Assigned Tasks */}
            {assignedTasks.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold mb-3">New Assignments ({assignedTasks.length})</h2>
                    <div className="space-y-2">
                        {assignedTasks.map(task => (
                            <Card key={task._id} className="cursor-pointer" onClick={() => navigate(`/field/tasks/${task._id}`)}>
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm">{task.title}</p>
                                                <span className={`text-xs font-medium ${priorityColor[task.priority]}`}>{task.priority}</span>
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                <span>{typeLabel[task.type] || task.type}</span>
                                                {getName(task.zone) !== "Unknown" && <span>{getName(task.zone)}</span>}
                                            </div>
                                            {getAddress(task) && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3 shrink-0" /> {getAddress(task)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <Badge className={statusColor[task.status] || ""}>New</Badge>
                                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* In Progress Tasks */}
            {inProgressTasks.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold mb-3">In Progress ({inProgressTasks.length})</h2>
                    <div className="space-y-2">
                        {inProgressTasks.map(task => (
                            <Card key={task._id} className="cursor-pointer" onClick={() => navigate(`/field/tasks/${task._id}`)}>
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm">{task.title}</p>
                                                <span className={`text-xs font-medium ${priorityColor[task.priority]}`}>{task.priority}</span>
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                <span>{typeLabel[task.type] || task.type}</span>
                                                {getName(task.zone) !== "Unknown" && <span>{getName(task.zone)}</span>}
                                            </div>
                                            {getAddress(task) && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3 shrink-0" /> {getAddress(task)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <Badge className={statusColor[task.status] || ""}>Active</Badge>
                                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* No active tasks */}
            {assignedTasks.length === 0 && inProgressTasks.length === 0 && (
                <EmptyState title="No active tasks" description="You're all caught up! New tasks assigned by your zone manager will appear here." />
            )}

            {/* Resolved Tasks */}
            {resolvedTasks.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold mb-3">Resolved ({resolvedTasks.length})</h2>
                    <div className="space-y-2">
                        {resolvedTasks.slice(0, 10).map(task => (
                            <Card key={task._id} className="opacity-70">
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{task.title}</p>
                                            {task.resolutionNotes && (
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.resolutionNotes}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>{typeLabel[task.type] || task.type}</span>
                                                {task.resolvedAt && <span>&middot; {new Date(task.resolvedAt).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                        <Badge className={statusColor[task.status] || ""}>Done</Badge>
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
