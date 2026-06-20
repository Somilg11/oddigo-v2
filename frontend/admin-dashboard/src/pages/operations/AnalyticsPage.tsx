import { useEffect, useState } from "react";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Coins, Tag,
  Percent, ArrowRight, Minus,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
} from "recharts";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface OverviewData {
  totalUsers: number; totalJobs: number; totalWorkers: number; activeWorkers: number;
  gmv: number; monthlyRevenue: number; monthlyJobs: number;
}

interface ReferralData {
  totalUsers: number; referredUsers: number; referralRate: number;
  topReferrers: { name: string; email: string; count: number }[];
  monthlyReferrals: { _id: string; count: number }[];
}

interface PointsData {
  totalPointsEarned: number; totalPointsRedeemed: number; totalPointsBalance: number;
  totalDiscountRupees: number; usersWithPoints: number; totalRedemptionTransactions: number;
  uniqueRedeemers: number;
  earnedByType: { _id: string; count: number; totalPoints: number }[];
  monthlyRedemptions: { _id: string; count: number; totalPoints: number }[];
}

interface CouponData {
  totalCoupons: number; activeCoupons: number; totalCouponRedemptions: number; totalCouponDiscount: number;
  topCoupons: { code: string; description: string; type: string; value: number; usageCount: number; usageLimit?: number; isActive: boolean }[];
  couponTypeBreakdown: { _id: string; count: number; totalUsage: number }[];
  monthlyCouponUsage: { _id: string; count: number; totalDiscount: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-IN", {
    month: "short", year: "numeric",
  });
};

const formatRupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// ─── MiniLineChart ───────────────────────────────────────────────────────────

