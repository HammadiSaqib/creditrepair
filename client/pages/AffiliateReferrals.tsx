import { useState, useEffect } from "react";
import AffiliateLayout from "@/components/AffiliateLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { affiliateApi } from "@/lib/api";

interface Referral {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  status: "unpaid" | "paid" | "cancelled" | "expired";
  tier: "basic" | "premium" | "enterprise";
  signupDate: string;
  conversionDate?: string;
  commission: number;
  lifetimeValue: number;
  source: string;
  trackingCode: string;
  lastActivity: string;
  transactionId?: string;
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
  activeReferrals: number;
  conversionRate: number;
  avgLifetimeValue: number;
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
    activeReferrals: 0,
    conversionRate: 0,
    avgLifetimeValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("signupDate");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      
      // Fetch referrals
      const referralsResponse = await affiliateApi.getReferrals();
      if (referralsResponse.data && referralsResponse.data.success) {
        setReferrals(referralsResponse.data.data);
      }

      const childReferralsResponse = await affiliateApi.getChildReferrals();
      if (childReferralsResponse.data && childReferralsResponse.data.success) {
        setChildReferrals(childReferralsResponse.data.data || []);
        setChildSummary(childReferralsResponse.data.summary || { totalReferrals: 0, totalCommission: 0 });
      }

      // Fetch referral stats
      const statsResponse = await affiliateApi.getReferralStats();
      if (statsResponse.data && statsResponse.data.success) {
        setStats(statsResponse.data.data);
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
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatStatusLabel = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "cancelled" || normalized === "canceled") return "Canceled";
    if (normalized === "paid") return "Paid";
    if (normalized === "unpaid") return "Unpaid";
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
    const matchesSearch = (referral.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (referral.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (referral.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
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

  const exportReferrals = () => {
    const csvContent = [
      ['ID', 'Name', 'Email', 'Status', 'Tier', 'Signup Date', 'Commission', 'Lifetime Value'].join(','),
      ...filteredReferrals.map(referral => [
        referral.id,
        referral.customerName,
        referral.email,
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

  return (
    <AffiliateLayout
      title="Referrals Management"
      description="Track and manage all your referrals"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : (stats.totalReferrals || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                All time referrals
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
                {loading ? '...' : (stats.pendingReferrals || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
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
                {loading ? '...' : (stats.convertedReferrals || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? '...' : `${(stats.conversionRate || 0).toFixed(1)}%`} conversion rate
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
                {loading ? '...' : `$${(stats.avgLifetimeValue || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Per converted referral
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
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Signup Date</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Lifetime Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={9}>
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
                      <TableCell colSpan={9} className="text-center py-8">
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
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{referral.customerName}</div>
                            <div className="text-sm text-muted-foreground">ID: {referral.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{referral.email}</span>
                            </div>
                            {referral.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{referral.phone}</span>
                              </div>
                            )}
                          </div>
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
                          {referral.transactionId ? (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                              {referral.transactionId}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
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
                          <span className="font-medium">
                            ${(referral.lifetimeValue || 0).toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
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
                <CardTitle>Child Affiliate Referrals</CardTitle>
                <CardDescription>
                  Track referrals and earnings coming from your child affiliates
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
                    <TableHead>Child Affiliate</TableHead>
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
                          <p className="text-gray-500">No child affiliate referrals found</p>
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
    </AffiliateLayout>
  );
}
