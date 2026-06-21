import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Megaphone, Plus, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "@/types";

export default function CityCampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", city: "", startDate: "", endDate: "" });

    const fetchCampaigns = async () => {
        try {
            setError(null);
            const res = await api.get("/city-manager/campaigns");
            setCampaigns(extractData(res));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load campaigns");
            logger.error("Failed to fetch campaigns:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCampaigns(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.city.trim() || !form.startDate || !form.endDate) {
            toast.error("All fields are required");
            return;
        }
        try {
            setCreating(true);
            await api.post("/city-manager/campaigns", {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                city: form.city.trim(),
                startDate: form.startDate,
                endDate: form.endDate,
            });
            toast.success("Campaign created!");
            setShowCreate(false);
            setForm({ name: "", description: "", city: "", startDate: "", endDate: "" });
            fetchCampaigns();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to create");
        } finally {
            setCreating(false);
        }
    };

    const statusColors: Record<string, string> = {
        DRAFT: "bg-gray-100 text-gray-700",
        ACTIVE: "bg-green-100 text-green-700",
        PAUSED: "bg-yellow-100 text-yellow-700",
        COMPLETED: "bg-blue-100 text-blue-700",
    };

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} />;

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">Campaigns</h1>
                <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
                    {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
            </div>

            {showCreate && (
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleCreate} className="space-y-3">
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" className="h-12" />
                            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="h-12" />
                            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="h-12" />
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-12" />
                                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="h-12" />
                            </div>
                            <Button type="submit" disabled={creating} className="w-full h-12">
                                {creating ? <LoadingSpinner size="sm" /> : "Create Campaign"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {campaigns.length === 0 ? (
                <EmptyState title="No campaigns" description="Create your first campaign." />
            ) : (
                campaigns.map((c) => (
                    <Card key={c._id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Megaphone className="h-4 w-4 text-primary" />
                                    <p className="font-medium">{c.name}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] || "bg-gray-100"}`}>
                                    {c.status}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{c.city}</p>
                            {c.description && <p className="text-sm text-muted-foreground mb-2">{c.description}</p>}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
