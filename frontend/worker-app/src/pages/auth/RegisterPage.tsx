import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { extractData, extractList } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { User, ServiceCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    serviceType: z.string().min(1, "Please select a service type"),
    hourlyRate: z.number().min(1, "Hourly rate is required"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            phone: "",
            serviceType: "",
            hourlyRate: 0,
        },
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get("/services/categories");
                setCategories(extractList(response));
            } catch (err) {
                logger.error("Failed to fetch service categories:", err);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setError(null);
            const response = await api.post("/auth/signup", {
                ...data,
                role: "WORKER",
            });
            const { user, accessToken, refreshToken } = extractData<{ user: User; accessToken: string; refreshToken: string }>(response);
            setAuth(user as any, accessToken);
            localStorage.setItem("oddigo_worker_refresh_token", refreshToken);
            navigate("/");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
            setError(message);
            logger.error("Registration failed:", err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Worker Registration</CardTitle>
                    <CardDescription>Join our platform as a service provider.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid w-full items-center gap-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="flex flex-col space-y-1.5">
                                <Label>Name</Label>
                                <Input placeholder="Your full name" {...register("name")} />
                                {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Email</Label>
                                <Input placeholder="you@example.com" {...register("email")} />
                                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Password</Label>
                                <Input type="password" placeholder="Min 6 characters" {...register("password")} />
                                {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Phone</Label>
                                <Input placeholder="10-digit phone number" {...register("phone")} />
                                {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Service Type</Label>
                                {loadingCategories ? (
                                    <div className="flex items-center justify-center h-10 border rounded-md">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                ) : (
                                    <Select value={watch("serviceType")} onValueChange={(v) => setValue("serviceType", v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your service type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat._id} value={cat.slug}>
                                                    {cat.icon} {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                {errors.serviceType && <span className="text-red-500 text-sm">{errors.serviceType.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Hourly Rate (₹)</Label>
                                <Input type="number" min="1" placeholder="e.g. 500" {...register("hourlyRate", { valueAsNumber: true })} />
                                {errors.hourlyRate && <span className="text-red-500 text-sm">{errors.hourlyRate.message}</span>}
                            </div>
                        </div>
                        <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner size="sm" /> : "Register"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
