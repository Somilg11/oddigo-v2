import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setError(null);
            const response = await api.post("/auth/signup", {
                ...data,
                role: "CUSTOMER",
            });
            const { user, accessToken, refreshToken } = extractData<{ user: User; accessToken: string; refreshToken: string }>(response);
            setAuth(user, accessToken);
            localStorage.setItem("oddigo_refresh_token", refreshToken);
            navigate("/");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
            setError(message);
            logger.error("Registration failed", err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Register</CardTitle>
                    <CardDescription>Create a new account to get started.</CardDescription>
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
                                <Input placeholder="Name" {...register("name")} />
                                {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Input placeholder="Email" {...register("email")} />
                                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Input type="password" placeholder="Password" {...register("password")} />
                                {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Input placeholder="Phone" {...register("phone")} />
                                {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
                            </div>
                        </div>
                        <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner size="sm" /> : "Register"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
