import { Fragment, useState, useEffect } from "react";
import AffiliateLayout from "@/components/AffiliateLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  MessageSquare,
  Calendar,
  TrendingUp,
  UserPlus,
  Mail,
  Phone,
  ExternalLink,
  X,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Loader2,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { affiliateApi } from "@/lib/api";

interface Referral {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  status: "unpaid" | "paid" | "cancelled" | "expired" | "churned" | "pending";
  tier: "basic" | "premium" | "enterprise";
  signupDate: string;
  conversionDate?: string;
  commission: number;
  lifetimeValue: number;
  source: string;
  trackingCode: string;
  lastActivity: string;
  transactionId?: string;
  planPrice?: number;
  planName?: string;
  subscriptionStatus?: string;
  isStripePaid?: boolean;
  lastPaymentDate?: string;
  stripeTransactionId?: string;
  paymentHistory?: Array<{
    paymentIntentId: string;
    amount: number;
    currency: string;
    createdAt: string;
    description?: string;
  }>;
}

interface ChildReferral {
  id: string;
  childAffiliateId?: number;
  childAffiliateName: string;
  customerName: string;
  customerEmail: string;
  product: string;
  orderValue: number;
  commissionRate: number;
  commissionAmount: number;
  childOrderValue?: number;
  childCommissionRate?: number;
  childCommissionAmount?: number;
  status: "pending" | "approved" | "paid" | "rejected";
  orderDate: string;
  paymentDate?: string;
  level: number;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  cancelledReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  totalCommission: number;
  avgLifetimeValue: number;
}

interface ReferralPurchase {
  id: string;
  index: number;
  referralId: string;
  referredUserId: number;
  customerName: string;
  email: string;
  stripeCustomerId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  createdAt: string;
  description?: string;
  baseCommissionRate: number;
  effectiveCommissionRate: number;
  commissionEarned: number;
  currentMonthPaidSequence: number | null;
  isThresholdBonus: boolean;
  transactionId?: string | null;
}

interface ReferralPurchaseSummary {
  totalPurchases: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  currentMonthPurchases: number;
  thresholdBonusPurchases: number;
  baseCommissionRate: number;
}

interface ChildReferralSummary {
  totalReferrals: number;
  totalCommission: number;
}

