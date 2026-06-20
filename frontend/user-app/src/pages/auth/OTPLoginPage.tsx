import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
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

const emailSchema = z.object({
    email: z.string().email("Invalid email address"),
});
type EmailFormValues = z.infer<typeof emailSchema>;

const otpSchema = z.object({
    code: z.string().length(6, "OTP must be 6 digits"),
});
type OtpFormValues = z.infer<typeof otpSchema>;

export default function OTPLoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [step, setStep] = useState<"email" | "otp">("email");
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailSchema),
    });

    const otpForm = useForm<OtpFormValues>({
        resolver: zodResolver(otpSchema),
    });

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const onRequestOtp = async (data: EmailFormValues) => {
        try {
            setError(null);
            await api.post("/auth/request-otp", { email: data.email });
            setEmail(data.email);
            setStep("otp");
            setCooldown(60);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to send OTP. Please try again.";
            setError(message);
            logger.error("Failed to send OTP", err);
        }
    };

    const onVerifyOtp = async (data: OtpFormValues) => {
        try {
            setError(null);
            const response = await api.post("/auth/verify-otp", { email, code: data.code });
            const { user, accessToken, refreshToken } = extractData<{ user: User; accessToken: string; refreshToken: string }>(response);
            setAuth(user, accessToken);
            localStorage.setItem("oddigo_refresh_token", refreshToken);
            navigate("/");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Invalid OTP. Please try again.";
            setError(message);
            logger.error("OTP verification failed", err);
        }
    };

    const onResend = async () => {
        try {
            setError(null);
            await api.post("/auth/request-otp", { email });
            setCooldown(60);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to resend OTP.";
            setError(message);
            logger.error("Failed to resend OTP", err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>{step === "email" ? "OTP Login" : "Enter OTP"}</CardTitle>
                    <CardDescription>
                        {step === "email"
                            ? "Enter your email to receive a one-time password."
                            : `We sent a 6-digit code to ${email}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                            {error}
                        </div>
                    )}

                    {step === "email" ? (
                        <form onSubmit={emailForm.handleSubmit(onRequestOtp)}>
                            <div className="grid w-full items-center gap-4">
                                <div className="flex flex-col space-y-1.5">
                                    <Input placeholder="Email" {...emailForm.register("email")} />
                                    {emailForm.formState.errors.email && (
                                        <span className="text-red-500 text-sm">
                                            {emailForm.formState.errors.email.message}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button className="w-full mt-4" type="submit" disabled={emailForm.formState.isSubmitting}>
                                {emailForm.formState.isSubmitting ? <LoadingSpinner size="sm" /> : "Send OTP"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={otpForm.handleSubmit(onVerifyOtp)}>
                            <div className="grid w-full items-center gap-4">
                                <div className="flex flex-col space-y-1.5">
                                    <Input
                                        placeholder="6-digit OTP"
                                        maxLength={6}
                                        {...otpForm.register("code")}
                                    />
                                    {otpForm.formState.errors.code && (
                                        <span className="text-red-500 text-sm">
                                            {otpForm.formState.errors.code.message}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button className="w-full mt-4" type="submit" disabled={otpForm.formState.isSubmitting}>
                                {otpForm.formState.isSubmitting ? <LoadingSpinner size="sm" /> : "Verify OTP"}
                            </Button>
                            <div className="mt-3 text-center">
                                <button
                                    type="button"
                                    onClick={onResend}
                                    disabled={cooldown > 0}
                                    className="text-sm text-blue-500 hover:underline disabled:text-muted-foreground disabled:cursor-not-allowed"
                                >
                                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Link to="/login" className="text-sm text-muted-foreground hover:underline">
                        Back to password login
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Register</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
