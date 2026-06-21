import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export default function RecruitmentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [skillNeeded, setSkillNeeded] = useState("");
    const [countNeeded, setCountNeeded] = useState(1);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!skillNeeded.trim()) {
            toast.error("Enter a skill needed");
            return;
        }
        try {
            setSubmitting(true);
            await api.post(`/zone-manager/zones/${id}/recruit`, {
                skillNeeded: skillNeeded.trim(),
                countNeeded,
                reason: reason.trim() || undefined,
            });
            toast.success("Recruitment request submitted!");
            navigate(`/zones/${id}`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to submit");
            logger.error("Recruitment failed:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={() => navigate(`/zones/${id}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h1 className="text-2xl font-bold">Recruit Workers</h1>

            <Card>
                <CardContent className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Skill Needed</Label>
                            <Input value={skillNeeded} onChange={(e) => setSkillNeeded(e.target.value)} placeholder="e.g. Electrician" className="h-12" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Count</Label>
                            <Input type="number" min={1} max={50} value={countNeeded} onChange={(e) => setCountNeeded(parseInt(e.target.value) || 1)} className="h-12" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Reason (optional)</Label>
                            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. High demand" className="h-12" />
                        </div>
                        <Button type="submit" disabled={submitting} className="w-full h-12">
                            {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Submit Request
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
