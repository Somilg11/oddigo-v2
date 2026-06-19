import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";
import { logger } from "@/lib/logger";

export function useWorkerSocket() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

    useEffect(() => {
        if (!token) return;

        const socket = getSocket(token);
        socketRef.current = socket;

        socket.on("job:offer", (data: { jobId: string }) => {
            navigate(`/jobs/${data.jobId}`);
        });

        socket.on("job:resume", (data: { jobId: string }) => {
            navigate(`/jobs/${data.jobId}/active`);
        });

        socket.on("job:rejected", (data: { jobId: string }) => {
            navigate(`/jobs/${data.jobId}/active`);
        });

        return () => {
            socket.off("job:offer");
            socket.off("job:resume");
            socket.off("job:rejected");
        };
    }, [token, navigate]);

    return socketRef;
}

export function useLocationUpdates(jobId: string | null) {
    const token = useAuthStore((state) => state.token);
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!token || !jobId) return;

        const socket = getSocket(token);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                socket.emit("update-location", {
                    lat: pos.coords.latitude,
                    long: pos.coords.longitude,
                    jobId,
                });
            },
            (err) => {
                logger.error("Location error:", err);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000,
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [token, jobId]);
}
