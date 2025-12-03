import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api, superAdminApi } from '@/lib/api';
import { format } from 'date-fns';
import { Download, RefreshCw, Filter, Calendar, DollarSign, Users, Mail, Phone, Building, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { aggregateMonthlyEarnings, mergeReferralsWithCommissions, filterReferrals } from '@/utils/affiliateProfile';

interface Affiliate {
  id: number;
  admin_id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  phone?: string;
  commission_rate: number;
  total_earnings: number;
  total_referrals: number;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface ReferralItem {
  id: number;
  referred_user_id: number | null;
  referred_user_email?: string | null;
  referred_user_first_name?: string | null;
  referred_user_last_name?: string | null;
  commission_amount?: number | null;
  commission_status?: string | null;
  referral_date?: string | null;
  conversion_date?: string | null;
  notes?: string | null;
}

interface CommissionItem {
  id: number;
  affiliate_id: number;
  customer_name: string;
  customer_email: string;
  order_value: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  tier: string;
  product: string;
  order_date: string;
  payment_date?: string;
}

interface Filters {
  packageType: string;
  dateFrom?: string;
  dateTo?: string;
}

type MonthlyPoint = { month: string; amount: number };

type MonthlyPoint = { month: string; amount: number };

function toCsv(filename: string, rows: any[]) {
  const headers = Object.keys(rows[0] || {});
  const lines = [headers.join(',')].concat(
    rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))
  );
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SuperAdminAffiliateProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ packageType: 'all' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentMonthEarnings, setCurrentMonthEarnings] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const affResp = await superAdminApi.getAffiliates();
        const list: Affiliate[] = affResp.data?.data || affResp.data || [];
        const found = list.find((a) => String(a.id) === String(id));
        setAffiliate(found || null);
        const refs = await api.get(`/api/affiliate-management/${id}/referrals`);
        const refData: ReferralItem[] = refs.data?.data || refs.data || [];
        setReferrals(refData);
        const earnResp = await api.get(`/api/affiliate-management/${id}/earnings/monthly`);
        const cur = earnResp.data?.data?.monthly_earnings ?? earnResp.data?.monthly_earnings ?? 0;
        setCurrentMonthEarnings(Number(cur) || 0);
        const commResp = await superAdminApi.getCommissionHistory({ affiliate_id: String(id) });
        const commData: CommissionItem[] = commResp.data?.data || commResp.data || commResp.data || [];
        setCommissions(Array.isArray(commData) ? commData : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load affiliate profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const mergedReferrals = useMemo(() => mergeReferralsWithCommissions(referrals, commissions), [referrals, commissions]);
  const filteredReferrals = useMemo(() => filterReferrals(mergedReferrals as any[], filters), [mergedReferrals, filters]);
  const pagedReferrals = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredReferrals.slice(start, start + pageSize);
  }, [filteredReferrals, page, pageSize]);

  const monthly = useMemo(() => aggregateMonthlyEarnings(commissions, filters.dateFrom, filters.dateTo), [commissions, filters]);
  const currentMonthTotal = useMemo(() => {
    if (currentMonthEarnings && currentMonthEarnings > 0) return currentMonthEarnings;
    const ym = new Date().toISOString().slice(0, 7);
    return monthly.find((m) => m.month === ym)?.amount || 0;
  }, [monthly, currentMonthEarnings]);

  const packageOptions = useMemo(() => {
    const set = new Set<string>();
    mergedReferrals.forEach((r: any) => { 
      const name = r.plan_name || r.package_name;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [mergedReferrals]);

  const exportEarnings = () => {
    const rows = monthly.map((m) => ({ month: m.month, amount: m.amount }));
    toCsv(`affiliate_${id}_earnings.csv`, rows);
  };

  const exportReferralBreakdown = () => {
    const rows = mergedReferrals.map((r: any) => ({
      email: r.referred_user_email || '',
      name: `${r.referred_user_first_name || ''} ${r.referred_user_last_name || ''}`.trim(),
      package: r.package_name || '',
      price: r.package_price || '',
      commission: Number(r.commission_earned || 0).toFixed(2),
      referral_date: r.referral_date || '',
      conversion_date: r.conversion_date || r.last_purchase_date || ''
    }));
    toCsv(`affiliate_${id}_referrals.csv`, rows);
  };

  return (
    <SuperAdminLayout title="Affiliate Profile" description="Detailed performance and referral network">
      <div className="space-y-6 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading profile...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
        ) : !affiliate ? (
          <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">Affiliate not found</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Affiliate Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold">
                        {affiliate.first_name.charAt(0)}{affiliate.last_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{affiliate.first_name} {affiliate.last_name}</div>
                        <div className="text-sm text-muted-foreground">ID #{affiliate.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{affiliate.email}</span>
                    </div>
                    {affiliate.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{affiliate.phone}</span>
                      </div>
                    )}
                    {affiliate.company_name && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="text-sm">{affiliate.company_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Joined {format(new Date(affiliate.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{affiliate.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Earnings</div>
                      <div className="text-xl font-semibold">${Number(affiliate.total_earnings || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Referrals</div>
                      <div className="text-xl font-semibold">{affiliate.total_referrals || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Commission Rate</div>
                      <div className="text-xl font-semibold">{affiliate.commission_rate}%</div>
                    </div>
                    <div className="col-span-3 mt-4 h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthly}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Earnings This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <div className="text-2xl font-semibold">${Number(currentMonthTotal).toFixed(2)}</div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Input type="date" value={filters.dateFrom || ''} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                    <Input type="date" value={filters.dateTo || ''} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                    <Button variant="outline" onClick={() => setFilters({ packageType: 'all' })}><RefreshCw className="h-4 w-4 mr-1" />Reset</Button>
                    <Button onClick={exportEarnings}><Download className="h-4 w-4 mr-1" />Export Earnings</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Referral Network</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filters.packageType} onValueChange={(v) => setFilters({ ...filters, packageType: v })}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All packages</SelectItem>
                      {packageOptions.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportReferralBreakdown}><Download className="h-4 w-4 mr-1" />Export Referrals</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Plan Type</TableHead>
                      <TableHead>Purchase Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Commission Earned</TableHead>
                      <TableHead>Referral Date</TableHead>
                      <TableHead>Conversion Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedReferrals.map((r: any) => (
                      <TableRow key={r.id} className={r.referred_user_id ? 'cursor-pointer hover:bg-muted/50' : ''} onClick={() => { if (r.referred_user_id) navigate(`/super-admin/clients/${r.referred_user_id}/transactions`); }}>
                        <TableCell>
                          <div className="font-medium">{r.referred_user_first_name} {r.referred_user_last_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">{r.referred_user_email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{r.plan_name || r.package_name || 'N/A'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{r.plan_type || 'N/A'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{r.purchase_type || 'Subscription'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>${Number(r.package_price || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" />${Number(r.commission_earned || 0).toFixed(2)}</div>
                        </TableCell>
                        <TableCell>{r.referral_date ? format(new Date(r.referral_date), 'MMM dd, yyyy') : '—'}</TableCell>
                        <TableCell>{r.conversion_date ? format(new Date(r.conversion_date), 'MMM dd, yyyy') : (r.last_purchase_date ? format(new Date(r.last_purchase_date), 'MMM dd, yyyy') : '—')}</TableCell>
                      </TableRow>
                    ))}
                    {pagedReferrals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No referrals found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between p-4">
                  <div className="text-sm">Page {page} of {Math.max(1, Math.ceil(filteredReferrals.length / pageSize))}</div>
                  <div className="flex items-center gap-2">
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                      <SelectTrigger className="w-[120px]"><SelectValue placeholder="Page size" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <Button variant="outline" disabled={page >= Math.ceil(filteredReferrals.length / pageSize)} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAffiliateProfile;
