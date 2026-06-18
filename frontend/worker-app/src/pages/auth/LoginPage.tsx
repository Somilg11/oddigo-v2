import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setError(null);
            const response = await api.post("/auth/login", data);
            const { user, accessToken, refreshToken } = response.data.data;
            setAuth(user, accessToken);
            localStorage.setItem("oddigo_worker_refresh_token", refreshToken);
            navigate("/");
        } catch (err: any) {
            setError(err.response?.data?.message || "Login failed. Please try again.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Worker Login</CardTitle>
                    <CardDescription>Access your dashboard to manage jobs.</CardDescription>
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
                                <Input placeholder="Email" {...register("email")} />
                                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Input type="password" placeholder="Password" {...register("password")} />
                                {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                            </div>
                        </div>
                        <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner size="sm" /> : "Login"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Link to="/login/otp" className="text-sm text-blue-500 hover:underline">
                        Login with OTP instead
                    </Link>
                    <p className="text-sm text-gray-500">
                        Join as a professional? <Link to="/register" className="text-blue-500 hover:underline">Register</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
