import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractList } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { WorkerProfile } from "@/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { useJobStore } from "@/store/job.store";
import { Search } from "lucide-react";

export default function WorkerMatchingPage() {
    const navigate = useNavigate();
    const { createdJob, setMatchedWorkers } = useJobStore();
    const [dots, setDots] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!createdJob?._id) {
            navigate("/services");
            return;
        }

        const findWorkers = async () => {
            try {
                const response = await api.post(`/jobs/${createdJob._id}/find-workers`);
                const workers = extractList<WorkerProfile>(response);
                setMatchedWorkers(workers);
                navigate("/booking/workers");
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to find workers";
                setError(message);
                logger.error("Failed to find workers", err);
                navigate("/booking/workers");
            }
        };

        const timer = setTimeout(findWorkers, 3000);
        return () => clearTimeout(timer);
    }, [createdJob, navigate, setMatchedWorkers]);

    if (error) {
        return <PageError message={error} onRetry={() => navigate("/booking/workers")} />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <div className="relative mb-8">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <Search className="h-10 w-10 text-primary" />
                </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Finding Workers{dots}</h2>
            <p className="text-gray-500 text-center max-w-xs">
                We're searching for the best available workers near you
            </p>
            <LoadingSpinner size="lg" className="mt-8" />
        </div>
    );
}
