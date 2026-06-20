import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, Star } from "lucide-react";

export default function RatingPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [review, setReview] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!id || rating === 0) return;
        setLoading(true);
        setError(null);
        try {
            await api.post(`/ratings/jobs/${id}/rate`, { rating, review: review || undefined });
            setSubmitted(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to submit rating.";
            setError(message);
            setLoading(false);
            logger.error("Failed to submit rating", err);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Star className="h-8 w-8 text-green-600 fill-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Thank You!</h2>
                <p className="text-muted-foreground text-center mb-6">Your rating has been submitted.</p>
                <Button onClick={() => navigate("/")}>Back to Home</Button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-2">Rate Your Experience</h1>
            <p className="text-muted-foreground mb-6">How was the service?</p>

            <Card className="mb-6">
                <CardContent className="py-8">
                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHovered(star)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={`h-10 w-10 transition-colors ${
                                        star <= (hovered || rating)
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-300"
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        {rating === 0 && "Tap a star to rate"}
                        {rating === 1 && "Poor"}
                        {rating === 2 && "Fair"}
                        {rating === 3 && "Good"}
                        {rating === 4 && "Very Good"}
                        {rating === 5 && "Excellent"}
                    </p>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base">Write a Review (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Tell us about your experience..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={4}
                    />
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                    {error}
                </div>
            )}

            <Button className="w-full" onClick={handleSubmit} disabled={rating === 0 || loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Submit Rating"}
            </Button>
        </div>
    );
}
