import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useParams } from 'react-router-dom';
import { api, superAdminApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Download } from 'lucide-react';

function toCsv(filename: string, headers: string[], rows: Array<Record<string, any>>) {
  const lines = [headers.join(',')].concat(
    (rows || []).map((r) => headers.map((h) => JSON.stringify(r?.[h] ?? '')).join(','))
  );
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDetails() {
  const { id } = useParams();
  const adminId = Number(id);
  const [admin, setAdmin] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingAgreement, setDownloadingAgreement] = useState(false);

  const exportTransactions = () => {
    const headers = ['Date', 'Status', 'Amount', 'Method', 'Plan'];
    const rows = transactions.map((t) => ({
      Date: t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : '',
      Status: t.status ?? '',
      Amount: typeof t.amount === 'number' ? Number(t.amount).toFixed(2) : '',
      Method: t.payment_method ?? '',
      Plan: t.plan_name ?? '',
    }));
    toCsv(`admin_${adminId}_transactions.csv`, headers, rows);
  };

  const exportClients = () => {
    const headers = ['Name', 'Email', 'Status', 'Created'];
    const rows = clients.map((c) => ({
      Name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      Email: c.email ?? '',
      Status: c.status ?? '',
      Created: c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : '',
    }));
    toCsv(`admin_${adminId}_clients.csv`, headers, rows);
  };

  const exportActivityLogs = () => {
    const headers = ['Time', 'Type', 'Description', 'IP'];
    const rows = activities.map((a) => ({
      Time: a.created_at ? new Date(a.created_at).toISOString() : '',
      Type: a.activity_type ?? '',
      Description: a.description ?? '',
      IP: a.ip_address ?? '',
    }));
    toCsv(`admin_${adminId}_activity_logs.csv`, headers, rows);
  };

  const downloadAgreementPdf = async () => {
    try {
      setDownloadingAgreement(true);
      const resp = await api.get(`/api/super-admin/admins/${adminId}/agreement.pdf`, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin_${adminId}_agreement.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingAgreement(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [adminRes, txnRes, clientsRes, logsRes] = await Promise.all([
          superAdminApi.getAdminProfile(adminId),
          superAdminApi.getBillingTransactions({ user_id: String(adminId), limit: 50 }),
          superAdminApi.getClients({ page: 1, limit: 50, user_id: String(adminId) }),
          superAdminApi.getUserActivity(adminId, { page: 1, limit: 50 })
        ]);
        setAdmin(adminRes.data?.data || adminRes.data);
        setTransactions(Array.isArray(txnRes.data?.transactions) ? txnRes.data.transactions : []);
        const clientData = clientsRes.data?.data || clientsRes.data; 
        setClients(Array.isArray(clientData) ? clientData : []);
        const logsData = logsRes.data?.data || logsRes.data;
        setActivities(Array.isArray(logsData) ? logsData : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [adminId]);

  return (
    <SuperAdminLayout title="Admin Details" description="Transactions, clients, and activity logs">
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin</CardTitle>
          </CardHeader>
          <CardContent>
            {admin ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{admin.first_name} {admin.last_name}</div>
                  <div className="text-sm text-gray-600">{admin.email}</div>
                </div>s
                <div className="flex gap-3">
                  <Button variant="outline" onClick={downloadAgreementPdf} disabled={downloadingAgreement || !adminId}>
                    <Download className="h-4 w-4 mr-1" />
                    {downloadingAgreement ? 'Downloading…' : 'Agreement PDF'}
                  </Button>
                  <Badge variant="outline">{admin.role}</Badge>
                  {admin.plan_name && <Badge variant="secondary">{admin.plan_name} {admin.plan_type ? `(${admin.plan_type})` : ''}</Badge>}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Loading admin…</div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Transactions</CardTitle>
              <Button variant="outline" onClick={exportTransactions} disabled={transactions.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Plan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={`${t.id}-${t.created_at}`}>
                        <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</TableCell>
                        <TableCell><Badge className="capitalize" variant="outline">{t.status || '—'}</Badge></TableCell>
                        <TableCell>{typeof t.amount === 'number' ? `$${Number(t.amount).toFixed(2)}` : '—'}</TableCell>
                        <TableCell>{t.payment_method || '—'}</TableCell>
                        <TableCell>{t.plan_name || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {transactions.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-gray-500">No transactions</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Clients</CardTitle>
              <Button variant="outline" onClick={exportClients} disabled={clients.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.first_name} {c.last_name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{c.status}</Badge></TableCell>
                        <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                    {clients.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-gray-500">No clients</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Activity Logs</CardTitle>
            <Button variant="outline" onClick={exportActivityLogs} disabled={activities.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</TableCell>
                      <TableCell className="capitalize">{a.activity_type}</TableCell>
                      <TableCell>{a.description}</TableCell>
                      <TableCell>{a.ip_address || '—'}</TableCell>
                    </TableRow>
                  ))}
                  {activities.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-500">No activity</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
