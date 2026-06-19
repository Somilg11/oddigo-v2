import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { extractData, extractList } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { ServiceCategory, SubService } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const subServiceSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional().default(""),
    basePrice: z.number().min(0, "Price must be at least 0"),
    estimatedTime: z.number().min(1, "Time must be at least 1 minute"),
    pricingType: z.enum(["FIXED", "ESTIMATE"]).default("ESTIMATE"),
    isActive: z.boolean().default(true),
});

type SubServiceFormValues = z.infer<typeof subServiceSchema>;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    subService?: SubService | null;
    defaultCategoryId?: string;
}

export function SubServiceFormDialog({ open, onClose, onSuccess, subService, defaultCategoryId }: Props) {
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const isEditing = !!subService;

    const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<SubServiceFormValues>({
        resolver: zodResolver(subServiceSchema),
        defaultValues: {
            name: "",
            slug: "",
            category: defaultCategoryId || "",
            description: "",
            basePrice: 0,
            estimatedTime: 30,
            pricingType: "ESTIMATE",
            isActive: true,
        },
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get("/admin/services/categories");
                setCategories(extractList(res));
            } catch (err) {
                logger.error("Failed to fetch categories", err);
            }
        };
        if (open) fetchCategories();
    }, [open]);

    useEffect(() => {
        if (subService) {
            const catId = typeof subService.category === "string" ? subService.category : subService.category._id;
            reset({
                name: subService.name,
                slug: subService.slug,
                category: catId,
                description: subService.description,
                basePrice: subService.basePrice,
                estimatedTime: subService.estimatedTime,
                pricingType: subService.pricingType,
                isActive: subService.isActive,
            });
        } else {
            reset({
                name: "", slug: "", category: defaultCategoryId || "", description: "",
                basePrice: 0, estimatedTime: 30, pricingType: "ESTIMATE", isActive: true,
            });
        }
    }, [subService, defaultCategoryId, reset]);

    const watchName = watch("name");

    useEffect(() => {
        if (!isEditing && watchName) {
            const slug = watchName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            setValue("slug", slug);
        }
    }, [watchName, isEditing, setValue]);

    const onSubmit = async (data: SubServiceFormValues) => {
        try {
            setError(null);
            if (isEditing) {
                await api.patch(`/admin/services/sub-services/${subService!._id}`, data);
            } else {
                await api.post("/admin/services/sub-services", data);
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save sub-service";
            setError(message);
            logger.error("Save sub-service failed:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Sub-Service" : "Add Sub-Service"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update the sub-service details." : "Create a new sub-service under a category."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat._id} value={cat._id}>
                                        {cat.icon} {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="e.g. Water Leakage" {...register("name")} />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" placeholder="e.g. water-leakage" {...register("slug")} />
                        {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Brief description..." {...register("description")} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="basePrice">Base Price (₹)</Label>
                            <Input id="basePrice" type="number" min="0" {...register("basePrice", { valueAsNumber: true })} />
                            {errors.basePrice && <p className="text-red-500 text-sm">{errors.basePrice.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="estimatedTime">Est. Time (min)</Label>
                            <Input id="estimatedTime" type="number" min="1" {...register("estimatedTime", { valueAsNumber: true })} />
                            {errors.estimatedTime && <p className="text-red-500 text-sm">{errors.estimatedTime.message}</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Pricing Type</Label>
                        <Select value={watch("pricingType")} onValueChange={(v) => setValue("pricingType", v as "FIXED" | "ESTIMATE")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FIXED">Fixed</SelectItem>
                                <SelectItem value="ESTIMATE">Estimate</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch checked={watch("isActive")} onCheckedChange={(v) => setValue("isActive", v)} />
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
