import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { ServiceCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
    icon: z.string().optional().default(""),
    description: z.string().optional().default(""),
    sortOrder: z.number().min(0).optional().default(0),
    isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category?: ServiceCategory | null;
}

export function ServiceFormDialog({ open, onClose, onSuccess, category }: Props) {
    const [error, setError] = useState<string | null>(null);
    const isEditing = !!category;

    const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            slug: "",
            icon: "",
            description: "",
            sortOrder: 0,
            isActive: true,
        },
    });

    useEffect(() => {
        if (category) {
            reset({
                name: category.name,
                slug: category.slug,
                icon: category.icon,
                description: category.description,
                sortOrder: category.sortOrder,
                isActive: category.isActive,
            });
        } else {
            reset({ name: "", slug: "", icon: "", description: "", sortOrder: 0, isActive: true });
        }
    }, [category, reset]);

    const watchName = watch("name");

    useEffect(() => {
        if (!isEditing && watchName) {
            const slug = watchName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            setValue("slug", slug);
        }
    }, [watchName, isEditing, setValue]);

    const onSubmit = async (data: CategoryFormValues) => {
        try {
            setError(null);
            if (isEditing) {
                await api.patch(`/admin/services/categories/${category!._id}`, data);
            } else {
                await api.post("/admin/services/categories", data);
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save category";
            setError(message);
            logger.error("Save category failed:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Category" : "Add Category"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update the service category details." : "Create a new service category."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="e.g. Plumbing" {...register("name")} />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" placeholder="e.g. plumbing" {...register("slug")} />
                        {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="icon">Icon (emoji)</Label>
                        <Input id="icon" placeholder="e.g. 🔧" {...register("icon")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Brief description..." {...register("description")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <Input id="sortOrder" type="number" min="0" {...register("sortOrder", { valueAsNumber: true })} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={watch("isActive")}
                            onCheckedChange={(v) => setValue("isActive", v)}
                        />
                        <Label>Active</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner size="sm" /> : isEditing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
