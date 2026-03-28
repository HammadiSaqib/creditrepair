import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { affiliateApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import AffiliateLayout from "@/components/AffiliateLayout";
import AffiliateLeaderboard from "@/components/AffiliateLeaderboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Timer,
  Crown,
  Link,
  BarChart3,
  Activity,
  Clock,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  CreditCard,
  Calendar,
  TrendingDown,
  Award,
} from "lucide-react";

interface EarningsStats {
  totalEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings?: number;
  totalReferrals?: number;
  pendingCommissions: number;
  paidCommissions: number;
  conversionRate: string | number;
  avgCommission: number;
  planType?: string;
  actualPlanName?: string;
  subscriptionStatus?: string;
  paidReferralsCount?: number;
  currentTierRate?: number;
  tierInfo?: {
    currentTier: string;
    nextTier: string;
    progressToNext: number;
    referralsToNext: number;
  };
  nonRenewalsCount?: number;
  lostCommissionAmount?: number;
  estimatedLostCommission?: number;
  atRiskReferrals?: number;
  pendingSignupCount?: number;
  churnedReferrals?: number;
  churnedCommission?: number;
  lastPayment?: { amount: number; date: string };
  nextPayment?: { date: string; status: string };
  paymentMethod?: string;
  totalEarningsChange?: { percentage: number; period: string };
  conversionRateChange?: { percentage: number; period: string };
  currentMonthReferralLeads?: number;
  currentMonthConversionCount?: number;
  currentMonthConversionRate?: number;
  currentMonthAverageCommission?: number;
  currentMonthPaidCommissionCount?: number;
  activePayingClients?: number;
  unpaidClients?: number;
  cancelledClients?: number;
  totalPayouts?: number;
  lastPayoutDate?: string | null;
  currentMRR?: number;
  mrrBase?: number;
}

interface RecentReferral {
  id: string;
  customerName: string;
  email: string;
  status: "pending" | "paid" | "cancelled" | "churned" | "unpaid";
  commission: number;
  dateReferred: string;
  conversionDate?: string;
  transactionId?: string;
  planName?: string;
  planValue?: number;
  subscriptionStatus?: string;
  isStripePaid?: boolean;
  lastPaymentDate?: string;
  lastTransactionId?: string;
}

// Animated count-up number component
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplay(0); return; }
    const duration = 900;
    const stepTime = 16;
    const steps = Math.ceil(duration / stepTime);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (step >= steps) { setDisplay(end); clearInterval(timer); }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);
  const fmt = decimals > 0
    ? display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(display).toLocaleString("en-US");
  return <span>{prefix}{fmt}{suffix}</span>;
}

function SkeletonPill() {
  return <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />;
}

