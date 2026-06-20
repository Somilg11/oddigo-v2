import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageError } from "@/components/common/PageError";
import { useJobStore } from "@/store/job.store";
import { useAuthStore } from "@/store/auth.store";
import type { ServiceCategory, Banner, Job } from "@/types";
import { Search, X, ChevronLeft, ChevronRight, Zap, Clock, Copy, Check } from "lucide-react";

export default function ServiceCategoriesPage() {
    const navigate = useNavigate();
    const setCategory = useJobStore((s) => s.setCategory);
    const user = useAuthStore((s) => s.user);

    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [recentJobs, setRecentJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem("oddigo_dismissed_alerts") || "[]"); } catch { return []; }
    });
    const [currentBanner, setCurrentBanner] = useState(0);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [catRes, bannerRes, jobRes] = await Promise.allSettled([
                api.get("/services/categories"),
                api.get("/services/banners/active"),
                api.get("/jobs/history"),
            ]);

            if (catRes.status === "fulfilled") setCategories(extractData(catRes.value));
            if (bannerRes.status === "fulfilled") setBanners(extractData(bannerRes.value));
            if (jobRes.status === "fulfilled") {
                const jobs = extractData<Job[]>(jobRes.value);
                setRecentJobs(jobs.slice(0, 3));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load data";
            setError(message);
            logger.error("Failed to fetch home page data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-rotate promotional banners
    const promoBanners = banners.filter(b => b.type === "PROMOTION" || b.type === "COUPON");
    useEffect(() => {
        if (promoBanners.length <= 1) return;
        bannerTimerRef.current = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % promoBanners.length);
        }, 4000);
        return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); };
    }, [promoBanners.length]);

    const announcementBanners = banners.filter(b =>
        b.type === "ANNOUNCEMENT" && !dismissedAlerts.includes(b._id)
    );

    const dismissAlert = (id: string) => {
        const updated = [...dismissedAlerts, id];
        setDismissedAlerts(updated);
        localStorage.setItem("oddigo_dismissed_alerts", JSON.stringify(updated));
    };

    const copyCouponCode = (text: string) => {
        const match = text.match(/[A-Z0-9]{4,}/i);
        if (match) {
            navigator.clipboard.writeText(match[0]);
            setCopiedCode(match[0]);
            setTimeout(() => setCopiedCode(null), 2000);
        }
    };

    const handleSelect = (cat: ServiceCategory) => {
        setCategory(cat);
        navigate(`/services/${cat._id}`);
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: Job["status"]) => {
        switch (status) {
            case "COMPLETED": return "text-green-600";
            case "IN_PROGRESS": case "ACCEPTED": return "text-blue-600";
            case "CREATED": case "MATCHING": return "text-amber-600";
            case "CANCELLED": case "CANCELLED_CHARGED": return "text-red-600";
            default: return "text-muted-foreground";
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
        <div className="max-w-4xl mx-auto">
            {/* Announcement Banners */}
            {announcementBanners.map(banner => (
                <div
                    key={banner._id}
                    className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-center justify-between gap-3"
                >
                    <div className="flex-1 min-w-0">
                        <span className="font-medium text-primary">{banner.title}</span>
                        {banner.subtitle && (
                            <span className="text-sm text-muted-foreground ml-2">{banner.subtitle}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {banner.type === "COUPON" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyCouponCode(banner.title + " " + (banner.subtitle || ""))}
                            >
                                {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                <span className="ml-1 text-xs">Copy</span>
                            </Button>
                        )}
                        <button onClick={() => dismissAlert(banner._id)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ))}

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-foreground to-foreground/90 text-background p-6 pb-8">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">
                        Hello, {user?.name?.split(" ")[0] || "there"}!
                    </h1>
                    <p className="text-background/80 mt-1">What can we help you with today?</p>
                </div>

                {/* Promotional Banner Carousel */}
                {promoBanners.length > 0 && (
                    <div className="relative bg-background/15 backdrop-blur-sm rounded-xl p-4 mt-4">
                        <div className="overflow-hidden rounded-lg">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                            >
                                {promoBanners.map((banner) => (
                                    <div key={banner._id} className="w-full shrink-0 px-2">
                                        <div className="flex items-center gap-3">
                                            {banner.imageUrl && (
                                                <img src={banner.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-background">{banner.title}</h3>
                                                {banner.subtitle && (
                                                    <p className="text-sm text-background/70 mt-0.5">{banner.subtitle}</p>
                                                )}
                                            </div>
                                            {banner.type === "COUPON" && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="shrink-0 bg-background/20 hover:bg-background/30 text-background border-0"
                                                    onClick={() => copyCouponCode(banner.title + " " + (banner.subtitle || ""))}
                                                >
                                                    {copiedCode ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                                                    Copy Code
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {promoBanners.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentBanner(prev => (prev - 1 + promoBanners.length) % promoBanners.length)}
                                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/30 rounded-full p-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentBanner(prev => (prev + 1) % promoBanners.length)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/30 rounded-full p-1"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <div className="flex justify-center gap-1.5 mt-3">
                                    {promoBanners.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentBanner(i)}
                                            className={`h-1.5 rounded-full transition-all ${i === currentBanner ? "w-6 bg-background" : "w-1.5 bg-background/40"}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Emergency Service Button */}
                <Button
                    className="w-full mt-4 bg-background text-foreground hover:bg-background/90 font-semibold"
                    size="lg"
                    onClick={() => navigate("/services")}
                >
                    <Zap className="h-5 w-5 mr-2" />
                    Emergency Service
                </Button>
            </div>

            <div className="px-4 -mt-2">
                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card shadow-sm"
                    />
                </div>

                {/* Recent Bookings */}
                {recentJobs.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-lg">Recent Bookings</h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/bookings")}>
                                View All
                            </Button>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                            {recentJobs.map(job => (
                                <Card
                                    key={job._id}
                                    className="min-w-[200px] shrink-0 cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => navigate(`/bookings/${job._id}`)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(job.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="font-medium text-sm truncate">{job.subServiceName || job.serviceType}</p>
                                        <p className={`text-xs font-medium mt-1 ${getStatusColor(job.status)}`}>
                                            {job.status.replace(/_/g, " ")}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Service Categories */}
                <div className="mb-6">
                    <h2 className="font-semibold text-lg mb-3">Choose a Service</h2>
                    {filteredCategories.length === 0 ? (
                        <p className="text-center text-muted-foreground py-12">
                            {searchQuery ? "No services match your search." : "No services available yet."}
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {filteredCategories.map((cat) => (
                                <Card
                                    key={cat._id}
                                    className="hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => handleSelect(cat)}
                                >
                                    <CardHeader className="text-center pb-2">
                                        <div className="text-4xl mb-2">{cat.icon || "🔧"}</div>
                                        <CardTitle className="text-sm">{cat.name}</CardTitle>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
