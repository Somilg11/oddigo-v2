import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Wifi, WifiOff, Clock, Briefcase, Users } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LiveOperations, WorkerLocation } from "@/types";

export default function LiveOpsPage() {
    const [ops, setOps] = useState<LiveOperations | null>(null);
    const [workerLocations, setWorkerLocations] = useState<WorkerLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);

    const fetchData = async () => {
        try {
            setError(null);
            const [opsRes, locRes] = await Promise.all([
                api.get("/admin/operations/live"),
                api.get("/admin/operations/worker-locations"),
            ]);
            setOps(extractData(opsRes));
            setWorkerLocations(extractData(locRes));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch live operations";
            setError(message);
            logger.error("Failed to fetch live operations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
            center: [77.209, 28.6139],
            zoom: 11,
        });

        map.addControl(new maplibregl.NavigationControl(), "top-right");
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        workerLocations.forEach((w) => {
            if (!w.lastLocation) return;
            const [lng, lat] = w.lastLocation.coordinates;
            const color = w.status === "busy" ? "#eab308" : "#22c55e";

            const el = document.createElement("div");
            el.className = "worker-marker";
            el.style.cssText = `
                width: 24px; height: 24px; border-radius: 50%;
                background: ${color}; border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                cursor: pointer;
            `;

            const name = typeof w.user === "object" && w.user ? w.user.name : "Worker";

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([lng, lat])
                .setPopup(
                    new maplibregl.Popup({ offset: 15 }).setHTML(
                        `<div style="padding:4px 0">
                            <strong>${name}</strong><br/>
                            <span style="color:${color};font-size:12px">${w.status === "busy" ? "Busy" : "Available"}</span>
                        </div>`
                    )
                )
                .addTo(mapRef.current!);

            markersRef.current.push(marker);
        });
    }, [workerLocations]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={fetchData} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Live Operations</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Auto-refreshing every 30s
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-4 w-4" /> Active Jobs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{ops?.activeJobs || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Pending Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{ops?.pendingRequests || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                            <Wifi className="h-4 w-4 text-green-600" /> Workers Online
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{ops?.workersOnline || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" /> Workers Busy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{ops?.workersBusy || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Worker Locations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div ref={mapContainer} className="h-[400px] w-full" />
                    <div className="px-4 py-2 border-t flex gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500" /> Available
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Busy
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Worker Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm"><Wifi className="h-4 w-4 text-green-600" /> Online</span>
                            <span className="font-bold">{ops?.workersOnline || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm"><Briefcase className="h-4 w-4 text-blue-600" /> Busy</span>
                            <span className="font-bold">{ops?.workersBusy || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm"><WifiOff className="h-4 w-4 text-muted-foreground" /> Offline</span>
                            <span className="font-bold">{ops?.workersOffline || 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
