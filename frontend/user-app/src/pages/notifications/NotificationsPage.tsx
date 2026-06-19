import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractList } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import { ArrowLeft, Bell, Check } from "lucide-react";
import type { Notification } from "@/types";

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get("/notifications");
                setNotifications(extractList(response));
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load data";
                setError(message);
                logger.error("Failed to fetch notifications", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
        } catch (err: unknown) {
            logger.error("Failed to mark notification as read", err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <PageError message={error} onRetry={() => { setError(null); setLoading(true); window.location.reload(); }} />;
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-2xl font-bold mb-6">Notifications</h1>

            {notifications.length === 0 ? (
                <EmptyState
                    title="No notifications"
                    description="You're all caught up!"
                />
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <Card
                            key={n._id}
                            className={`cursor-pointer transition-colors ${!n.isRead ? "bg-primary/5 border-primary/20" : ""}`}
                            onClick={() => markAsRead(n._id)}
                        >
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? "bg-primary/10" : "bg-gray-100"}`}>
                                    <Bell className="h-4 w-4 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!n.isRead ? "font-medium" : ""}`}>{n.message || n.title || "Notification"}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                {!n.isRead && (
                                    <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
