import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Users, AlertTriangle, XCircle, CheckCircle, Clock, MapPin,
    Plus, Phone
} from "lucide-react";
import { toast } from "sonner";
import type { ZoneManagerOverview, Task } from "@/types";

const statusColor: Record<string, string> = {
    OPEN: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
    IN_REVIEW: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    ESCALATED: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
    RESOLVED: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
    CLOSED: "text-gray-600 bg-muted",
    CANCELLED: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
    CANCELLED_CHARGED: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
};

const taskStatusColor: Record<string, string> = {
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

export default function ZoneManagerDashboardPage() {
    const [data, setData] = useState<ZoneManagerOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAssign, setShowAssign] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [assignForm, setAssignForm] = useState({
        title: "",
        description: "",
        type: "GENERAL" as Task["type"],
        priority: "MEDIUM",
        assignedTo: "",
        zoneId: "",
        location: "",
    });

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const res = await api.get("/zone-manager/overview");
            setData(extractData(res));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load overview");
            logger.error("Failed to fetch zone manager overview:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAssignTask = async () => {
        if (!assignForm.title || !assignForm.assignedTo || !assignForm.zoneId) {
            toast.error("Title, field executive, and zone are required");
            return;
        }
        try {
            setAssigning(true);
            await api.post("/zone-manager/tasks", assignForm);
            toast.success("Task assigned successfully");
            setShowAssign(false);
            setAssignForm({ title: "", description: "", type: "GENERAL", priority: "MEDIUM", assignedTo: "", zoneId: "", location: "" });
            fetchData();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to assign task");
        } finally {
            setAssigning(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} onRetry={fetchData} />;
    if (!data) return null;

    const { zones, fieldExecutives, complaints, disputes, tasks } = data;
    const activeTasks = tasks.filter(t => t.status !== "RESOLVED");
    const resolvedTasks = tasks.filter(t => t.status === "RESOLVED");
    const openComplaints = complaints.filter(c => c.status === "OPEN" || c.status === "ESCALATED").length;

    const getName = (obj: unknown) => {
        if (typeof obj === "object" && obj !== null && "name" in obj) return (obj as { name: string }).name;
        return "Unknown";
    };

    const getPhone = (obj: unknown): string | undefined => {
        if (typeof obj === "object" && obj !== null && "phone" in obj) return (obj as { phone?: string }).phone;
        return undefined;
    };

    return (
        <div className="p-4 space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold">Zone Manager Dashboard</h1>
                    <p className="text-sm text-muted-foreground">{zones.length} zones &middot; {fieldExecutives.length} field executives</p>
                </div>
                <Button size="sm" onClick={() => setShowAssign(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Assign Task
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Field Executives</span>
                        </div>
                        <p className="text-xl font-bold">{fieldExecutives.length}</p>
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
                            <span className="text-xs text-muted-foreground">Open Complaints</span>
                        </div>
                        <p className="text-xl font-bold text-red-600">{openComplaints}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <XCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-xs text-muted-foreground">Disputes</span>
                        </div>
                        <p className="text-xl font-bold text-orange-600">{disputes.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Zones with team details */}
            {zones.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold mb-3">My Zones</h2>
                    <div className="space-y-3">
                        {zones.map((zone) => (
                            <Card key={zone._id}>
                                <CardContent className="p-4">
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
                                        <Badge className="text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400">Active</Badge>
                                    </div>

                                    {/* Field executives in this zone */}
                                    {zone.fieldExecutives && zone.fieldExecutives.length > 0 && (
                                        <div className="mb-2">
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
                                    {(!zone.fieldExecutives || zone.fieldExecutives.length === 0) && (
                                        <p className="text-xs text-muted-foreground">No field executives assigned yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Tasks */}
            {activeTasks.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold mb-3">Active Tasks ({activeTasks.length})</h2>
                    <div className="space-y-2">
                        {activeTasks.map(task => (
                            <Card key={task._id}>
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
                                                <span>&rarr; {getName(task.assignedTo)}</span>
                                                <span>{getName(task.zone)}</span>
                                            </div>
                                            {task.location && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3 shrink-0" /> {task.location}
                                                </p>
                                            )}
                                        </div>
                                        <Badge className={taskStatusColor[task.status] || ""}>{task.status.replace(/_/g, " ")}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Field Executives */}
            <div>
                <h2 className="text-base font-semibold mb-3">Field Executives</h2>
                {fieldExecutives.length === 0 ? (
                    <EmptyState title="No field executives" description="No field executives assigned to your zones yet." />
                ) : (
                    <div className="space-y-2">
                        {fieldExecutives.map(exec => (
                            <Card key={exec._id}>
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-medium text-primary">{exec.name?.charAt(0) || "E"}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{exec.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{exec.email}</p>
                                    </div>
                                    {exec.phone && (
                                        <a href={`tel:${exec.phone}`} className="text-muted-foreground hover:text-foreground shrink-0">
                                            <Phone className="h-4 w-4" />
                                        </a>
                                    )}
                                    <Badge className={exec.isActive ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400" : "text-gray-600 bg-muted"}>
                                        {exec.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Complaints */}
            {complaints.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold mb-3">Complaints ({complaints.length})</h2>
                    <div className="space-y-2">
                        {complaints.slice(0, 10).map(c => (
                            <Card key={c._id}>
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm line-clamp-1">{c.description}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>{getName(c.customer)}</span>
                                                <span>&rarr; {getName(c.worker)}</span>
                                                {c.category && <span>&middot; {c.category}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            {c.priority && <span className={`text-xs font-medium ${priorityColor[c.priority]}`}>{c.priority}</span>}
                                            <Badge className={statusColor[c.status] || ""}>{c.status}</Badge>
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
                    <h2 className="text-base font-semibold mb-3">Disputes ({disputes.length})</h2>
                    <div className="space-y-2">
                        {disputes.slice(0, 10).map(d => (
                            <Card key={d._id}>
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{d.subServiceName || d.serviceType}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{getName(d.customer)}</p>
                                            {d.location?.address && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3" /> {d.location.address}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <Badge className={statusColor[d.status] || ""}>{d.status.replace(/_/g, " ")}</Badge>
                                            {d.finalQuote && <p className="text-xs font-medium mt-1">₹{d.finalQuote}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Assign Task Dialog */}
            <Dialog open={showAssign} onOpenChange={setShowAssign}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Assign Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={assignForm.title} onChange={e => setAssignForm({ ...assignForm, title: e.target.value })} placeholder="e.g. Handle complaint #123" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={assignForm.description} onChange={e => setAssignForm({ ...assignForm, description: e.target.value })} placeholder="Details about the task..." rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={assignForm.type} onValueChange={v => setAssignForm({ ...assignForm, type: v as Task["type"] })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COMPLAINT_HANDLE">Complaint</SelectItem>
                                        <SelectItem value="DISPUTE_RESOLVE">Dispute</SelectItem>
                                        <SelectItem value="QUALITY_CHECK">Quality Check</SelectItem>
                                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                                        <SelectItem value="GENERAL">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={assignForm.priority} onValueChange={v => setAssignForm({ ...assignForm, priority: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Assign To</Label>
                            <Select value={assignForm.assignedTo} onValueChange={v => setAssignForm({ ...assignForm, assignedTo: v })}>
                                <SelectTrigger><SelectValue placeholder="Select field executive" /></SelectTrigger>
                                <SelectContent>
                                    {fieldExecutives.map(fe => (
                                        <SelectItem key={fe._id} value={fe._id}>{fe.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Zone</Label>
                            <Select value={assignForm.zoneId} onValueChange={v => setAssignForm({ ...assignForm, zoneId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                                <SelectContent>
                                    {zones.map(z => (
                                        <SelectItem key={z._id} value={z._id}>{z.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Location (optional)</Label>
                            <Input value={assignForm.location} onChange={e => setAssignForm({ ...assignForm, location: e.target.value })} placeholder="Address or area" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
                        <Button onClick={handleAssignTask} disabled={assigning}>
                            {assigning ? "Assigning..." : "Assign Task"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
