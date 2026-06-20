import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import type { Job } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useJobStore } from "@/store/job.store";
import { AlertTriangle, CheckCircle, IndianRupee } from "lucide-react";

export default function AIDisplayPage() {
    const navigate = useNavigate();
    const { subService, issuePhotos, issueVideos, voiceNote, customIssue, setCreatedJob } = useJobStore();
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const createJob = async () => {
            try {
                let coordinates: [number, number] = [0, 0];
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                    );
                    coordinates = [pos.coords.longitude, pos.coords.latitude];
                } catch {}

                const response = await api.post("/jobs", {
                    serviceType: subService?.category && typeof subService.category === 'object'
                        ? subService.category.slug
                        : subService?.slug || "",
                    subService: subService?._id,
                    location: { type: "Point", coordinates },
                    photos: issuePhotos,
                    videos: issueVideos,
                    voiceNote: voiceNote || undefined,
                    customIssue: customIssue || undefined,
                });
                const job = extractData<Job>(response);
                setCreatedJob(job);
                setAnalysis(job.aiAnalysis || null);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to analyze issue. Please try again.";
                setError(message);
                logger.error("Failed to create job and analyze issue", err);
            } finally {
                setLoading(false);
            }
        };
        createJob();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 font-medium">Analyzing your issue...</p>
                <p className="text-sm text-muted-foreground">Our AI is examining the photos and details</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 max-w-2xl mx-auto py-20 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">AI Analysis</h1>
            <p className="text-muted-foreground mb-6">Based on the photos and details you provided</p>

            {analysis ? (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Problem Identified
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium text-lg">{analysis.problemType}</p>
                            <p className="text-sm text-muted-foreground mt-1">Confidence: {Math.round((analysis.confidence || 0) * 100)}%</p>
                        </CardContent>
                    </Card>

                    {analysis.possibleCauses?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Possible Causes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {analysis.possibleCauses.map((cause: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="text-primary mt-0.5">•</span>
                                            {cause}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {analysis.estimatedCostRange && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <IndianRupee className="h-5 w-5" />
                                    Estimated Cost Range
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">
                                    ₹{analysis.estimatedCostRange.low} - ₹{analysis.estimatedCostRange.high}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {analysis.reasoning && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Reasoning</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">{analysis.reasoning}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No AI analysis available for this issue.
                    </CardContent>
                </Card>
            )}

            <Button className="w-full mt-6" size="lg" onClick={() => navigate("/booking/matching")}>
                Find Workers
            </Button>
        </div>
    );
}
