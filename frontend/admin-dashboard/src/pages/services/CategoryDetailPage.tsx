import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { ServiceCategory, SubService } from "@/types";
import { PageError } from "@/components/common/PageError";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SubServiceFormDialog } from "./SubServiceFormDialog";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";

export default function CategoryDetailPage() {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [category, setCategory] = useState<ServiceCategory | null>(null);
    const [subServices, setSubServices] = useState<SubService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formOpen, setFormOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<SubService | null>(null);
    const [deletingSub, setDeletingSub] = useState<SubService | null>(null);

    const fetchData = useCallback(async () => {
        if (!categoryId) return;
        try {
            setError(null);
            const [catRes, subRes] = await Promise.all([
                api.get("/admin/services/categories"),
                api.get(`/admin/services/sub-services?categoryId=${categoryId}`),
            ]);
            const allCats = extractData<ServiceCategory[]>(catRes);
            const found = allCats.find((c) => c._id === categoryId);
            if (!found) {
                setError("Category not found");
                return;
            }
            setCategory(found);
            setSubServices(extractData(subRes));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load data";
            setError(message);
            logger.error("Failed to load category details:", err);
        } finally {
            setLoading(false);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async () => {
        if (!deletingSub) return;
        try {
            await api.delete(`/admin/services/sub-services/${deletingSub._id}`);
            setSubServices((prev) => prev.filter((s) => s._id !== deletingSub._id));
            setDeletingSub(null);
        } catch (err) {
            logger.error("Failed to delete sub-service:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !category) {
        return <PageError message={error || "Category not found"} onRetry={() => navigate("/services")} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/services")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                    <span className="text-3xl">{category.icon}</span>
                    <h1 className="text-2xl font-bold">{category.name}</h1>
                </div>
                <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                </Badge>
            </div>

            {category.description && (
                <p className="text-muted-foreground">{category.description}</p>
            )}

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sub-Services ({subServices.length})</h2>
                <Button onClick={() => { setEditingSub(null); setFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Sub-Service
                </Button>
            </div>

            {subServices.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No sub-services in this category yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Est. Time</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subServices.map((sub) => (
                                <TableRow key={sub._id}>
                                    <TableCell className="font-medium">{sub.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{sub.slug}</TableCell>
                                    <TableCell>₹{sub.basePrice}</TableCell>
                                    <TableCell>{sub.estimatedTime} min</TableCell>
                                    <TableCell>
                                        <Badge variant={sub.pricingType === "FIXED" ? "default" : "secondary"}>
                                            {sub.pricingType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={sub.isActive ? "default" : "secondary"}>
                                            {sub.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingSub(sub); setFormOpen(true); }}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingSub(sub)}>
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

            <SubServiceFormDialog
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditingSub(null); }}
                onSuccess={fetchData}
                subService={editingSub}
                defaultCategoryId={categoryId}
            />

            <AlertDialog open={!!deletingSub} onOpenChange={(v) => !v && setDeletingSub(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sub-Service</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deletingSub?.name}</strong>? This action cannot be undone.
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
