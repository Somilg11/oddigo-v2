import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Pagination } from "@/components/common/Pagination";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, UserCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Executive {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: "ZONE_MANAGER" | "CITY_MANAGER" | "FIELD_EXECUTIVE";
    isActive: boolean;
    createdAt: string;
    profile?: {
        assignedZones?: { _id: string; name: string; city: string }[];
        assignedCities?: string[];
        assignedZone?: { _id: string; name: string; city: string };
        managedWorkers?: string[];
    };
}

interface ZoneOption {
    _id: string;
    name: string;
    city: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const roleLabels: Record<string, string> = {
    ZONE_MANAGER: "Zone Manager",
    CITY_MANAGER: "City Manager",
    FIELD_EXECUTIVE: "Field Executive",
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
    ZONE_MANAGER: "default",
    CITY_MANAGER: "secondary",
    FIELD_EXECUTIVE: "outline",
};

const CITY_OPTIONS = ["Kanpur", "Farukabad", "Noida", "Delhi", "Bangalore"];

export default function ExecutivesManagementPage() {
    const [executives, setExecutives] = useState<Executive[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingExec, setEditingExec] = useState<Executive | null>(null);
    const [zones, setZones] = useState<ZoneOption[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "ZONE_MANAGER" as Executive["role"],
        assignedCities: "",
        selectedCity: "",
        assignedZones: [] as string[],
        assignedZone: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingExec, setDeletingExec] = useState<Executive | null>(null);
    const [showZoneForm, setShowZoneForm] = useState(false);
    const [zoneForm, setZoneForm] = useState({ name: "", radiusKm: "5" });
    const [creatingZone, setCreatingZone] = useState(false);

    const fetchZones = useCallback(async () => {
        try {
            const res = await api.get("/admin/zones/list");
            setZones(extractData<ZoneOption[]>(res));
        } catch {
            // silent
        }
    }, []);

    const fetchExecutives = useCallback(async (page = 1) => {
        try {
            setError(null);
            setLoading(true);
            const params: Record<string, string> = { page: String(page), limit: "20" };
            if (search) params.search = search;
            if (roleFilter !== "all") params.role = roleFilter;
            const response = await api.get("/admin/executives", { params });
            const data = response.data;
            const items = data.data || [];
            const pag = data.pagination || { page, limit: 20, total: items.length, pages: 1 };
            setExecutives(items);
            setPagination({ page: pag.page || page, limit: pag.limit || 20, total: pag.total || items.length, pages: pag.pages || 1 });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch executives";
            setError(message);
            logger.error("Failed to fetch executives:", err);
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter]);

    useEffect(() => {
        fetchExecutives(1);
    }, [fetchExecutives]);

    useEffect(() => {
        fetchZones();
    }, [fetchZones]);

    const filteredExecutives = executives.filter((exec) => {
        if (statusFilter === "active") return exec.isActive;
        if (statusFilter === "inactive") return !exec.isActive;
        return true;
    });

    const openCreateDialog = () => {
        setEditingExec(null);
        setFormData({ name: "", email: "", phone: "", password: "", role: "ZONE_MANAGER", assignedCities: "", selectedCity: "", assignedZones: [], assignedZone: "" });
        setDialogOpen(true);
    };

    const openEditDialog = (exec: Executive) => {
        setEditingExec(exec);
        const zoneIds = exec.profile?.assignedZones?.map(z => z._id) || [];
        const firstZone = exec.profile?.assignedZones?.[0];
        setFormData({
            name: exec.name,
            email: exec.email,
            phone: exec.phone,
            password: "",
            role: exec.role,
            assignedCities: exec.profile?.assignedCities?.join(", ") || "",
            selectedCity: firstZone?.city || "",
            assignedZones: zoneIds,
            assignedZone: typeof exec.profile?.assignedZone === "object" ? exec.profile.assignedZone._id : (exec.profile?.assignedZone || ""),
        });
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            if (editingExec) {
                const updateData: Record<string, unknown> = {
                    name: formData.name,
                    phone: formData.phone,
                };
                if (formData.role === "CITY_MANAGER" && formData.assignedCities) {
                    updateData.assignedCities = formData.assignedCities.split(",").map(c => c.trim()).filter(Boolean);
                }
                if (formData.role === "ZONE_MANAGER" && formData.assignedZones.length > 0) {
                    updateData.assignedZones = formData.assignedZones;
                }
                if (formData.role === "FIELD_EXECUTIVE" && formData.assignedZone) {
                    updateData.assignedZone = formData.assignedZone;
                }
                await api.patch(`/admin/executives/${editingExec._id}`, updateData);
                toast.success("Executive updated");
            } else {
                const createData: Record<string, unknown> = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    role: formData.role,
                };
                if (formData.role === "CITY_MANAGER" && formData.assignedCities) {
                    createData.assignedCities = formData.assignedCities.split(",").map(c => c.trim()).filter(Boolean);
                }
                if (formData.role === "ZONE_MANAGER" && formData.assignedZones.length > 0) {
                    createData.assignedZones = formData.assignedZones;
                }
                if (formData.role === "FIELD_EXECUTIVE" && formData.assignedZone) {
                    createData.assignedZone = formData.assignedZone;
                }
                await api.post("/admin/executives", createData);
                toast.success("Executive created");
            }
            setDialogOpen(false);
            fetchExecutives(pagination.page);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Operation failed";
            toast.error(message);
            logger.error("Executive operation failed:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (exec: Executive) => {
        try {
            setTogglingId(exec._id);
            await api.patch(`/admin/executives/${exec._id}`, { isActive: !exec.isActive });
            toast.success(`${exec.name} ${exec.isActive ? "deactivated" : "activated"}`);
            fetchExecutives(pagination.page);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Toggle failed");
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingExec) return;
        try {
            await api.delete(`/admin/executives/${deletingExec._id}`);
            toast.success(`${deletingExec.name} permanently deleted`);
            setDeletingExec(null);
            fetchExecutives(pagination.page);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Delete failed");
        }
    };

    const handleCreateZone = async () => {
        if (!zoneForm.name.trim() || !formData.selectedCity) return;
        try {
            setCreatingZone(true);
            const res = await api.post("/admin/zones", {
                name: zoneForm.name.trim(),
                city: formData.selectedCity,
                radiusKm: parseFloat(zoneForm.radiusKm) || 5,
            });
            const newZone = res.data.data;
            toast.success(`Zone "${newZone.name}" created`);
            setZoneForm({ name: "", radiusKm: "5" });
            setShowZoneForm(false);
            await fetchZones();
            if (newZone?._id) {
                setFormData(prev => ({ ...prev, assignedZones: [...prev.assignedZones, newZone._id] }));
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to create zone");
        } finally {
            setCreatingZone(false);
        }
    };

    const getProfileSummary = (exec: Executive) => {
        if (exec.role === "ZONE_MANAGER" && exec.profile?.assignedZones && exec.profile.assignedZones.length > 0) {
            return exec.profile.assignedZones.map(z => `${z.name} (${z.city})`).join(", ");
        }
        if (exec.role === "CITY_MANAGER" && exec.profile?.assignedCities && exec.profile.assignedCities.length > 0) {
            return exec.profile.assignedCities.join(", ");
        }
        if (exec.role === "FIELD_EXECUTIVE" && exec.profile?.assignedZone) {
            const zone = exec.profile.assignedZone;
            return typeof zone === "object" ? `${zone.name} (${zone.city})` : zone;
        }
        return "—";
    };

    const filteredZonesForCityManager = formData.selectedCity
        ? zones.filter(z => z.city === formData.selectedCity)
        : zones;

    const resetForm = () => {
        setEditingExec(null);
        setFormData({ name: "", email: "", phone: "", password: "", role: "ZONE_MANAGER", assignedCities: "", selectedCity: "", assignedZones: [], assignedZone: "" });
        setShowZoneForm(false);
        setZoneForm({ name: "", radiusKm: "5" });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Executives</h1>
                    <p className="text-sm text-muted-foreground">Manage Zone Managers, City Managers, and Field Executives</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" /> Add Executive
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name, email, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="ZONE_MANAGER">Zone Manager</SelectItem>
                        <SelectItem value="CITY_MANAGER">City Manager</SelectItem>
                        <SelectItem value="FIELD_EXECUTIVE">Field Executive</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => fetchExecutives(pagination.page)} title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {error && <PageError message={error} onRetry={() => fetchExecutives(1)} />}

            {loading ? (
                <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
            ) : filteredExecutives.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No executives found</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="hidden md:table-cell">Assignment</TableHead>
                                    <TableHead className="text-center">Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExecutives.map((exec) => (
                                    <TableRow key={exec._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-sm font-medium text-primary">{exec.name.charAt(0)}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{exec.name}</p>
                                                    <p className="text-xs text-muted-foreground sm:hidden">{exec.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <p className="text-sm truncate">{exec.email}</p>
                                            <p className="text-xs text-muted-foreground">{exec.phone}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={roleBadgeVariant[exec.role]}>{roleLabels[exec.role]}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{getProfileSummary(exec)}</p>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={exec.isActive}
                                                onCheckedChange={() => handleToggleActive(exec)}
                                                disabled={togglingId === exec._id}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(exec)} title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingExec(exec)} title="Delete permanently">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                    <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchExecutives} />
                </>
            )}

            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{editingExec ? "Edit Executive" : "Create Executive"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                        </div>
                        {!editingExec && (
                            <>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@oddigo.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min 6 characters" />
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as Executive["role"] })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ZONE_MANAGER">Zone Manager</SelectItem>
                                    <SelectItem value="CITY_MANAGER">City Manager</SelectItem>
                                    <SelectItem value="FIELD_EXECUTIVE">Field Executive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.role === "CITY_MANAGER" && (
                            <div className="space-y-2">
                                <Label>Assigned Cities</Label>
                                <div className="space-y-2 border rounded-md p-3">
                                    {CITY_OPTIONS.map((city) => (
                                        <label key={city} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedCities.split(",").map(c => c.trim()).includes(city)}
                                                onChange={(e) => {
                                                    const current = formData.assignedCities.split(",").map(c => c.trim()).filter(Boolean);
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, assignedCities: [...current, city].join(", ") });
                                                    } else {
                                                        setFormData({ ...formData, assignedCities: current.filter(c => c !== city).join(", ") });
                                                    }
                                                }}
                                                className="rounded border-input"
                                            />
                                            {city}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">Select cities this manager will oversee</p>
                            </div>
                        )}
                        {formData.role === "ZONE_MANAGER" && (
                            <>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Select value={formData.selectedCity} onValueChange={(v) => { setFormData({ ...formData, selectedCity: v, assignedZones: [] }); setShowZoneForm(false); setZoneForm({ name: "", radiusKm: "5" }); }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a city" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CITY_OPTIONS.map((city) => (
                                                <SelectItem key={city} value={city}>{city}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.selectedCity && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Zones in {formData.selectedCity}</Label>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowZoneForm(!showZoneForm)}>
                                                <Plus className="h-3 w-3 mr-1" /> {showZoneForm ? "Cancel" : "Create Zone"}
                                            </Button>
                                        </div>
                                        {showZoneForm && (
                                            <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                                                <Input
                                                    value={zoneForm.name}
                                                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                                                    placeholder="Zone name (e.g. Civil Lines)"
                                                    className="h-9"
                                                />
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={zoneForm.radiusKm}
                                                        onChange={(e) => setZoneForm({ ...zoneForm, radiusKm: e.target.value })}
                                                        placeholder="Radius km"
                                                        className="h-9 flex-1"
                                                        type="number"
                                                        min="1"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        className="h-9"
                                                        disabled={!zoneForm.name.trim() || creatingZone}
                                                        onClick={handleCreateZone}
                                                    >
                                                        {creatingZone ? "Creating..." : "Create"}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Zone will be saved as "{formData.selectedCity} - {zoneForm.name || '...'}"</p>
                                            </div>
                                        )}
                                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                            {filteredZonesForCityManager.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No zones in this city yet. Create one above.</p>
                                            ) : (
                                                filteredZonesForCityManager.map((z) => (
                                                    <label key={z._id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.assignedZones.includes(z._id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData({ ...formData, assignedZones: [...formData.assignedZones, z._id] });
                                                                } else {
                                                                    setFormData({ ...formData, assignedZones: formData.assignedZones.filter(id => id !== z._id) });
                                                                }
                                                            }}
                                                            className="rounded border-input"
                                                        />
                                                        {z.name}
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Select zones this manager will oversee</p>
                                    </div>
                                )}
                            </>
                        )}
                        {formData.role === "FIELD_EXECUTIVE" && (
                            <>
                                <div className="space-y-2">
                                    <Label>Zone</Label>
                                    <Select value={formData.assignedZone} onValueChange={(v) => setFormData({ ...formData, assignedZone: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a zone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {zones.map((z) => (
                                                <SelectItem key={z._id} value={z._id}>{z.name} ({z.city})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.assignedZone && (() => {
                                    const selected = zones.find(z => z._id === formData.assignedZone);
                                    return selected ? (
                                        <div className="bg-muted/50 rounded-md p-3 text-sm">
                                            <p className="text-muted-foreground">City: <span className="font-medium text-foreground">{selected.city}</span></p>
                                            <p className="text-muted-foreground">Zone: <span className="font-medium text-foreground">{selected.name}</span></p>
                                        </div>
                                    ) : null;
                                })()}
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? "Saving..." : editingExec ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingExec} onOpenChange={(v) => !v && setDeletingExec(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Executive</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{deletingExec?.name}</strong> and remove all their data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
