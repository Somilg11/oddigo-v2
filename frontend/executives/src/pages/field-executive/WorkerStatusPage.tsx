import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, Star, Briefcase, Clock, Wifi, WifiOff } from "lucide-react";

interface WorkerStatusData {
    profile: {
        _id: string;
        user: { name: string; email: string; phone: string };
        isOnline: boolean;
        avgRating: number;
        totalJobs: number;
        skills: string[];
        verificationStatus: string;
    };
    activeJobs: number;
    completedJobsToday: number;
}

export default function WorkerStatusPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<WorkerStatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setError(null);
                const res = await api.get(`/field-executive/worker/${id}/status`);
                setData(extractData(res));
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load worker");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    if (error) return <PageError message={error} />;
    if (!data) return null;

    const { profile } = data;

    return (
        <div className="p-4 space-y-4">
            <button onClick={() => navigate("/workers")} className="flex items-center gap-1 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <Card>
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative">
                        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xl font-bold">{profile.user.name.charAt(0)}</span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${profile.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">{profile.user.name}</h1>
                        <p className="text-sm text-muted-foreground">{profile.user.phone}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            {profile.isOnline ? (
                                <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="h-3 w-3" /> Online</span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground"><WifiOff className="h-3 w-3" /> Offline</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="p-3 text-center">
                        <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                        <p className="text-xl font-bold">{profile.avgRating.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 text-center">
                        <Briefcase className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-xl font-bold">{profile.totalJobs}</p>
                        <p className="text-xs text-muted-foreground">Total Jobs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 text-center">
                        <Clock className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xl font-bold">{data.activeJobs}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 text-center">
                        <p className="text-xl font-bold text-green-600">{data.completedJobsToday}</p>
                        <p className="text-xs text-muted-foreground">Done Today</p>
                    </CardContent>
                </Card>
            </div>

            {profile.skills.length > 0 && (
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Skills</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill) => (
                                <span key={skill} className="px-2.5 py-1 rounded-full bg-muted text-xs">{skill}</span>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
