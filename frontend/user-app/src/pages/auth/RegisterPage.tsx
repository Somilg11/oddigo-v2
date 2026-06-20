import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Tag, Check, X } from "lucide-react";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    referralCode: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState<string | null>(null);
    const [referralStatus, setReferralStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
    const [referrerName, setReferrerName] = useState<string>("");

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            referralCode: searchParams.get("ref") || "",
        },
    });

    const referralCodeValue = watch("referralCode");

    const checkReferralCode = useCallback(async (code: string) => {
        if (!code || code.length < 4) {
            setReferralStatus("idle");
            setReferrerName("");
            return;
        }
        setReferralStatus("checking");
        try {
            const response = await api.get(`/users/referral/lookup/${code}`);
            const data = extractData<{ valid: boolean; referrerName: string }>(response);
            setReferralStatus("valid");
            setReferrerName(data.referrerName);
        } catch {
            setReferralStatus("invalid");
            setReferrerName("");
        }
    }, []);

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setError(null);
            const payload: Record<string, unknown> = {
                name: data.name,
                email: data.email,
                password: data.password,
                phone: data.phone,
                role: "CUSTOMER",
            };
            if (data.referralCode) {
                payload.referralCode = data.referralCode.toUpperCase();
            }
            const response = await api.post("/auth/signup", payload);
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
        <div className="flex items-center justify-center min-h-screen bg-muted">
            <Card className="w-full max-w-sm">
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
                            <div className="flex flex-col space-y-1.5">
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Referral code (optional)"
                                        className="pl-9 uppercase"
                                        {...register("referralCode")}
                                        onBlur={(e) => checkReferralCode(e.target.value)}
                                        onChange={(e) => {
                                            setValue("referralCode", e.target.value.toUpperCase());
                                            if (referralStatus !== "idle") setReferralStatus("idle");
                                        }}
                                    />
                                    {referralStatus === "valid" && (
                                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                                    )}
                                    {referralStatus === "invalid" && (
                                        <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                                    )}
                                </div>
                                {referralStatus === "valid" && referrerName && (
                                    <p className="text-sm text-green-600">Referred by {referrerName}</p>
                                )}
                                {referralStatus === "invalid" && (
                                    <p className="text-sm text-red-500">Invalid referral code</p>
                                )}
                            </div>
                        </div>
                        <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <LoadingSpinner size="sm" /> : "Register"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
