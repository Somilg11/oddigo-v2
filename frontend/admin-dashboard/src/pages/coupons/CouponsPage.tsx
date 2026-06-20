import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { Coupon } from "@/types";
import { PageError } from "@/components/common/PageError";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

const couponTypes = ["PERCENTAGE", "FLAT", "FREE_DELIVERY"] as const;

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    const [formOpen, setFormOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        code: "",
        description: "",
        type: "PERCENTAGE" as Coupon["type"],
        value: 0,
        minOrderAmount: "",
        maxDiscount: "",
        usageLimit: "",
        perUserLimit: "",
        isActive: true,
        startsAt: "",
        expiresAt: "",
    });

    const fetchCoupons = useCallback(async () => {
        try {
            setError(null);
            const response = await api.get(`/admin/coupons?page=${page}&limit=15`);
            setCoupons(extractData(response));
            if (response.data.pagination) {
                setPagination(response.data.pagination);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch coupons";
            setError(message);
            logger.error("Failed to fetch coupons:", err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    const openCreate = () => {
        setEditingCoupon(null);
        setForm({
            code: "",
            description: "",
            type: "PERCENTAGE",
            value: 0,
            minOrderAmount: "",
            maxDiscount: "",
            usageLimit: "",
            perUserLimit: "",
            isActive: true,
            startsAt: "",
            expiresAt: "",
        });
        setFormOpen(true);
    };

    const openEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setForm({
            code: coupon.code,
            description: coupon.description,
            type: coupon.type,
            value: coupon.value,
            minOrderAmount: coupon.minOrderAmount?.toString() || "",
            maxDiscount: coupon.maxDiscount?.toString() || "",
            usageLimit: coupon.usageLimit?.toString() || "",
            perUserLimit: coupon.perUserLimit?.toString() || "",
            isActive: coupon.isActive,
            startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : "",
            expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : "",
        });
        setFormOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload: Record<string, unknown> = {
                code: form.code.toUpperCase(),
                description: form.description,
                type: form.type,
                value: form.value,
                isActive: form.isActive,
            };
            if (form.minOrderAmount) payload.minOrderAmount = parseFloat(form.minOrderAmount);
            if (form.maxDiscount) payload.maxDiscount = parseFloat(form.maxDiscount);
            if (form.usageLimit) payload.usageLimit = parseInt(form.usageLimit);
            if (form.perUserLimit) payload.perUserLimit = parseInt(form.perUserLimit);
            if (form.startsAt) payload.startsAt = form.startsAt;
            if (form.expiresAt) payload.expiresAt = form.expiresAt;

            if (editingCoupon) {
                await api.patch(`/admin/coupons/${editingCoupon._id}`, payload);
            } else {
                await api.post("/admin/coupons", payload);
            }
            setFormOpen(false);
            fetchCoupons();
        } catch (err) {
            logger.error("Failed to save coupon:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            await api.patch(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
            setCoupons((prev) =>
                prev.map((c) => (c._id === coupon._id ? { ...c, isActive: !c.isActive } : c))
            );
        } catch (err) {
            logger.error("Failed to toggle coupon:", err);
        }
    };

    const handleDelete = async () => {
        if (!deletingCoupon) return;
        try {
            await api.delete(`/admin/coupons/${deletingCoupon._id}`);
            setCoupons((prev) => prev.filter((c) => c._id !== deletingCoupon._id));
            setDeletingCoupon(null);
        } catch (err) {
            logger.error("Failed to delete coupon:", err);
        }
    };

    const typeBadgeVariant = (type: Coupon["type"]) => {
        switch (type) {
            case "PERCENTAGE": return "default";
            case "FLAT": return "secondary";
            case "FREE_DELIVERY": return "outline";
            default: return "secondary";
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={fetchCoupons} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Coupons</h1>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" /> Add Coupon
                </Button>
            </div>

            {coupons.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No coupons yet. Create one to get started.
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.map((coupon) => (
                                <TableRow key={coupon._id}>
                                    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{coupon.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={typeBadgeVariant(coupon.type)}>{coupon.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `₹${coupon.value}`}
                                        {coupon.maxDiscount && <span className="text-muted-foreground text-xs block">Max ₹{coupon.maxDiscount}</span>}
                                    </TableCell>
                                    <TableCell>
                                        {coupon.usageCount}
                                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={coupon.isActive}
                                            onCheckedChange={() => handleToggleActive(coupon)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingCoupon(coupon)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Code *</Label>
                                <Input
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g. WELCOME20"
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Coupon["type"] })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {couponTypes.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Input
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="e.g. 20% off first booking"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Value *</Label>
                                <Input
                                    type="number"
                                    value={form.value || ""}
                                    onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                                    placeholder={form.type === "PERCENTAGE" ? "e.g. 20" : "e.g. 200"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Order Amount</Label>
                                <Input
                                    type="number"
                                    value={form.minOrderAmount}
                                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                                    placeholder="₹0"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Max Discount (for %)</Label>
                                <Input
                                    type="number"
                                    value={form.maxDiscount}
                                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                                    placeholder="₹0 = no limit"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Usage Limit</Label>
                                <Input
                                    type="number"
                                    value={form.usageLimit}
                                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                    placeholder="0 = unlimited"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Per-User Limit</Label>
                                <Input
                                    type="number"
                                    value={form.perUserLimit}
                                    onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                                    placeholder="0 = unlimited"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Starts At</Label>
                                <Input
                                    type="datetime-local"
                                    value={form.startsAt}
                                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Expires At</Label>
                                <Input
                                    type="datetime-local"
                                    value={form.expiresAt}
                                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <Switch
                                    checked={form.isActive}
                                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                                />
                                <Label>Active</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !form.code || !form.description}>
                            {saving ? "Saving..." : editingCoupon ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingCoupon} onOpenChange={(v) => !v && setDeletingCoupon(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete coupon <strong>{deletingCoupon?.code}</strong>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </div>
    );
}
