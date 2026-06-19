import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";

interface WorkerLocation {
    lat: number;
    long: number;
}

export function useActiveJobSocket(jobId: string | null) {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

    useEffect(() => {
        if (!token || !jobId) return;

        const socket = getSocket(token);
        socketRef.current = socket;

        socket.emit("join-job", { jobId });

        socket.on("job:accepted", (_data: { jobId: string }) => {
            navigate(`/job/${jobId}`);
        });

        socket.on("job:otp", (_data: { jobId: string }) => {
            navigate(`/job/${jobId}/otp`);
        });

        socket.on("job:estimate", (_data: { jobId: string }) => {
            navigate(`/job/${jobId}/approve-estimate`);
        });

        socket.on("job:price-approved", (_data: { jobId: string }) => {
            navigate(`/job/${jobId}`);
        });

        socket.on("job:scope-creep-request", (_data: { jobId: string }) => {
            navigate(`/job/${jobId}/approve-estimate`);
        });

        socket.on("job:warranty-issued", (_data: { jobId: string }) => {
            navigate(`/warranty/${jobId}`);
        });

        return () => {
            socket.off("job:accepted");
            socket.off("job:otp");
            socket.off("job:estimate");
            socket.off("job:price-approved");
            socket.off("job:scope-creep-request");
            socket.off("job:warranty-issued");
            socket.disconnect();
        };
    }, [token, jobId, navigate]);

    return socketRef;
}

export function useWorkerTracking(
    jobId: string | null,
    onLocationUpdate?: (location: WorkerLocation) => void
) {
    const token = useAuthStore((state) => state.token);
    const callbackRef = useRef(onLocationUpdate);
    callbackRef.current = onLocationUpdate;

    useEffect(() => {
        if (!token || !jobId) return;

        const socket = getSocket(token);

        socket.on("live-tracking", (data: { lat: number; long: number }) => {
            callbackRef.current?.({ lat: data.lat, long: data.long });
        });

        return () => {
            socket.off("live-tracking");
        };
    }, [token, jobId]);
}
