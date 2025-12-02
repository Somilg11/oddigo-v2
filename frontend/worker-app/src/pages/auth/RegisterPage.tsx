import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    serviceType: z.string().min(2, "Service Type is required"),
    hourlyRate: z.string().min(1, "Hourly rate is required"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            const payload = { ...data, hourlyRate: Number(data.hourlyRate) };
            const response = await api.post("/auth/register/worker", payload);
            const { worker, token } = response.data.data;
            setAuth(worker, token);
            localStorage.setItem("worker_token", token);
            navigate("/");
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Worker Registration</CardTitle>
                    <CardDescription>Join our platform as a service provider.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid w-full items-center gap-4">
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
                                <Input placeholder="Service Type (e.g., Plumber)" {...register("serviceType")} />
                                {errors.serviceType && <span className="text-red-500 text-sm">{errors.serviceType.message}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Input type="number" placeholder="Hourly Rate ($)" {...register("hourlyRate")} />
                                {errors.hourlyRate && <span className="text-red-500 text-sm">{errors.hourlyRate.message}</span>}
                            </div>
                        </div>
                        <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Registering..." : "Register"}
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