function MiniLineChart({ data, color = "#22c55e" }: { data: { label: string; value: number }[]; color?: string }) {
  if (!data.length) return null;
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── AreaGradientChart ───────────────────────────────────────────────────────

function AreaGradientChart({
  data, dataKey, color, gradientId, xKey = "label", emptyText = "No data yet",
}: {
  data: { [key: string]: string | number }[];
  dataKey: string;
  color: string;
  gradientId: string;
  xKey?: string;
  emptyText?: string;
}) {
  if (!data.length) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground text-sm">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, className }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
          {icon} {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [referrals, setReferrals] = useState<ReferralData | null>(null);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [coupons, setCoupons] = useState<CouponData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setError(null);
      const [ov, ref, pt, cp] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/analytics/referrals"),
        api.get("/admin/analytics/points"),
        api.get("/admin/analytics/coupons"),
      ]);
      setOverview(extractData<OverviewData>(ov));
      setReferrals(extractData<ReferralData>(ref));
      setPoints(extractData<PointsData>(pt));
      setCoupons(extractData<CouponData>(cp));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch analytics";
      setError(message);
      logger.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <PageError message={error} onRetry={fetchAll} />;
  }

  // Derived values for P&L card
  const totalRevenue = overview?.gmv ?? 0;
  const totalPointsDiscount = points?.totalDiscountRupees ?? 0;
  const totalCouponDiscount = coupons?.totalCouponDiscount ?? 0;
  const netRevenue = totalRevenue - totalPointsDiscount - totalCouponDiscount;

  // Chart data
  const referralChartData = referrals?.monthlyReferrals?.map((m) => ({
    label: formatMonth(m._id), value: m.count,
  })) ?? [];

  const pointsChartData = points?.monthlyRedemptions?.map((m) => ({
    label: formatMonth(m._id), value: m.totalPoints, discount: Math.floor(m.totalPoints / 100),
  })) ?? [];

  const couponChartData = coupons?.monthlyCouponUsage?.map((m) => ({
    label: formatMonth(m._id), value: m.count, discount: m.totalDiscount,
  })) ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* ─── Profit & Loss Summary ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Profit & Loss Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<TrendingUp className="h-4 w-4 text-green-600" />} label="Total Revenue" value={formatRupee(totalRevenue)} sub="Gross Merchandise Value" />
            <StatCard icon={<TrendingDown className="h-4 w-4 text-red-500" />} label="Points Discount" value={`-${formatRupee(totalPointsDiscount)}`} sub="Company liability (points)" />
            <StatCard icon={<TrendingDown className="h-4 w-4 text-red-500" />} label="Coupon Discount" value={`-${formatRupee(totalCouponDiscount)}`} sub="Company liability (coupons)" />
            <StatCard
              icon={netRevenue >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              label="Net Revenue"
              value={`${netRevenue >= 0 ? "" : "-"}${formatRupee(Math.abs(netRevenue))}`}
              sub="Revenue - All Discounts"
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Overview Stats ─────────────────────────────────────── */}
      <section>
        <SectionHeader icon={<BarChart3 className="h-4 w-4" />} title="Overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<DollarSign className="h-4 w-4" />} label="Total Revenue" value={`₹${overview?.gmv?.toLocaleString() ?? 0}`} />
          <StatCard icon={<BarChart3 className="h-4 w-4" />} label="Total Jobs" value={overview?.totalJobs ?? 0} />
          <StatCard icon={<Users className="h-4 w-4" />} label="Total Workers" value={overview?.totalWorkers ?? 0} sub={`${overview?.activeWorkers ?? 0} online`} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Monthly Revenue" value={`₹${overview?.monthlyRevenue?.toLocaleString() ?? 0}`} sub={`${overview?.monthlyJobs ?? 0} jobs this month`} />
        </div>
      </section>

      {/* ─── Referral Analytics ──────────────────────────────────── */}
      <section>
        <SectionHeader icon={<Users className="h-4 w-4" />} title="Referral Analytics" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <StatCard icon={<Users className="h-4 w-4" />} label="Total Customers" value={referrals?.totalUsers ?? 0} />
          <StatCard icon={<ArrowRight className="h-4 w-4" />} label="Referred Users" value={referrals?.referredUsers ?? 0} sub={`${referrals?.referralRate ?? 0}% of total`} />
          <StatCard icon={<Percent className="h-4 w-4" />} label="Referral Rate" value={`${referrals?.referralRate ?? 0}%`} />
        </div>

        {/* Monthly Referrals Chart */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Monthly Referrals Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaGradientChart data={referralChartData} dataKey="value" color="#22c55e" gradientId="refGrad" emptyText="No referral data yet. Referrals will appear here once users start inviting friends." />
          </CardContent>
        </Card>

        {/* Mini sparkline for referral velocity */}
        {referralChartData.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Referral Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniLineChart data={referralChartData} color="#22c55e" />
            </CardContent>
          </Card>
        )}

        {/* Top Referrers */}
        {referrals?.topReferrers && referrals.topReferrers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Referrers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {referrals.topReferrers.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-medium">{r.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">{r.email}</span>
                      </div>
                    </div>
                    <span className="font-semibold">{r.count} referrals</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ─── Points Analytics ────────────────────────────────────── */}
      <section>
        <SectionHeader icon={<Coins className="h-4 w-4" />} title="Points Expenditure" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard icon={<Coins className="h-4 w-4" />} label="Total Points Earned" value={points?.totalPointsEarned?.toLocaleString() ?? 0} />
          <StatCard icon={<Coins className="h-4 w-4" />} label="Total Points Redeemed" value={points?.totalPointsRedeemed?.toLocaleString() ?? 0} />
          <StatCard icon={<DollarSign className="h-4 w-4" />} label="Discount Given" value={`₹${points?.totalDiscountRupees?.toLocaleString() ?? 0}`} sub="Company liability" />
          <StatCard icon={<Users className="h-4 w-4" />} label="Users Who Redeemed" value={points?.uniqueRedeemers ?? 0} sub={`out of ${points?.usersWithPoints ?? 0} with points`} />
        </div>

        {/* Monthly Redemptions Chart */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Monthly Points Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-sm text-muted-foreground">
              Total points redeemed per month
            </div>
            <AreaGradientChart data={pointsChartData} dataKey="value" color="#ef4444" gradientId="pointsGrad" emptyText="No redemptions yet. Points usage will appear here once users redeem points." />
          </CardContent>
        </Card>

        {/* Points sparkline */}
        {pointsChartData.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Redemption Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniLineChart data={pointsChartData.map((d) => ({ label: d.label, value: d.discount }))} color="#ef4444" />
            </CardContent>
          </Card>
        )}

        {/* Earned by Type */}
        {points?.earnedByType && points.earnedByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Points Earned By Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {points.earnedByType.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <span className="truncate max-w-[60%] font-medium">{t._id || "Unknown"}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{t.count.toLocaleString()} txns</span>
                      <span className="font-semibold text-emerald-600">{t.totalPoints.toLocaleString()} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ─── Coupon Analytics ────────────────────────────────────── */}
      <section>
        <SectionHeader icon={<Tag className="h-4 w-4" />} title="Coupon Analytics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard icon={<Tag className="h-4 w-4" />} label="Total Coupons" value={coupons?.totalCoupons ?? 0} sub={`${coupons?.activeCoupons ?? 0} active`} />
          <StatCard icon={<Tag className="h-4 w-4" />} label="Coupon Redemptions" value={coupons?.totalCouponRedemptions ?? 0} sub="jobs used a coupon" />
          <StatCard icon={<DollarSign className="h-4 w-4" />} label="Total Coupon Discount" value={`₹${coupons?.totalCouponDiscount?.toLocaleString() ?? 0}`} sub="Company liability" />
          <StatCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Avg Discount/Use"
            value={`₹${coupons?.totalCouponRedemptions ? Math.round(coupons.totalCouponDiscount / coupons.totalCouponRedemptions) : 0}`}
          />
        </div>

        {/* Monthly Coupon Usage Chart */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Monthly Coupon Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaGradientChart data={couponChartData} dataKey="discount" color="#f97316" gradientId="couponGrad" emptyText="No coupon usage yet. Coupon data will appear here once customers use coupons." />
          </CardContent>
        </Card>

        {/* Coupon sparkline */}
        {couponChartData.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Coupon Use Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniLineChart data={couponChartData.map((d) => ({ label: d.label, value: d.value }))} color="#ef4444" />
            </CardContent>
          </Card>
        )}

        {/* Coupon Type Breakdown */}
        {coupons?.couponTypeBreakdown && coupons.couponTypeBreakdown.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Coupon Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {coupons.couponTypeBreakdown.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <span className="font-medium">{t._id}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{t.count} coupons</span>
                      <span className="font-semibold">{t.totalUsage.toLocaleString()} uses</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Coupons */}
        {coupons?.topCoupons && coupons.topCoupons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Coupons by Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {coupons.topCoupons.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-mono font-semibold text-primary">{c.code}</span>
                        <span className="text-muted-foreground text-xs ml-2 truncate max-w-[200px]">{c.description}</span>
                        {!c.isActive && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                            inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground text-xs">
                        {c.type === "PERCENTAGE" ? `${c.value}%` : `₹${c.value}`}
                      </span>
                      <span className="font-semibold">{c.usageCount.toLocaleString()} uses</span>
                      {c.usageLimit && (
                        <span className="text-muted-foreground text-xs">/ {c.usageLimit.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
