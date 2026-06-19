import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            setError(null);
            await api.patch("/users/me", data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update profile.";
            setError(message);
            logger.error("Failed to update profile", err);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm flex items-center gap-2">
                                <Check className="h-4 w-4" /> Profile updated successfully
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Name</label>
                            <Input placeholder="Name" {...register("name")} />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Email</label>
                            <Input placeholder="Email" {...register("email")} />
                            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Phone</label>
                            <Input placeholder="Phone" {...register("phone")} />
                            {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
                        </div>
                        <Button className="w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner size="sm" /> : "Save Changes"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
