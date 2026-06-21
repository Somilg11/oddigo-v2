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
import { MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Zone } from "@/types";

export default function CityZonesPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: "", city: "", lat: "", long: "", radiusKm: "5" });

    const fetchZones = async () => {
        try {
            setError(null);
            const res = await api.get("/city-manager/zones");
            setZones(extractData(res));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load zones");
            logger.error("Failed to fetch zones:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchZones(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.city.trim()) {
            toast.error("Name and city are required");
            return;
        }
        try {
            setCreating(true);
            await api.post("/city-manager/zones", {
                name: form.name.trim(),
                city: form.city.trim(),
                center: { lat: parseFloat(form.lat) || 28.6139, long: parseFloat(form.long) || 77.209 },
                radiusKm: parseFloat(form.radiusKm) || 5,
            });
            toast.success("Zone created!");
            setShowCreate(false);
            setForm({ name: "", city: "", lat: "", long: "", radiusKm: "5" });
            fetchZones();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to create zone");
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} />;

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">Zones</h1>
                <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
                    {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
            </div>

            {showCreate && (
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleCreate} className="space-y-3">
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Zone name (e.g. Andheri West)" className="h-12" />
                            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City (e.g. Mumbai)" className="h-12" />
                            {form.name && form.city && (
                                <p className="text-xs text-muted-foreground">Will be saved as: <span className="font-medium text-foreground">{form.city} - {form.name}</span></p>
                            )}
                            <div className="grid grid-cols-3 gap-2">
                                <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="Lat" className="h-12" />
                                <Input value={form.long} onChange={(e) => setForm({ ...form, long: e.target.value })} placeholder="Lng" className="h-12" />
                                <Input value={form.radiusKm} onChange={(e) => setForm({ ...form, radiusKm: e.target.value })} placeholder="km" className="h-12" />
                            </div>
                            <Button type="submit" disabled={creating} className="w-full h-12">
                                {creating ? <LoadingSpinner size="sm" /> : "Create Zone"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {zones.length === 0 ? (
                <EmptyState title="No zones" description="Create your first zone." />
            ) : (
                zones.map((zone) => (
                    <Card key={zone._id}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{zone.name}</p>
                                <p className="text-sm text-muted-foreground">{zone.city} &middot; {zone.radiusKm} km</p>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
