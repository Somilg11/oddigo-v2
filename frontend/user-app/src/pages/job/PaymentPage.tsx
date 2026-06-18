import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, CreditCard, Smartphone, Banknote } from "lucide-react";
import type { PaymentMethod } from "@/types";

const methods: { value: PaymentMethod; label: string; icon: typeof CreditCard; description: string }[] = [
    { value: "UPI", label: "UPI", icon: Smartphone, description: "Pay via Google Pay, PhonePe, etc." },
    { value: "CARD", label: "Card", icon: CreditCard, description: "Credit or Debit card" },
    { value: "CASH", label: "Cash", icon: Banknote, description: "Pay in cash to the worker" },
];

export default function PaymentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selected, setSelected] = useState<PaymentMethod | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePay = async () => {
        if (!selected || !id) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(`/jobs/${id}/pay`, { paymentMethod: selected });
            navigate(`/job/${id}/rate`);
        } catch (err: any) {
            setError(err.response?.data?.message || "Payment failed.");
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Payment</h1>

            <div className="space-y-3 mb-6">
                {methods.map((m) => {
                    const Icon = m.icon;
                    return (
                        <Card
                            key={m.value}
                            className={`cursor-pointer transition-colors ${selected === m.value ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}
                            onClick={() => setSelected(m.value)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selected === m.value ? "bg-primary text-white" : "bg-gray-100"}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">{m.label}</p>
                                    <p className="text-xs text-gray-500">{m.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                    {error}
                </div>
            )}

            <Button className="w-full" size="lg" onClick={handlePay} disabled={!selected || loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Pay Now"}
            </Button>
        </div>
    );
}
