import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState } from "react";
import { ArrowLeft, IndianRupee } from "lucide-react";

export default function EstimateFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [visitCharge, setVisitCharge] = useState("");
    const [labourCost, setLabourCost] = useState("");
    const [partsCost, setPartsCost] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const total = (Number(visitCharge) || 0) + (Number(labourCost) || 0) + (Number(partsCost) || 0);

    const handleSubmit = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(`/jobs/${id}/estimate`, {
                visitCharge: Number(visitCharge) || 0,
                labourCost: Number(labourCost) || 0,
                partsCost: Number(partsCost) || 0,
                totalEstimate: total,
                notes: notes || undefined,
            });
            navigate(`/jobs/${id}/active`);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to submit estimate.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Submit Estimate</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" /> Cost Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Visit Charge (₹)</label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={visitCharge}
                            onChange={(e) => setVisitCharge(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Labour Cost (₹)</label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={labourCost}
                            onChange={(e) => setLabourCost(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Parts Cost (₹)</label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={partsCost}
                            onChange={(e) => setPartsCost(e.target.value)}
                        />
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold text-lg">
                        <span>Total Estimate</span>
                        <span>₹{total}</span>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Notes (optional)</label>
                        <Textarea
                            placeholder="Any additional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                            {error}
                        </div>
                    )}
                    <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                        {loading ? <LoadingSpinner size="sm" /> : "Submit Estimate"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