export default function AffiliateReferrals() {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [childReferrals, setChildReferrals] = useState<ChildReferral[]>([]);
  const [childSummary, setChildSummary] = useState<ChildReferralSummary>({
    totalReferrals: 0,
    totalCommission: 0
  });
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    convertedReferrals: 0,
    cancelledReferrals: 0,
    activeReferrals: 0,
    conversionRate: 0,
    totalCommission: 0,
    avgLifetimeValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("signupDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedPaymentRows, setExpandedPaymentRows] = useState<Record<string, boolean>>({});
  const [isAllTimeEarningsOpen, setIsAllTimeEarningsOpen] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [purchasesLoaded, setPurchasesLoaded] = useState(false);
  const [referralPurchases, setReferralPurchases] = useState<ReferralPurchase[]>([]);
  const [purchaseSummary, setPurchaseSummary] = useState<ReferralPurchaseSummary>({
    totalPurchases: 0,
    totalRevenue: 0,
    totalCommissionEarned: 0,
    currentMonthPurchases: 0,
    thresholdBonusPurchases: 0,
    baseCommissionRate: 10,
  });

  useEffect(() => {
    fetchReferrals();
  }, []);

  const hasActiveFilters = Boolean(searchTerm) || statusFilter !== "all" || tierFilter !== "all";

  const fetchReferrals = async () => {
    try {
      setLoading(true);

      const [referralsResponse, childReferralsResponse, statsResponse, purchasesResponse] = await Promise.all([
        affiliateApi.getReferrals(),
        affiliateApi.getChildReferrals(),
        affiliateApi.getReferralStats(),
        affiliateApi.getReferralPurchases().catch(() => null),
      ]);

      if (referralsResponse.data && referralsResponse.data.success) {
        setReferrals(referralsResponse.data.data);
      }

      if (childReferralsResponse.data && childReferralsResponse.data.success) {
        setChildReferrals(childReferralsResponse.data.data || []);
        setChildSummary(childReferralsResponse.data.summary || { totalReferrals: 0, totalCommission: 0 });
      }

      if (statsResponse.data && statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (purchasesResponse?.data?.success) {
        setReferralPurchases(purchasesResponse.data.data || []);
        setPurchaseSummary(purchasesResponse.data.summary || {
          totalPurchases: 0,
          totalRevenue: 0,
          totalCommissionEarned: 0,
          currentMonthPurchases: 0,
          thresholdBonusPurchases: 0,
          baseCommissionRate: 10,
        });
        setPurchasesLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast({
        title: "Error",
        description: "Failed to load referrals data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChildStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unpaid":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "churned":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatStatusLabel = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "cancelled" || normalized === "canceled") return "Canceled";
    if (normalized === "churned") return "Churned";
    if (normalized === "paid") return "Paid";
    if (normalized === "unpaid") return "Unpaid";
    if (normalized === "pending") return "Pending";
    if (normalized === "expired") return "Expired";
    return status;
  };

  const formatChildStatusLabel = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "paid") return "Paid";
    if (normalized === "approved") return "Approved";
    if (normalized === "pending") return "Pending";
    if (normalized === "rejected") return "Rejected";
    return status;
  };
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "basic":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
      case "premium":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "enterprise":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const filteredReferrals = referrals.filter((referral) => {
    const searchValue = searchTerm.toLowerCase();
    const matchesSearch = (referral.customerName?.toLowerCase() || '').includes(searchValue) ||
                         (referral.email?.toLowerCase() || '').includes(searchValue) ||
                         (referral.id?.toLowerCase() || '').includes(searchValue) ||
                         (referral.phone?.toLowerCase() || '').includes(searchValue);
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
    const matchesTier = tierFilter === "all" || referral.tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  const filteredChildReferrals = childReferrals.filter((referral) => {
    const matchesSearch = (referral.childAffiliateName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (referral.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (referral.customerEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (referral.product?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const visibleReferrals = filteredReferrals;
  const visiblePaidReferrals = visibleReferrals.filter((referral) => referral.status === "paid").length;
  const visibleUnpaidReferrals = visibleReferrals.filter((referral) => referral.status === "unpaid" || referral.status === "pending").length;
  const visibleCancelledReferrals = visibleReferrals.filter((referral) => referral.status === "cancelled" || referral.status === "churned").length;
  const visibleLifetimeAverage = visiblePaidReferrals > 0
    ? visibleReferrals
        .filter((referral) => referral.status === "paid")
        .reduce((sum, referral) => sum + (Number(referral.lifetimeValue) || 0), 0) / visiblePaidReferrals
    : 0;
  const displayTotalReferrals = hasActiveFilters ? visibleReferrals.length : referrals.length;
  const displayPaidReferrals = hasActiveFilters ? visiblePaidReferrals : visiblePaidReferrals;
  const displayUnpaidReferrals = hasActiveFilters ? visibleUnpaidReferrals : visibleUnpaidReferrals;
  const displayCancelledReferrals = hasActiveFilters ? visibleCancelledReferrals : visibleCancelledReferrals;
  const displayAvgLifetimeValue = hasActiveFilters ? visibleLifetimeAverage : (visibleLifetimeAverage || stats.avgLifetimeValue || 0);

  const handleFollowUp = async (referralId: string) => {
    try {
      await affiliateApi.sendFollowUp(referralId);
      toast({
        title: "Follow-up Sent",
        description: "Follow-up message has been sent to the referral",
      });
    } catch (error) {
      console.error('Error sending follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to send follow-up message",
        variant: "destructive",
      });
    }
  };

  const togglePaymentHistory = (referralId: string) => {
    setExpandedPaymentRows((prev) => ({
      ...prev,
      [referralId]: !prev[referralId],
    }));
  };

  const exportReferrals = () => {
    const csvContent = [
      ['ID', 'Name', 'Email', 'Phone', 'Status', 'Tier', 'Signup Date', 'Commission', 'Lifetime Value'].join(','),
      ...filteredReferrals.map(referral => [
        referral.id,
        referral.customerName,
        referral.email,
        referral.phone || '',
        referral.status,
        referral.tier,
        referral.signupDate,
        referral.commission,
        referral.lifetimeValue
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'affiliate-referrals.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openAllTimeEarnings = async () => {
    setIsAllTimeEarningsOpen(true);

    if (purchasesLoaded || loadingPurchases) {
      return;
    }

    try {
      setLoadingPurchases(true);
      const response = await affiliateApi.getReferralPurchases();
      if (response.data?.success) {
        setReferralPurchases(response.data.data || []);
        setPurchaseSummary(response.data.summary || {
          totalPurchases: 0,
          totalRevenue: 0,
          totalCommissionEarned: 0,
          currentMonthPurchases: 0,
          thresholdBonusPurchases: 0,
          baseCommissionRate: 10,
        });
        setPurchasesLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching referral purchases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load all-time earnings purchases',
        variant: 'destructive',
      });
    } finally {
      setLoadingPurchases(false);
    }
  };

  return (
    <AffiliateLayout
      title="Referrals Management"
      description="Track and manage all your referrals"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : (displayTotalReferrals || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters ? 'Visible referrals' : 'Visible referral rows'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
              <Users className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {loading ? '...' : (displayUnpaidReferrals || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Matches the current referral list
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : (displayPaidReferrals || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Matches the current referral list
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Lifetime Value</CardTitle>
              <UserPlus className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {loading ? '...' : `$${(displayAvgLifetimeValue || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Average for visible paid referrals
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
            onClick={openAllTimeEarnings}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All-Time Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {loading || (!purchasesLoaded && loadingPurchases)
                  ? '...'
                  : `$${(purchaseSummary.totalCommissionEarned || stats.totalCommission || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Click to view every subscription payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled / Churned</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? '...' : (displayCancelledReferrals || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Matches the current referral list
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <CardTitle>Referrals List</CardTitle>
                <CardDescription>
                  Manage and track all your referrals
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={exportReferrals} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search referrals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Referrals Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referral</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Signup Date</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Plan Price</TableHead>
                    <TableHead>Stripe Status</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Lifetime Value</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={12}>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                              <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-500">No referrals found</p>
                          <p className="text-sm text-gray-400">
                            {searchTerm || statusFilter !== "all" || tierFilter !== "all"
                              ? "Try adjusting your filters"
                              : "Start sharing your affiliate links to see referrals here"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((referral) => (
                      <Fragment key={referral.id}>
                      <TableRow>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{referral.customerName}</div>
                            <div className="text-sm text-muted-foreground">ID: {referral.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{referral.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {referral.phone ? (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{referral.phone}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(referral.status)}>
                            {formatStatusLabel(referral.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTierColor(referral.tier)}>
                            {referral.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{referral.signupDate}</div>
                            {referral.conversionDate && (
                              <div className="text-xs text-muted-foreground">
                                Converted: {referral.conversionDate}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            ${(referral.commission || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {referral.planPrice ? (
                            <span className="font-medium">${referral.planPrice.toFixed(2)}</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {referral.isStripePaid ? (
                            <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                          ) : referral.subscriptionStatus === 'past_due' ? (
                            <Badge className="bg-amber-100 text-amber-800">Past Due</Badge>
                          ) : referral.subscriptionStatus === 'canceled' ? (
                            <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
                          ) : referral.subscriptionStatus === 'unpaid' ? (
                            <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">{referral.subscriptionStatus || 'N/A'}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {referral.lastPaymentDate ? (
                            <button
                              type="button"
                              onClick={() => togglePaymentHistory(referral.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                              <span>{new Date(referral.lastPaymentDate).toLocaleDateString()}</span>
                              {(referral.paymentHistory?.length || 0) > 0 ? (
                                expandedPaymentRows[referral.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                              ) : null}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ${(referral.lifetimeValue || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {referral.transactionId ? (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                              {referral.transactionId}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedPaymentRows[referral.id] && (referral.paymentHistory?.length || 0) > 0 ? (
                        <TableRow key={`${referral.id}-payments`}>
                          <TableCell colSpan={12} className="bg-slate-50/70">
                            <div className="space-y-2 py-2">
                              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Payment History
                              </div>
                              <div className="space-y-2">
                                {referral.paymentHistory?.map((payment) => (
                                  <div key={payment.paymentIntentId} className="flex flex-col gap-1 rounded-md border bg-white p-3 text-sm md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-1">
                                      <div className="font-medium">
                                        {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}
                                      </div>
                                      <div className="text-xs text-muted-foreground font-mono">
                                        {payment.paymentIntentId}
                                      </div>
                                      {payment.description ? (
                                        <div className="text-xs text-muted-foreground">{payment.description}</div>
                                      ) : null}
                                    </div>
                                    <div className="font-semibold text-green-600">
                                      ${payment.amount.toFixed(2)} {payment.currency}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                      </Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <CardTitle>Affiliate Override Referrals</CardTitle>
                <CardDescription>
                  Track referrals and earnings coming from your affiliates override
                </CardDescription>
              </div>
              <div className="flex flex-col items-end text-sm">
                <div className="text-muted-foreground">
                  Total child referrals: <span className="font-medium text-foreground">{(childSummary.totalReferrals || 0).toLocaleString()}</span>
                </div>
                <div className="text-muted-foreground">
                  Total earnings from child referrals: <span className="font-medium text-foreground">${(childSummary.totalCommission || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate Override</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="space-y-2">
                              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                              <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredChildReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-500">No affiliate override referrals found</p>
                          <p className="text-sm text-gray-400">
                            {searchTerm
                              ? "Try adjusting your search"
                              : "Invite affiliates under you to start tracking their referrals"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChildReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{referral.childAffiliateName}</div>
                            <div className="text-sm text-muted-foreground">ID: {referral.childAffiliateId ?? "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{referral.customerName}</div>
                            <div className="text-sm text-muted-foreground">{referral.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{referral.product}</div>
                            <div className="text-sm text-muted-foreground">
                              ${referral.orderValue.toLocaleString()} · {referral.commissionRate.toFixed(2)}%
                            </div>
                            {typeof referral.childCommissionRate === "number" && typeof referral.childOrderValue === "number" ? (
                              <div className="text-xs text-muted-foreground">
                                Child: ${referral.childOrderValue.toLocaleString()} · {referral.childCommissionRate.toFixed(2)}%
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getChildStatusColor(referral.status)}>
                            {formatChildStatusLabel(referral.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{referral.orderDate}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-green-600">
                              You: ${referral.commissionAmount.toLocaleString()}
                            </div>
                            {typeof referral.childCommissionAmount === "number" ? (
                              <div className="text-xs text-muted-foreground">
                                Child: ${referral.childCommissionAmount.toLocaleString()}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAllTimeEarningsOpen} onOpenChange={setIsAllTimeEarningsOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>All-Time Earnings Timeline</DialogTitle>
            <DialogDescription>
              Oldest subscription purchases first. Rows turn red only after the current month already has 100 paid purchases, so purchase 101 and later get the +5% bonus.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Purchases</div>
              <div className="mt-1 text-2xl font-semibold">{purchaseSummary.totalPurchases.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Referral Revenue</div>
              <div className="mt-1 text-2xl font-semibold">${purchaseSummary.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Commission Earned</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-600">${purchaseSummary.totalCommissionEarned.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Current Base Rate</div>
              <div className="mt-1 text-2xl font-semibold">{purchaseSummary.baseCommissionRate.toFixed(2)}%</div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
            {loadingPurchases ? (
              <div className="flex items-center justify-center gap-3 p-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading purchase history...
              </div>
            ) : referralPurchases.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No subscription purchases found for this affiliate yet.
              </div>
            ) : (
              <div className="divide-y">
                {referralPurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className={`p-4 ${purchase.isThresholdBonus ? 'bg-red-50/70' : 'bg-background'}`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-semibold text-white">
                            {purchase.index}
                          </span>
                          <span className="font-semibold">{purchase.customerName}</span>
                          {purchase.isThresholdBonus ? (
                            <Badge className="bg-red-100 text-red-800">101+ This Month</Badge>
                          ) : null}
                        </div>
                        <div className="text-sm text-muted-foreground">{purchase.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(purchase.createdAt).toLocaleDateString()} {new Date(purchase.createdAt).toLocaleTimeString()}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">{purchase.paymentIntentId}</div>
                        {purchase.description ? (
                          <div className="text-xs text-muted-foreground">{purchase.description}</div>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-left md:text-right">
                        <div className="text-lg font-semibold">${purchase.amount.toFixed(2)} {purchase.currency}</div>
                        <div className="text-sm text-emerald-600 font-semibold">
                          Earned ${purchase.commissionEarned.toFixed(2)} at {purchase.effectiveCommissionRate.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Base rate: {purchase.baseCommissionRate.toFixed(2)}%
                        </div>
                        {purchase.currentMonthPaidSequence ? (
                          <div className="text-xs text-muted-foreground">
                            Current month paid purchase #{purchase.currentMonthPaidSequence}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AffiliateLayout>
  );
}
