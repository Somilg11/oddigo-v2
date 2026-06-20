import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { ServiceCategory } from "@/types";
import { PageError } from "@/components/common/PageError";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ServicesListPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    const [formOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<ServiceCategory | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            setError(null);
            const response = await api.get(`/admin/services/categories?page=${page}&limit=15`);
            setCategories(extractData(response));
            if (response.data.pagination) {
                setPagination(response.data.pagination);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch categories";
            setError(message);
            logger.error("Failed to fetch categories:", err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleToggleActive = async (cat: ServiceCategory) => {
        try {
            await api.patch(`/admin/services/categories/${cat._id}`, { isActive: !cat.isActive });
            setCategories((prev) =>
                prev.map((c) => (c._id === cat._id ? { ...c, isActive: !c.isActive } : c))
            );
        } catch (err) {
            logger.error("Failed to toggle category:", err);
        }
    };

    const handleDelete = async () => {
        if (!deletingCategory) return;
        try {
            await api.delete(`/admin/services/categories/${deletingCategory._id}`);
            setCategories((prev) => prev.filter((c) => c._id !== deletingCategory._id));
            setDeletingCategory(null);
        } catch (err) {
            logger.error("Failed to delete category:", err);
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
        return <PageError message={error} onRetry={fetchCategories} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Services</h1>
                <Button onClick={() => { setEditingCategory(null); setFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
            </div>

            {categories.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No service categories yet. Create one to get started.
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Icon</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Sub-Services</TableHead>
                                <TableHead>Sort</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((cat) => (
                                <TableRow
                                    key={cat._id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/services/${cat._id}`)}
                                >
                                    <TableCell className="text-2xl">{cat.icon || "—"}</TableCell>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{cat.subServiceCount ?? 0}</Badge>
                                    </TableCell>
                                    <TableCell>{cat.sortOrder}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={cat.isActive}
                                            onCheckedChange={() => handleToggleActive(cat)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setEditingCategory(cat); setFormOpen(true); }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingCategory(cat)}
                                            >
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

            <ServiceFormDialog
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditingCategory(null); }}
                onSuccess={fetchCategories}
                category={editingCategory}
            />

            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />

            <AlertDialog open={!!deletingCategory} onOpenChange={(v) => !v && setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{deletingCategory?.name}</strong> and all its sub-services. This action cannot be undone.
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
        </div>
    );
}
