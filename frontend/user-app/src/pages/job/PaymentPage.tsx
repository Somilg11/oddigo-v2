import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, CreditCard, Smartphone, Banknote, Tag, Check, X } from "lucide-react";
import type { PaymentMethod, Job } from "@/types";

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
    const [job, setJob] = useState<Job | null>(null);
    const [fetchingJob, setFetchingJob] = useState(true);

    const [couponCode, setCouponCode] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchJob = async () => {
            try {
                const response = await api.get(`/jobs/${id}`);
                const jobData = extractData<Job>(response);
                setJob(jobData);
                if (jobData.couponCode && jobData.discount && jobData.discount > 0) {
                    setAppliedCoupon({ code: jobData.couponCode, discount: jobData.discount, description: "Coupon applied" });
                }
            } catch (err) {
                logger.error("Failed to fetch job", err);
            } finally {
                setFetchingJob(false);
            }
        };
        fetchJob();
    }, [id]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim() || !job) return;
        setCouponLoading(true);
        setCouponError(null);
        try {
            const amount = job.finalQuote || job.initialQuote;
            const response = await api.post("/coupons/validate", {
                code: couponCode.trim(),
                jobAmount: amount,
                categoryId: typeof job.subService === "object" ? job.subService?.category : undefined,
            });
            const result = extractData<{ code: string; discount: number; description: string; message: string }>(response);
            setAppliedCoupon(result);
            setCouponCode("");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Invalid coupon code";
            setCouponError(message);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError(null);
    };

    const handlePay = async () => {
        if (!selected || !id) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(`/jobs/${id}/pay`, { paymentMethod: selected });
            navigate(`/job/${id}/rate`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Payment failed.";
            setError(message);
            setLoading(false);
            logger.error("Payment failed", err);
        }
    };

    if (fetchingJob) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const baseAmount = job?.finalQuote || job?.initialQuote || 0;
    const existingDiscount = job?.discount || 0;
    const couponDiscount = appliedCoupon?.discount || 0;
    const totalDiscount = existingDiscount + couponDiscount;
    const finalAmount = Math.max(0, baseAmount - totalDiscount);

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Payment</h1>

            {/* Price Summary */}
            <Card className="mb-6">
                <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service charge</span>
                        <span>₹{baseAmount}</span>
                    </div>
                    {existingDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Coupon discount ({job?.couponCode})</span>
                            <span>-₹{existingDiscount}</span>
                        </div>
                    )}
                    {appliedCoupon && couponDiscount > 0 && !existingDiscount && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Coupon discount ({appliedCoupon.code})</span>
                            <span>-₹{couponDiscount}</span>
                        </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{finalAmount}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Coupon Input */}
            {!job?.couponCode && (
                <div className="mb-6">
                    {appliedCoupon ? (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                            <Tag className="h-4 w-4 text-green-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-800">{appliedCoupon.code}</p>
                                <p className="text-xs text-green-600">₹{appliedCoupon.discount} off</p>
                            </div>
                            <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-green-800">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Coupon code"
                                value={couponCode}
                                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                                className="font-mono"
                            />
                            <Button
                                variant="outline"
                                onClick={handleApplyCoupon}
                                disabled={!couponCode.trim() || couponLoading}
                            >
                                {couponLoading ? <LoadingSpinner size="sm" /> : "Apply"}
                            </Button>
                        </div>
                    )}
                    {couponError && (
                        <p className="text-sm text-destructive mt-1">{couponError}</p>
                    )}
                </div>
            )}

            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
                {methods.map((m) => {
                    const Icon = m.icon;
                    return (
                        <Card
                            key={m.value}
                            className={`cursor-pointer transition-colors ${selected === m.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => setSelected(m.value)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selected === m.value ? "bg-primary text-white" : "bg-muted"}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium">{m.label}</p>
                                    <p className="text-xs text-muted-foreground">{m.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm mb-4">
                    {error}
                </div>
            )}

            <Button className="w-full" size="lg" onClick={handlePay} disabled={!selected || loading}>
                {loading ? <LoadingSpinner size="sm" /> : `Pay ₹${finalAmount}`}
            </Button>
        </div>
    );
}
