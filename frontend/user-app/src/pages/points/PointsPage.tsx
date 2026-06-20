import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import type { UserPoints, PointTransaction } from "@/types";
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Gift, Star, Shield, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function PointsPage() {
    const navigate = useNavigate();
    const [points, setPoints] = useState<UserPoints | null>(null);
    const [transactions, setTransactions] = useState<PointTransaction[]>([]);
    const [referralCode, setReferralCode] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [pointsRes, referralRes] = await Promise.all([
                api.get("/users/me/points"),
                api.get("/users/me/referral"),
            ]);
            const pData = extractData<{ points: UserPoints; recentTransactions: PointTransaction[] }>(pointsRes);
            setPoints(pData.points);
            setTransactions(pData.recentTransactions);
            const rData = extractData<{ referralCode: string }>(referralRes);
            setReferralCode(rData.referralCode || "");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load points";
            setError(message);
            logger.error("Failed to fetch points", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const copyCode = async () => {
        if (!referralCode) return;
        await navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast.success("Referral code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLink = () => {
        const url = `${window.location.origin}/register?ref=${referralCode}`;
        if (navigator.share) {
            navigator.share({
                title: "Join Oddigo",
                text: `Use my referral code ${referralCode} to sign up on Oddigo!`,
                url,
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Invite link copied!");
        }
    };

    const getTransactionIcon = (type: PointTransaction["type"]) => {
        switch (type) {
            case "EARNED": return <TrendingUp className="h-4 w-4 text-green-600" />;
            case "REDEEMED": return <TrendingDown className="h-4 w-4 text-red-600" />;
            case "EXPIRED": return <TrendingDown className="h-4 w-4 text-muted-foreground" />;
            default: return <Coins className="h-4 w-4 text-blue-600" />;
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
                <h1 className="text-2xl font-bold">My Points</h1>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-foreground to-foreground/90 text-background">
                <CardContent className="p-6 text-center">
                    <Coins className="h-10 w-10 mx-auto mb-2 text-background/80" />
                    <p className="text-4xl font-bold">{points?.balance || 0}</p>
                    <p className="text-background/70 mt-1">Available Points</p>
                    <p className="text-sm text-background/60 mt-2">≈ ₹{Math.floor((points?.balance || 0) / 100)} value</p>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="p-4 text-center">
                        <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
                        <p className="text-lg font-bold">{points?.lifetimeEarned || 0}</p>
                        <p className="text-xs text-muted-foreground">Lifetime Earned</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-600" />
                        <p className="text-lg font-bold">{points?.lifetimeRedeemed || 0}</p>
                        <p className="text-xs text-muted-foreground">Lifetime Redeemed</p>
                    </CardContent>
                </Card>
            </div>

            {/* How it Works */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">How to Earn Points</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500 shrink-0" />
                            <span>Complete a job — earn 10% as points</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-purple-500 shrink-0" />
                            <span>First booking bonus — 1,000 points (₹10)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Refer a friend — earn 2,000 points (₹20)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                            <span>5-star rating bonus — 50 points (₹0.50)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Referral Code Card */}
            {referralCode && (
                <Card className="border border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Refer & Earn</h3>
                            <span className="text-xs text-muted-foreground">2,000 pts per referral</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Your Code</p>
                                <p className="text-lg font-mono font-bold tracking-widest">{referralCode}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button size="sm" variant="outline" onClick={copyCode} className="gap-1">
                                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                                <Button size="sm" onClick={shareLink} className="gap-1">
                                    <Share2 className="h-3 w-3" /> Share
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Transactions */}
            <div>
                <h3 className="font-semibold mb-3">Recent Activity</h3>
                {transactions.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground text-sm">
                            No points activity yet. Complete a job to start earning!
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {transactions.map(tx => (
                            <Card key={tx._id}>
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        {getTransactionIcon(tx.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{tx.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`text-sm font-semibold shrink-0 ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
