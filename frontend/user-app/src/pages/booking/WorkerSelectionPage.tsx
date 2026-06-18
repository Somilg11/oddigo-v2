import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useJobStore } from "@/store/job.store";
import { Star, MapPin, ArrowLeft } from "lucide-react";
import type { WorkerProfile } from "@/types";

export default function WorkerSelectionPage() {
    const navigate = useNavigate();
    const { matchedWorkers, setSelectedWorker } = useJobStore();

    const handleSelect = (worker: WorkerProfile) => {
        setSelectedWorker(worker);
        navigate("/booking/confirm");
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-2">Available Workers</h1>
            <p className="text-gray-500 mb-6">{matchedWorkers.length} workers found nearby</p>

            {matchedWorkers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        No workers available at the moment. Please try again later.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {matchedWorkers.map((worker: WorkerProfile) => (
                        <Card
                            key={worker._id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleSelect(worker)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {worker.user?.name?.charAt(0) || "W"}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{worker.user?.name || "Worker"}</p>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                {worker.avgRating?.toFixed(1) || "N/A"}
                                            </span>
                                            <span>{worker.totalJobs || 0} jobs</span>
                                            {worker.lastLocation && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    Nearby
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Select
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
