import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { ArrowLeft, Copy, Share2, Users, Check } from "lucide-react";
import { toast } from "sonner";

interface ReferredUser {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
}

interface ReferralInfo {
    referralCode: string;
    totalReferred: number;
    referredUsers: ReferredUser[];
}

export default function ReferPage() {
    const navigate = useNavigate();
    const [info, setInfo] = useState<ReferralInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const response = await api.get("/users/me/referral");
            const data = extractData<ReferralInfo>(response);
            setInfo(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load referral info";
            setError(message);
            logger.error("Failed to fetch referral info", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const copyCode = async () => {
        if (!info?.referralCode) return;
        await navigator.clipboard.writeText(info.referralCode);
        setCopied(true);
        toast.success("Referral code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLink = () => {
        const url = `${window.location.origin}/register?ref=${info?.referralCode}`;
        if (navigator.share) {
            navigator.share({
                title: "Join Oddigo",
                text: `Use my referral code ${info?.referralCode} to sign up on Oddigo!`,
                url,
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Invite link copied!");
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
        return <PageError message={error} onRetry={() => { setError(null); setLoading(true); fetchData(); }} />;
    }

    return (
        <div className="p-4 max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Refer & Earn</h1>
            </div>

            {/* Referral Code Card */}
            <Card className="bg-gradient-to-br from-foreground to-foreground/90 text-background">
                <CardContent className="p-6 text-center">
                    <p className="text-background/70 text-sm mb-2">Your Referral Code</p>
                    <p className="text-3xl font-mono font-bold tracking-widest">{info?.referralCode}</p>
                    <p className="text-background/60 text-sm mt-2">Share with friends & earn 2,000 points (₹20) when they complete their first job</p>
                    <div className="flex gap-3 mt-4 justify-center">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={copyCode}
                            className="gap-2"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied" : "Copy Code"}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={shareLink}
                            className="gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            Share Link
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <Card>
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{info?.totalReferred || 0}</p>
                        <p className="text-sm text-muted-foreground">Friends referred</p>
                    </div>
                </CardContent>
            </Card>

            {/* How it Works */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">How it Works</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                            <p>Share your referral code with friends</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                            <p>They sign up using your code</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                            <p>When they complete their first job, you both earn points</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Referred Users List */}
            {info?.referredUsers && info.referredUsers.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-3">Referred Friends</h3>
                    <div className="space-y-2">
                        {info.referredUsers.map((user) => (
                            <Card key={user._id}>
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground shrink-0">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
