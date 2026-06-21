import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/common/Badge";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, MapPin, Clock, User, CheckCircle, Play } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "@/types";

const statusColor: Record<string, string> = {
    ASSIGNED: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    IN_PROGRESS: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
    RESOLVED: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
    ESCALATED: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
};

const typeLabel: Record<string, string> = {
    COMPLAINT_HANDLE: "Complaint Handling",
    DISPUTE_RESOLVE: "Dispute Resolution",
    QUALITY_CHECK: "Quality Check",
    EMERGENCY: "Emergency",
    GENERAL: "General Task",
};

export default function TaskDetailPage() {
    const { taskId } = useParams<{ taskId: string }>();
    const navigate = useNavigate();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchTask = async () => {
        try {
            setError(null);
            const res = await api.get(`/field-executive/tasks/${taskId}`);
            setTask(extractData(res));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load task");
            logger.error("Failed to fetch task:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (taskId) fetchTask(); }, [taskId]);

    const handleStart = async () => {
        if (!taskId) return;
        setActionLoading(true);
        try {
            await api.patch(`/field-executive/tasks/${taskId}/progress`);
            setTask(prev => prev ? { ...prev, status: "IN_PROGRESS" } : prev);
            toast.success("Task started");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!taskId || !resolutionNotes.trim()) {
            toast.error("Please add resolution notes");
            return;
        }
        setActionLoading(true);
        try {
            await api.patch(`/field-executive/tasks/${taskId}/resolve`, { resolutionNotes: resolutionNotes.trim() });
            setTask(prev => prev ? { ...prev, status: "RESOLVED", resolutionNotes: resolutionNotes.trim(), resolvedAt: new Date().toISOString() } : prev);
            toast.success("Task resolved!");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} onRetry={fetchTask} />;
    if (!task) return <div className="p-4 text-center py-20"><p className="text-muted-foreground">Task not found.</p></div>;

    const getName = (obj: unknown) => {
        if (typeof obj === "object" && obj !== null && "name" in obj) return (obj as { name: string }).name;
        return "Unknown";
    };

    const getAddress = () => {
        if (task.location) return task.location;
        if (typeof task.job === "object" && task.job?.location?.address) return task.job.location.address;
        return null;
    };

    return (
        <div className="p-4 space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-lg font-bold">Task Details</h1>
                    <p className="text-xs text-muted-foreground">{typeLabel[task.type] || task.type}</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="font-semibold">{task.title}</h2>
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        </div>
                        <Badge className={statusColor[task.status] || ""}>{task.status.replace(/_/g, " ")}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>From: <span className="font-medium text-foreground">{getName(task.assignedBy)}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {getAddress() && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span>{getAddress()}</span>
                        </div>
                    )}

                    {typeof task.zone === "object" && (
                        <div className="text-sm text-muted-foreground">
                            Zone: <span className="font-medium text-foreground">{task.zone.name}</span> ({task.zone.city})
                        </div>
                    )}

                    {typeof task.job === "object" && task.job && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                            <p className="font-medium">{task.job.subServiceName || task.job.serviceType}</p>
                            <p className="text-muted-foreground">Status: {task.job.status}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            {task.status === "ASSIGNED" && (
                <Button className="w-full" onClick={handleStart} disabled={actionLoading}>
                    <Play className="h-4 w-4 mr-2" /> Start Task
                </Button>
            )}

            {task.status === "IN_PROGRESS" && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Resolve Task</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Textarea
                            placeholder="Describe how the issue was resolved..."
                            value={resolutionNotes}
                            onChange={e => setResolutionNotes(e.target.value)}
                            rows={4}
                        />
                        <Button className="w-full" onClick={handleResolve} disabled={actionLoading || !resolutionNotes.trim()}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark as Resolved
                        </Button>
                    </CardContent>
                </Card>
            )}

            {task.status === "RESOLVED" && (
                <Card className="border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Resolved</span>
                        </div>
                        {task.resolutionNotes && (
                            <p className="text-sm text-muted-foreground">{task.resolutionNotes}</p>
                        )}
                        {task.resolvedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Resolved on {new Date(task.resolvedAt).toLocaleString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