export default function AffiliateDashboard() {
  const formatCurrency = (v: number | null | undefined) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v ?? 0);
  const formatCount = (v: number | null | undefined) =>
    new Intl.NumberFormat("en-US").format(v ?? 0);
  const formatPercentage = (v: number | string | null | undefined) => {
    if (v === null || v === undefined) return "0%";
    if (typeof v === "number") return `${v}%`;
    const t = v.trim();
    if (!t) return "0%";
    if (t.endsWith("%")) return t;
    const n = Number(t);
    return Number.isNaN(n) ? "0%" : `${n}%`;
  };

  const [earningsStats, setEarningsStats] = useState<EarningsStats>({
    totalEarnings: 0, monthlyEarnings: 0, yearlyEarnings: 0,
    pendingCommissions: 0, paidCommissions: 0, conversionRate: "0%", avgCommission: 0,
    nonRenewalsCount: 0, lostCommissionAmount: 0, estimatedLostCommission: 0,
    atRiskReferrals: 0, pendingSignupCount: 0, churnedReferrals: 0, churnedCommission: 0,
    currentMonthReferralLeads: 0, currentMonthConversionCount: 0, currentMonthConversionRate: 0,
    currentMonthAverageCommission: 0, currentMonthPaidCommissionCount: 0,
  });
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideUpgradeSection, setHideUpgradeSection] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { userProfile } = useAuthContext();
  const subscriptionStatus = useSubscriptionStatus();
  const navigate = useNavigate();

  useEffect(() => {
    const isHidden = localStorage.getItem("hidePartnerUpgrade") === "true";
    setHideUpgradeSection(isHidden);
  }, []);

  const handleDontShowAgain = () => {
    localStorage.setItem("hidePartnerUpgrade", "true");
    setHideUpgradeSection(true);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsResponse = await affiliateApi.getStats();
        if (statsResponse.data?.success) {
          const d = statsResponse.data.data;
          const total = d.totalReferrals || 0;
          setEarningsStats({
            totalEarnings: d.totalEarnings || 0,
            monthlyEarnings: d.monthlyEarnings || 0,
            yearlyEarnings: d.yearlyEarnings || 0,
            pendingCommissions: d.pendingCommissions || 0,
            paidCommissions: d.totalEarnings || 0,
            conversionRate: typeof d.conversionRate === "number" ? `${d.conversionRate}%` : (d.conversionRate || "0%"),
            avgCommission: total > 0 ? (d.totalEarnings || 0) / total : 0,
            planType: d.planType,
            paidReferralsCount: d.paidReferralsCount,
            currentTierRate: d.currentTierRate,
            tierInfo: d.tierInfo,
            pendingSignupCount: d.pendingSignupCount || 0,
            churnedReferrals: d.churnedReferrals || 0,
            churnedCommission: d.churnedCommission || 0,
            nonRenewalsCount: d.nonRenewalsCount || 0,
            lostCommissionAmount: d.lostCommissionAmount || 0,
            estimatedLostCommission: d.estimatedLostCommission || 0,
            atRiskReferrals: d.atRiskReferrals || 0,
            lastPayment: d.lastPayment,
            nextPayment: d.nextPayment,
            paymentMethod: d.paymentMethod,
            totalEarningsChange: d.totalEarningsChange,
            conversionRateChange: d.conversionRateChange,
            totalReferrals: total,
            activePayingClients: d.activePayingClients || 0,
            unpaidClients: d.unpaidClients || 0,
            cancelledClients: d.cancelledClients || 0,
            totalPayouts: d.totalPayouts || 0,
            lastPayoutDate: d.lastPayoutDate || null,
            currentMRR: d.currentMRR || 0,
            mrrBase: d.mrrBase || 0,
          });
        }
        const refResp = await affiliateApi.getRecentReferrals(10);
        if (refResp.data?.success) {
          const refs = refResp.data.data || [];
          setRecentReferrals(refs);
          if (refs.length > 0) {
            setEarningsStats((prev) => ({
              ...prev,
              paidReferralsCount: refs.filter((r: any) => r.status === "paid").length,
            }));
          }
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
        setTimeout(() => setDataLoaded(true), 100);
      }
    };
    fetchDashboardData();
  }, []);

  const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    paid:      { label: "Paid",      dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    pending:   { label: "Pending",   dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
    unpaid:    { label: "Unpaid",    dot: "bg-orange-500",  text: "text-orange-700",  bg: "bg-orange-50 border-orange-200" },
    cancelled: { label: "Cancelled", dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50 border-red-200" },
    churned:   { label: "Churned",   dot: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
  };

  const hasActiveSubscription = subscriptionStatus.hasActiveSubscription || earningsStats?.subscriptionStatus === "active";
  const showUpgradeCTA = !subscriptionStatus.isLoading && !hasActiveSubscription && !hideUpgradeSection;
  const currentPlan = earningsStats?.actualPlanName || earningsStats?.planType;
  const canUpgrade = !currentPlan || currentPlan === "free" || currentPlan === "starter" || earningsStats?.planType === "free";
  const nextTierRate = earningsStats?.tierInfo?.nextTier === "Pro - Advanced" ? "15%" : "20-25%";

  const totalRef = earningsStats?.totalReferrals ?? 0;
  const active = earningsStats?.activePayingClients ?? 0;
  const unpaid = earningsStats?.unpaidClients ?? 0;
  const cancelled = earningsStats?.cancelledClients ?? 0;
  const pipelineMax = Math.max(totalRef, 1);

  return (
    <AffiliateLayout title="Dashboard" description="Your affiliate command center">
      <div className="space-y-8 pb-8">

        {/* ── HERO BANNER ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-8 py-10 text-white shadow-2xl">
          {/* decorative circles */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl" />
          <div className="pointer-events-none absolute right-1/4 bottom-0 h-32 w-32 rounded-full bg-purple-500/15 blur-2xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* left: greeting */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur-sm border border-white/20">
                  <Sparkles className="h-3 w-3 text-yellow-300" />
                  Affiliate Dashboard
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-1">
                {userProfile?.first_name
                  ? `Welcome back, ${userProfile.first_name} 👋`
                  : "Welcome back 👋"}
              </h1>
              <p className="text-blue-200 text-sm">
                {earningsStats?.tierInfo?.currentTier || "Free – Starter"} &nbsp;·&nbsp; {earningsStats?.currentTierRate || 10}% commission rate
              </p>
            </div>

            {/* right: hero stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
              {[
                { label: "All-Time Earnings", value: earningsStats.totalEarnings, prefix: "$", decimals: 2, color: "text-emerald-300" },
                { label: "This Month", value: earningsStats.monthlyEarnings, prefix: "$", decimals: 2, color: "text-sky-300" },
                { label: "Total Referrals", value: earningsStats.totalReferrals ?? 0, prefix: "", decimals: 0, color: "text-violet-300" },
                { label: "MRR", value: earningsStats.currentMRR ?? 0, prefix: "$", decimals: 2, color: "text-amber-300" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-2xl font-extrabold ${s.color}`}>
                    {loading ? <SkeletonPill /> : <AnimatedNumber value={s.value} prefix={s.prefix} decimals={s.decimals} />}
                  </div>
                  <div className="text-xs text-blue-300 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── UPGRADE CTA (if applicable) ── */}
        {showUpgradeCTA && canUpgrade && (
          <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 px-6 py-5 shadow-sm">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-purple-200/40 blur-2xl" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-md">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-purple-900">Unlock the Partner Program</p>
                  <p className="text-sm text-purple-600">Earn up to {nextTierRate} commission with co-marketing & advanced support</p>
                  {earningsStats?.tierInfo?.referralsToNext ? (
                    <p className="text-xs text-fuchsia-600 font-medium mt-0.5">
                      Only {earningsStats.tierInfo.referralsToNext} more referrals to unlock {earningsStats.tierInfo.nextTier}!
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button onClick={() => navigate("/affiliate/subscription")} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-md">
                  Upgrade Now <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <button onClick={handleDontShowAgain} className="p-1.5 rounded-full text-purple-400 hover:text-purple-600 hover:bg-purple-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN KPI ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* All-Time Earnings */}
          <div className={`group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-6 ${dataLoaded ? "animate-[fadeInUp_0.4s_ease_both]" : "opacity-0"}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              {earningsStats?.totalEarningsChange && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${earningsStats.totalEarningsChange.percentage >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {earningsStats.totalEarningsChange.percentage >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(earningsStats.totalEarningsChange.percentage)}%
                </span>
              )}
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              {loading ? <SkeletonPill /> : <AnimatedNumber value={earningsStats.totalEarnings} prefix="$" decimals={2} />}
            </div>
            <p className="text-sm text-gray-500 mt-1 font-medium">All-Time Earnings</p>
          </div>

          {/* Monthly Earnings */}
          <div className={`group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-6 ${dataLoaded ? "animate-[fadeInUp_0.4s_0.1s_ease_both]" : "opacity-0"}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-sky-100 text-sky-700">This Month</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              {loading ? <SkeletonPill /> : <AnimatedNumber value={earningsStats.monthlyEarnings} prefix="$" decimals={2} />}
            </div>
            <p className="text-sm text-gray-500 mt-1 font-medium">Monthly Earnings</p>
          </div>

          {/* Tier & Rate */}
          <div className={`group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-6 ${dataLoaded ? "animate-[fadeInUp_0.4s_0.2s_ease_both]" : "opacity-0"}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-700 shadow-md">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-violet-100 text-violet-700">
                {earningsStats?.currentTierRate || 10}% rate
              </span>
            </div>
            <div className="text-2xl font-extrabold text-gray-900">
              {loading ? <SkeletonPill /> : (earningsStats?.tierInfo?.currentTier || "Free – Starter")}
            </div>
            <p className="text-sm text-gray-500 mt-1 font-medium">Current Tier</p>
          </div>
        </div>

        {/* ── CLIENT PIPELINE + FINANCIAL CARDS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Client Pipeline — spanning 2 cols */}
          <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Client Pipeline</h3>
                <p className="text-sm text-gray-500">Referral status breakdown</p>
              </div>
              <span className="text-3xl font-extrabold text-gray-800">{loading ? "—" : formatCount(totalRef)}</span>
            </div>

            <div className="space-y-4">
              {[
                { label: "Active Paying", count: active, icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", sub: "Live subscriptions" },
                { label: "Unpaid / At Risk", count: unpaid, icon: <AlertTriangle className="h-4 w-4" />, color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700", sub: "Past due or incomplete" },
                { label: "Cancelled / Churned", count: cancelled, icon: <XCircle className="h-4 w-4" />, color: "bg-red-500", light: "bg-red-50", text: "text-red-700", sub: "Lost clients" },
              ].map((row) => (
                <div key={row.label} className={`flex items-center gap-4 rounded-xl ${row.light} px-4 py-3`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${row.color} text-white`}>
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${row.text}`}>{row.label}</span>
                      <span className={`text-lg font-extrabold ${row.text}`}>{loading ? "—" : row.count}</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${row.color} h-2 rounded-full transition-all duration-700`}
                        style={{ width: `${Math.round((row.count / pipelineMax) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{row.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* health score */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Conversion Rate</span>
              <span className="font-bold text-teal-600 text-lg">{loading ? "—" : formatPercentage(earningsStats.conversionRate)}</span>
            </div>
          </div>

          {/* Financial sidebar */}
          <div className="flex flex-col gap-4">
            {/* Payout summary */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-md">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Payouts</p>
                  <p className="text-xs text-gray-500">Sent to you by admin</p>
                </div>
              </div>
              <div className="text-2xl font-extrabold text-indigo-700">
                {loading ? <SkeletonPill /> : <AnimatedNumber value={earningsStats.totalPayouts ?? 0} prefix="$" decimals={2} />}
              </div>
              {earningsStats.lastPayoutDate && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last: {new Date(earningsStats.lastPayoutDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Pending */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                  <Timer className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Pending</p>
                  <p className="text-xs text-gray-500">Awaiting payment</p>
                </div>
              </div>
              <div className="text-2xl font-extrabold text-amber-600">
                {loading ? <SkeletonPill /> : <AnimatedNumber value={earningsStats.pendingCommissions} prefix="$" decimals={2} />}
              </div>
              <p className="text-xs text-gray-500 mt-1">Processed on the 15th</p>
            </div>

            {/* MRR */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-violet-200" />
                <span className="text-xs font-semibold text-violet-200 uppercase tracking-wide">MRR</span>
              </div>
              <div className="text-2xl font-extrabold">
                {loading ? "—" : <AnimatedNumber value={earningsStats.currentMRR ?? 0} prefix="$" decimals={2} />}
              </div>
              <p className="text-xs text-violet-300 mt-1">Monthly recurring commission</p>
            </div>
          </div>
        </div>

        {/* ── RISK / PERFORMANCE ROW ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Lost Commission", value: formatCurrency(earningsStats.lostCommissionAmount), icon: <TrendingDown className="h-5 w-5 text-white" />, grad: "from-rose-500 to-red-600", sub: "From non-renewals", warn: true },
            { label: "Non-Renewals", value: formatCount(earningsStats.nonRenewalsCount), icon: <Activity className="h-5 w-5 text-white" />, grad: "from-orange-500 to-red-500", sub: "Last 30 days", warn: true },
            { label: "At Risk", value: formatCount(earningsStats.atRiskReferrals), icon: <Clock className="h-5 w-5 text-white" />, grad: "from-amber-400 to-orange-500", sub: "Potential churn", warn: false },
            { label: "Avg Commission", value: formatCurrency(earningsStats.avgCommission), icon: <Target className="h-5 w-5 text-white" />, grad: "from-teal-500 to-cyan-600", sub: "Per referral", warn: false },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${item.grad} shadow mb-3`}>
                {item.icon}
              </div>
              <div className={`text-xl font-extrabold ${item.warn ? "text-red-600" : "text-gray-900"}`}>
                {loading ? "—" : item.value}
              </div>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* ── TIER PROGRESS ── */}
        {earningsStats?.tierInfo && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50 border border-purple-100 shadow-sm p-6">
            <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-purple-200/30 blur-2xl" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-md">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Tier Progress</h3>
                  <p className="text-sm text-gray-500">Track your way to higher commissions</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-purple-700">{earningsStats.paidReferralsCount || 0}</div>
                  <div className="text-xs text-gray-500">Paid referrals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-emerald-600">{earningsStats.currentTierRate || 10}%</div>
                  <div className="text-xs text-gray-500">Current rate</div>
                </div>
              </div>
            </div>

            {earningsStats.tierInfo.referralsToNext > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-purple-700 font-semibold">{earningsStats.tierInfo.currentTier}</span>
                  <span className="text-gray-500">{earningsStats.tierInfo.referralsToNext} more → <span className="text-purple-700 font-semibold">{earningsStats.tierInfo.nextTier}</span></span>
                </div>
                <div className="relative h-5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-all duration-700 flex items-center justify-end pr-3"
                    style={{ width: `${Math.max(earningsStats.tierInfo.progressToNext, 4)}%` }}
                  >
                    {earningsStats.tierInfo.progressToNext >= 20 && (
                      <span className="text-white text-xs font-bold">{Math.round(earningsStats.tierInfo.progressToNext)}%</span>
                    )}
                  </div>
                </div>
                <p className="text-sm font-semibold text-center text-purple-700">
                  You're {Math.round(earningsStats.tierInfo.progressToNext)}% of the way there!
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <p className="text-emerald-800 font-bold text-xl">🎉 Max Tier Achieved!</p>
                <p className="text-emerald-600 text-sm">{earningsStats.tierInfo.nextTier}</p>
              </div>
            )}
          </div>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-1">Quick Actions</h3>
          <p className="text-sm text-gray-500 mb-5">Jump to the tools you use most</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/affiliate/links")}
              className="group relative overflow-hidden flex items-center gap-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Link className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-bold">Generate Referral Link</p>
                <p className="text-xs text-emerald-100">Share & earn instantly</p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto text-white/60 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/affiliate/referrals")}
              className="group flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">View All Referrals</p>
                <p className="text-xs text-gray-500">Track every lead</p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* ── RECENT REFERRALS + LEADERBOARD ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Referrals */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Recent Referrals</h3>
                <p className="text-sm text-gray-500">Latest leads & conversions</p>
              </div>
              <button onClick={() => navigate("/affiliate/referrals")} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                See all <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                  </div>
                ))
              ) : recentReferrals.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No referrals yet — share your link!</p>
                </div>
              ) : (
                recentReferrals.map((r) => {
                  const sc = statusConfig[r.status] || statusConfig.pending;
                  const initials = r.customerName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
                  return (
                    <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${sc.bg} hover:shadow-sm transition-all`}>
                      <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${sc.text}`}>{r.customerName}</p>
                        <p className="text-xs text-gray-500 truncate">{r.planName || "—"} · {r.dateReferred}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-800">{formatCurrency(r.commission)}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${sc.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <AffiliateLeaderboard />
        </div>

        {/* ── PERFORMANCE + PAYMENT STATUS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Affiliate Performance</h3>
            <p className="text-sm text-gray-500 mb-5">Your metrics this month</p>
            <div className="space-y-4">
              {[
                { label: "Total Referrals", value: formatCount(earningsStats?.currentMonthReferralLeads ?? earningsStats?.totalReferrals ?? 0), color: "text-blue-700" },
                { label: "Conversion Rate", value: formatPercentage(earningsStats?.currentMonthConversionRate ?? earningsStats?.conversionRate), color: "text-teal-700" },
                { label: "Avg Commission / Sale", value: formatCurrency(earningsStats?.currentMonthAverageCommission ?? earningsStats?.avgCommission ?? 0), color: "text-emerald-700" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{m.label}</span>
                  <span className={`text-lg font-extrabold ${m.color}`}>{loading ? "—" : m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Payment Status</h3>
            <p className="text-sm text-gray-500 mb-5">Commission payment information</p>
            <div className="space-y-3">
              {[
                { label: "Last Payment", value: earningsStats?.lastPayment ? `${formatCurrency(earningsStats.lastPayment.amount)} · ${earningsStats.lastPayment.date}` : "No payments yet", dot: "bg-emerald-500" },
                { label: "Next Payment", value: earningsStats?.nextPayment?.date ? `${earningsStats.nextPayment.date} (${earningsStats.nextPayment.status})` : "No scheduled payments", dot: "bg-amber-500" },
                { label: "Payment Method", value: earningsStats?.paymentMethod || "Not configured", dot: "bg-blue-500" },
              ].map((p) => (
                <div key={p.label} className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`h-2 w-2 rounded-full ${p.dot} mt-1`} />
                    <span className="text-sm text-gray-600">{p.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 text-right">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AffiliateLayout>
  );
}