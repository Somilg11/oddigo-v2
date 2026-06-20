import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { Banner } from "@/types";
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

const bannerTypes = ["PROMOTION", "ANNOUNCEMENT", "COUPON", "INFO"] as const;

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    const [formOpen, setFormOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: "",
        subtitle: "",
        imageUrl: "",
        linkUrl: "",
        type: "PROMOTION" as Banner["type"],
        isActive: true,
        sortOrder: 0,
        startsAt: "",
        expiresAt: "",
    });

    const fetchBanners = useCallback(async () => {
        try {
            setError(null);
            const response = await api.get(`/admin/banners?page=${page}&limit=15`);
            setBanners(extractData(response));
            if (response.data.pagination) {
                setPagination(response.data.pagination);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch banners";
            setError(message);
            logger.error("Failed to fetch banners:", err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const openCreate = () => {
        setEditingBanner(null);
        setForm({
            title: "",
            subtitle: "",
            imageUrl: "",
            linkUrl: "",
            type: "PROMOTION",
            isActive: true,
            sortOrder: 0,
            startsAt: "",
            expiresAt: "",
        });
        setFormOpen(true);
    };

    const openEdit = (banner: Banner) => {
        setEditingBanner(banner);
        setForm({
            title: banner.title,
            subtitle: banner.subtitle || "",
            imageUrl: banner.imageUrl || "",
            linkUrl: banner.linkUrl || "",
            type: banner.type,
            isActive: banner.isActive,
            sortOrder: banner.sortOrder,
            startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : "",
            expiresAt: banner.expiresAt ? banner.expiresAt.slice(0, 16) : "",
        });
        setFormOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload: Record<string, unknown> = {
                title: form.title,
                subtitle: form.subtitle,
                imageUrl: form.imageUrl,
                linkUrl: form.linkUrl,
                type: form.type,
                isActive: form.isActive,
                sortOrder: form.sortOrder,
            };
            if (form.startsAt) payload.startsAt = form.startsAt;
            if (form.expiresAt) payload.expiresAt = form.expiresAt;

            if (editingBanner) {
                await api.patch(`/admin/banners/${editingBanner._id}`, payload);
            } else {
                await api.post("/admin/banners", payload);
            }
            setFormOpen(false);
            fetchBanners();
        } catch (err) {
            logger.error("Failed to save banner:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (banner: Banner) => {
        try {
            await api.patch(`/admin/banners/${banner._id}`, { isActive: !banner.isActive });
            setBanners((prev) =>
                prev.map((b) => (b._id === banner._id ? { ...b, isActive: !b.isActive } : b))
            );
        } catch (err) {
            logger.error("Failed to toggle banner:", err);
        }
    };

    const handleDelete = async () => {
        if (!deletingBanner) return;
        try {
            await api.delete(`/admin/banners/${deletingBanner._id}`);
            setBanners((prev) => prev.filter((b) => b._id !== deletingBanner._id));
            setDeletingBanner(null);
        } catch (err) {
            logger.error("Failed to delete banner:", err);
        }
    };

    const typeBadgeVariant = (type: Banner["type"]) => {
        switch (type) {
            case "PROMOTION": return "default";
            case "ANNOUNCEMENT": return "secondary";
            case "COUPON": return "outline";
            case "INFO": return "secondary";
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
        return <PageError message={error} onRetry={fetchBanners} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Content Banners</h1>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" /> Add Banner
                </Button>
            </div>

            {banners.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No banners yet. Create one to get started.
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Sort</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Starts</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {banners.map((banner) => (
                                <TableRow key={banner._id}>
                                    <TableCell>
                                        <div className="font-medium">{banner.title}</div>
                                        {banner.subtitle && (
                                            <div className="text-sm text-muted-foreground">{banner.subtitle}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={typeBadgeVariant(banner.type)}>{banner.type}</Badge>
                                    </TableCell>
                                    <TableCell>{banner.sortOrder}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={banner.isActive}
                                            onCheckedChange={() => handleToggleActive(banner)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {banner.startsAt ? new Date(banner.startsAt).toLocaleDateString() : "—"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {banner.expiresAt ? new Date(banner.expiresAt).toLocaleDateString() : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(banner)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingBanner(banner)}>
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
                        <DialogTitle>{editingBanner ? "Edit Banner" : "Create Banner"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. 20% Off AC Service"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subtitle</Label>
                            <Input
                                value={form.subtitle}
                                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                                placeholder="e.g. Limited time offer"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) => setForm({ ...form, type: v as Banner["type"] })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bannerTypes.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Sort Order</Label>
                                <Input
                                    type="number"
                                    value={form.sortOrder}
                                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                                value={form.imageUrl}
                                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Link URL</Label>
                            <Input
                                value={form.linkUrl}
                                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                                placeholder="/services/:id or https://..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Starts At</Label>
                                <Input
                                    type="datetime-local"
                                    value={form.startsAt}
                                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Expires At</Label>
                                <Input
                                    type="datetime-local"
                                    value={form.expiresAt}
                                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={form.isActive}
                                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                            />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !form.title}>
                            {saving ? "Saving..." : editingBanner ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingBanner} onOpenChange={(v) => !v && setDeletingBanner(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Banner</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{deletingBanner?.title}</strong>. This action cannot be undone.
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
