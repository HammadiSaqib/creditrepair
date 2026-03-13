import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { affiliateApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import AffiliateLayout from "@/components/AffiliateLayout";
import AffiliateLeaderboard from "@/components/AffiliateLeaderboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  X
} from "lucide-react";

interface EarningsStats {
  totalEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings?: number;
  pendingCommissions: number;
  paidCommissions: number;
  conversionRate: string;
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
  // New fields for non-renewals and lost commission
  nonRenewalsCount?: number;
  lostCommissionAmount?: number;
  estimatedLostCommission?: number;
  atRiskReferrals?: number;
  pendingSignupCount?: number;
  churnedReferrals?: number;
  churnedCommission?: number;
  // Payment information
  lastPayment?: {
    amount: number;
    date: string;
  };
  nextPayment?: {
    date: string;
    status: string;
  };
  paymentMethod?: string;
  // Percentage changes
  totalEarningsChange?: {
    percentage: number;
    period: string;
  };
  conversionRateChange?: {
    percentage: number;
    period: string;
  };
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
}

interface AffiliatePerformance {
  totalReferrals: number;
  conversionRate: string;
  avgCommissionPerSale: string;
  topPerformingLink: string;
}

export default function AffiliateDashboard() {
  const formatCurrency = (value: number | null | undefined) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value ?? 0);

  const formatCount = (value: number | null | undefined) =>
    new Intl.NumberFormat("en-US").format(value ?? 0);

  const formatPercentage = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return "0%";
    if (typeof value === "number") {
      return `${value}%`;
    }
    const trimmed = value.trim();
    if (!trimmed) return "0%";
    if (trimmed.endsWith("%")) return trimmed;
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) return `${parsed}%`;
    return "0%";
  };

  const [earningsStats, setEarningsStats] = useState<EarningsStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    yearlyEarnings: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    conversionRate: "0%",
    avgCommission: 0,
    nonRenewalsCount: 0,
    lostCommissionAmount: 0,
    estimatedLostCommission: 0,
    atRiskReferrals: 0,
    pendingSignupCount: 0,
    churnedReferrals: 0,
    churnedCommission: 0,
  });

  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([]);
  const [affiliatePerformance, setAffiliatePerformance] = useState<AffiliatePerformance>({
    totalReferrals: 0,
    conversionRate: "0%",
    avgCommissionPerSale: "$0",
    topPerformingLink: "N/A",
  });
  const [loading, setLoading] = useState(true);
  const [hideUpgradeSection, setHideUpgradeSection] = useState(false);

  // Hooks should be at the top level
  const { userProfile } = useAuthContext();
  const subscriptionStatus = useSubscriptionStatus();
  const navigate = useNavigate();

  // Check localStorage for hidden upgrade section on component mount
  useEffect(() => {
    const isHidden = localStorage.getItem('hidePartnerUpgrade') === 'true';
    setHideUpgradeSection(isHidden);
  }, []);

  // Function to hide upgrade section permanently
  const handleDontShowAgain = () => {
    localStorage.setItem('hidePartnerUpgrade', 'true');
    setHideUpgradeSection(true);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('📊 Fetching affiliate dashboard data...');

        // Fetch affiliate stats
        console.log('📈 Fetching affiliate stats...');
        const statsResponse = await affiliateApi.getStats();
        console.log('📈 Stats response:', statsResponse);
        
        if (statsResponse.data && statsResponse.data.success) {
          console.log('✅ Stats data received:', statsResponse.data.data);
          const statsData = statsResponse.data.data;
          const totalReferrals = statsData.totalReferrals || 0;

          setEarningsStats({
            totalEarnings: statsData.totalEarnings || 0,
            monthlyEarnings: statsData.monthlyEarnings || 0,
            yearlyEarnings: statsData.yearlyEarnings || 0,
            pendingCommissions: statsData.pendingCommissions || 0,
            paidCommissions: statsData.totalEarnings || 0,
            conversionRate: typeof statsData.conversionRate === "number" ? `${statsData.conversionRate}%` : (statsData.conversionRate || "0%"),
            avgCommission: totalReferrals > 0 ? (statsData.totalEarnings || 0) / totalReferrals : 0,
            planType: statsData.planType,
            paidReferralsCount: statsData.paidReferralsCount,
            currentTierRate: statsData.currentTierRate,
            tierInfo: statsData.tierInfo,
            pendingSignupCount: statsData.pendingSignupCount || 0,
            churnedReferrals: statsData.churnedReferrals || 0,
            churnedCommission: statsData.churnedCommission || 0,
            // Non-renewals and lost commission fields
            nonRenewalsCount: statsData.nonRenewalsCount || 0,
            lostCommissionAmount: statsData.lostCommissionAmount || 0,
            estimatedLostCommission: statsData.estimatedLostCommission || 0,
            atRiskReferrals: statsData.atRiskReferrals || 0,
            // Payment information
            lastPayment: statsData.lastPayment,
            nextPayment: statsData.nextPayment,
            paymentMethod: statsData.paymentMethod,
            // Percentage changes
            totalEarningsChange: statsData.totalEarningsChange,
            conversionRateChange: statsData.conversionRateChange
          });
        } else {
          console.warn('⚠️ No stats data received');
        }

        // Fetch recent referrals
        console.log('👥 Fetching recent referrals...');
        const referralsResponse = await affiliateApi.getRecentReferrals(10);
        console.log('👥 Referrals response:', referralsResponse);
        
        if (referralsResponse.data && referralsResponse.data.success) {
          console.log('✅ Referrals data received:', referralsResponse.data.data);
          const referrals = referralsResponse.data.data || [];
          setRecentReferrals(referrals);
          if (referrals.length > 0) {
            setEarningsStats((prev) => ({
              ...prev,
              paidReferralsCount: referrals.filter((r: any) => r.status === 'paid').length,
            }));
          }
        } else {
          console.warn('⚠️ No referrals data received');
        }

        // Fetch affiliate performance
        console.log('📈 Fetching affiliate performance...');
        const performanceResponse = await affiliateApi.getPerformance();
        console.log('📈 Performance response:', performanceResponse);
        
        if (performanceResponse.data && performanceResponse.data.success) {
          console.log('✅ Performance data received:', performanceResponse.data.data);
          setAffiliatePerformance(performanceResponse.data.data || []);
        } else {
          console.warn('⚠️ No performance data received');
        }
      } catch (error) {
        console.error('💥 Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "churned":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <AffiliateLayout
      title="Affiliate Dashboard"
      description="Monitor your earnings and track referral performance"
    >
      <div className="space-y-6">
        {(() => {
          // Hide upgrade CTA for any user (admin or affiliate) with an active subscription
          const hasActiveSubscription = subscriptionStatus.hasActiveSubscription;
          
          // Check subscription status from both sources for accuracy
          const hasActiveSubscriptionFromStats = earningsStats?.subscriptionStatus === 'active';
          const actuallyHasSubscription = hasActiveSubscription || hasActiveSubscriptionFromStats;
          
          const showUpgradeCTA = !subscriptionStatus.isLoading && !actuallyHasSubscription && !hideUpgradeSection;
          
          // Check if user is eligible for upgrade based on dynamic data
          // Use actual plan name if available, otherwise fall back to plan type
          const currentPlan = earningsStats?.actualPlanName || earningsStats?.planType;
          const canUpgrade = !currentPlan || currentPlan === 'free' || currentPlan === 'starter' || earningsStats?.planType === 'free';
          const nextTierRate = earningsStats?.tierInfo?.nextTier === 'Pro - Advanced' ? '15%' : 
                              earningsStats?.tierInfo?.nextTier === 'Premium - Partner' ? '20-25%' : '20-25%';

          if (!showUpgradeCTA || !canUpgrade) return null;

          return (
            <Card className="border-2 border-purple-200 bg-purple-50 dark:bg-purple-900/20 relative">
              <button
                onClick={handleDontShowAgain}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Don't show again"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <CardHeader className="flex flex-row items-center justify-between pr-8">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-700" />
                    Upgrade to Partner Program
                  </CardTitle>
                  <CardDescription>
                    Unlock premium admin features by activating an admin subscription.
                  </CardDescription>
                </div>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100" variant="outline">
                  {subscriptionStatus.isLoading ? 'Checking...' : 'Premium plan available'}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Unlock the premium partner tier designed to scale:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>{nextTierRate} commission tier with premium support</li>
                    <li>Co-marketing opportunities & advanced training</li>
                    <li>Perfect for agencies & high-volume partners</li>
                  </ul>
                  {earningsStats?.tierInfo?.referralsToNext && (
                    <p className="mt-2 text-xs text-purple-600 font-medium">
                      Only {earningsStats.tierInfo.referralsToNext} more referrals needed to unlock {earningsStats.tierInfo.nextTier}!
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => navigate('/affiliate/subscription')} className="bg-purple-600 hover:bg-purple-700">
                    Upgrade Now
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDontShowAgain}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Don't show again
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Time Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? '...' : formatCurrency(earningsStats?.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                {earningsStats?.totalEarningsChange ? 
                  `${earningsStats.totalEarningsChange.percentage >= 0 ? '+' : ''}${earningsStats.totalEarningsChange.percentage}% from ${earningsStats.totalEarningsChange.period}` :
                  'No previous data'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? '...' : formatCurrency(earningsStats?.monthlyEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                Current month progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
              <Crown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-600">{loading ? '...' : earningsStats?.tierInfo?.currentTier || 'Free - Starter'}</div>
              <p className="text-xs text-muted-foreground">
                {loading ? '...' : `${earningsStats?.currentTierRate || 10}% commission rate`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">{loading ? '...' : formatPercentage(earningsStats?.conversionRate)}</div>
              <p className="text-xs text-muted-foreground">
                {earningsStats?.conversionRateChange ? 
                  `${earningsStats.conversionRateChange.percentage >= 0 ? '+' : ''}${earningsStats.conversionRateChange.percentage}% from ${earningsStats.conversionRateChange.period}` :
                  'No previous data'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non-Renewals</CardTitle>
              <Activity className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{loading ? '...' : formatCount(earningsStats?.nonRenewalsCount)}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lost Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{loading ? '...' : formatCurrency(earningsStats?.lostCommissionAmount)}</div>
              <p className="text-xs text-muted-foreground">
                From non-renewals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify_between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{loading ? '...' : formatCount(earningsStats?.atRiskReferrals)}</div>
              <p className="text-xs text-muted-foreground">
                Potential churn next month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tier Progress Card */}
        {earningsStats?.tierInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Tier Progress
              </CardTitle>
              <CardDescription>
                Track your progress to the next commission tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{earningsStats.tierInfo.currentTier}</p>
                    <p className="text-sm text-muted-foreground">Current: {earningsStats.currentTierRate}% commission</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{earningsStats.paidReferralsCount || 0} referrals</p>
                    <p className="text-sm text-muted-foreground">Paid conversions</p>
                  </div>
                </div>
                
                {earningsStats.tierInfo.referralsToNext > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to {earningsStats.tierInfo.nextTier}</span>
                      <span>{earningsStats.tierInfo.referralsToNext} more referrals needed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${earningsStats.tierInfo.progressToNext}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(earningsStats.tierInfo.progressToNext)}% complete
                    </p>
                  </div>
                )}
                
                {earningsStats.tierInfo.referralsToNext === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 font-medium">🎉 Congratulations!</p>
                    <p className="text-green-700 text-sm">{earningsStats.tierInfo.nextTier}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Commissions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-yellow-500" />
              Pending Commissions
            </CardTitle>
            <CardDescription>
              Commissions awaiting payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{loading ? '...' : `$${(earningsStats?.pendingCommissions || 0).toLocaleString()}`}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Payments are processed monthly on the 15th
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common affiliate tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate("/affiliate/links")}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Link className="h-6 w-6" />
                <span>Generate Referral Link</span>
              </Button>
              <Button
                onClick={() => navigate("/affiliate/referrals")}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700 dark:hover:text-green-300"
              >
                <Users className="h-6 w-6" />
                <span>View All Referrals</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Referrals and Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Referrals - Left Side */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>
                Latest referrals and their conversion status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">Loading recent referrals...</div>
                  </div>
                ) : recentReferrals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">No recent referrals found</div>
                  </div>
                ) : (
                  (recentReferrals || []).map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">{referral.id}</span>
                          {referral.transactionId && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded break-all">
                              TXN: {referral.transactionId}
                            </span>
                          )}
                          <Badge className={getStatusColor(referral.status)}>
                            {referral.status}
                          </Badge>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(referral.commission)} commission
                          </span>
                        </div>
                        <h4 className="font-medium mt-1">{referral.customerName}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="break-words">Email: {referral.email}</span>
                          <span>Referred: {referral.dateReferred}</span>
                          {referral.conversionDate && <span>Converted: {referral.conversionDate}</span>}
                          <span>Plan: {referral.planName || 'Unknown'}</span>
                          <span>Price: {formatCurrency(referral.planValue)}</span>
                          <span>
                            Payment: {referral.status === 'paid' ? 'Paid' : referral.status === 'pending' ? 'Pending' : referral.status === 'cancelled' ? 'Cancelled' : referral.status === 'churned' ? 'Churned' : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => navigate("/affiliate/referrals")}
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 text-center">
                <Button
                  onClick={() => navigate("/affiliate/referrals")}
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700 dark:hover:text-green-300"
                >
                  View All Referrals
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard - Right Side */}
          <AffiliateLeaderboard />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Performance</CardTitle>
              <CardDescription>
                Your affiliate metrics for this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Referrals</span>
                  <span className="text-2xl font-bold text-green-600">{loading ? '...' : affiliatePerformance?.totalReferrals || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="text-2xl font-bold text-teal-600">{loading ? '...' : affiliatePerformance?.conversionRate || '0%'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Commission/Sale</span>
                  <span className="text-2xl font-bold text-green-600">{loading ? '...' : affiliatePerformance?.avgCommissionPerSale || '$0'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>
                Commission payment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Last Payment</span>
                  </div>
                  <span className="text-sm text-green-600">
                    {earningsStats?.lastPayment ? 
                      `$${earningsStats.lastPayment.amount.toLocaleString()} (${earningsStats.lastPayment.date})` :
                      'No payments yet'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Next Payment</span>
                  </div>
                  <span className="text-sm text-yellow-600">
                    {earningsStats?.nextPayment && earningsStats.nextPayment.date ? 
                      `${earningsStats.nextPayment.date} (${earningsStats.nextPayment.status})` :
                      'No scheduled payments'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Payment Method</span>
                  </div>
                  <span className="text-sm text-blue-600">
                    {earningsStats?.paymentMethod || 'Not configured'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AffiliateLayout>
  );
}
