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
  const [agreements, setAgreements] = useState<any[]>([]);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<any | null>(null);
  const [agreementForm, setAgreementForm] = useState({ title: '', content: '' });
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [showAgreementsDropdown, setShowAgreementsDropdown] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);
  const [showDefaultTemplateModal, setShowDefaultTemplateModal] = useState(false);
  const [defaultTemplateLoading, setDefaultTemplateLoading] = useState(false);
  const [defaultTemplateSaving, setDefaultTemplateSaving] = useState(false);
  const [defaultTemplateForm, setDefaultTemplateForm] = useState({ name: '', description: '', content: '' });

  useEffect(() => {
    fetchAgreements();
  }, []);

  async function fetchAgreements() {
    try {
      const res = await fetch('/api/contract-agreements');
      const data = await res.json();
      setAgreements(Array.isArray(data) ? data : []);
    } catch {
      setAgreements([]);
    }
  }

  function onEditAgreement(agreement: any) {
    setEditingAgreement(agreement);
    setAgreementForm({ title: agreement.title, content: agreement.content });
    setShowAgreementModal(true);
  }

  async function handleAgreementSave(e: React.FormEvent) {
    e.preventDefault();
    setAgreementLoading(true);
    try {
      const method = editingAgreement ? 'PUT' : 'POST';
      const url = editingAgreement ? `/api/contract-agreements/${editingAgreement.id}` : '/api/contract-agreements';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agreementForm),
      });
      setShowAgreementModal(false);
      setEditingAgreement(null);
      setAgreementForm({ title: '', content: '' });
      fetchAgreements();
    } finally {
      setAgreementLoading(false);
    }
  }

  async function onDeleteAgreement(id: number) {
    if (!window.confirm('Delete this agreement?')) return;
    setAgreementLoading(true);
    try {
      await fetch(`/api/contract-agreements/${id}`, { method: 'DELETE' });
      fetchAgreements();
    } finally {
      setAgreementLoading(false);
    }
  }

  async function openDefaultTemplateModal() {
    setShowDefaultTemplateModal(true);
    setDefaultTemplateLoading(true);
    try {
      const resp = await superAdminApi.getDefaultContractTemplate();
      const tpl = resp.data?.data || resp.data;
      setDefaultTemplateForm({
        name: tpl?.name || 'Default Agreement',
        description: tpl?.description || 'Default master agreement',
        content: tpl?.content || '',
      });
    } catch (error) {
      console.error('Failed to load default template', error);
      setDefaultTemplateForm({ name: 'Default Agreement', description: 'Default master agreement', content: '' });
    } finally {
      setDefaultTemplateLoading(false);
    }
  }

  async function saveDefaultTemplate(e: React.FormEvent) {
    e.preventDefault();
    setDefaultTemplateSaving(true);
    try {
      await superAdminApi.updateDefaultContractTemplate(defaultTemplateForm);
      setShowDefaultTemplateModal(false);
    } finally {
      setDefaultTemplateSaving(false);
    }
  }

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
      let url = `/api/super-admin/admins/${adminId}/agreement.pdf`;
      if (selectedAgreement?.id) {
        url += `?agreementId=${selectedAgreement.id}`;
      }
      const resp = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = `admin_${adminId}_agreement.pdf`;
      a.click();
      URL.revokeObjectURL(urlObj);
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
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <div className="flex">
                      <Button
                        variant="outline"
                        onClick={downloadAgreementPdf}
                        disabled={downloadingAgreement || !adminId}
                        className="rounded-r-none"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {downloadingAgreement ? 'Downloading…' : 'Agreement PDF'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none px-2"
                        disabled={agreements.length === 0}
                        onClick={() => setShowAgreementsDropdown((v: boolean) => !v)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                      </Button>
                    </div>
                    {showAgreementsDropdown && agreements.length > 0 && (
                      <div
                        className="absolute right-0 mt-2 w-56 max-h-64 overflow-auto bg-white border rounded shadow-lg z-50"
                        style={{ top: '100%', minWidth: 200 }}
                      >
                        {agreements.map((agreement) => (
                          <div
                            key={agreement.id}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${selectedAgreement?.id === agreement.id ? 'bg-gray-100 font-semibold' : ''}`}
                            onClick={() => {
                              setSelectedAgreement(agreement);
                              setShowAgreementsDropdown(false);
                            }}
                          >
                            {agreement.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
  {/* Agreements Management Card */}
  <Card className="lg:col-span-2">
    <CardHeader className="flex flex-row items-center justify-between gap-3">
      <CardTitle>Agreements Management</CardTitle>
      <div className="flex items-center gap-2">
        <Button variant="destructive" onClick={openDefaultTemplateModal}>
          Set Default Agreement
        </Button>
        <Button variant="outline" onClick={() => setShowAgreementModal(true)}>
          Add Agreement
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {agreements.length === 0 && (
          <div className="text-gray-500">No agreements yet.</div>
        )}
        {agreements.map((agreement) => (
          <div key={agreement.id} className="flex items-center justify-between border rounded p-3">
            <div>
              <div className="font-semibold">{agreement.title}</div>
              <div className="text-gray-600 text-sm line-clamp-2 max-w-xl">{agreement.content}</div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => onEditAgreement(agreement)}><span className="sr-only">Edit</span><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z"></path></svg></Button>
              <Button size="icon" variant="ghost" onClick={() => onDeleteAgreement(agreement.id)}><span className="sr-only">Delete</span><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"></path></svg></Button>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>

  {/* Agreement Modal */}
  {showAgreementModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative">
        <h2 className="text-xl font-semibold mb-4">{editingAgreement ? 'Edit Agreement' : 'Add Agreement'}</h2>
        <form onSubmit={handleAgreementSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={agreementForm.title}
              onChange={e => setAgreementForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              className="w-full border rounded px-3 py-2 resize-y min-h-[80px] max-h-[400px]"
              value={agreementForm.content}
              onChange={e => setAgreementForm(f => ({ ...f, content: e.target.value }))}
              required
              style={{ minHeight: 80, maxHeight: 400 }}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => { setShowAgreementModal(false); setEditingAgreement(null); setAgreementForm({ title: '', content: '' }); }}>Cancel</Button>
            <Button type="submit" disabled={agreementLoading}>{agreementLoading ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </div>
    </div>
  )}
  {/* Default Template Modal */}
  {showDefaultTemplateModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl relative">
        <h2 className="text-xl font-semibold mb-4">Edit Default Agreement</h2>
        <form onSubmit={saveDefaultTemplate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={defaultTemplateForm.name}
                onChange={e => setDefaultTemplateForm(f => ({ ...f, name: e.target.value }))}
                required
                disabled={defaultTemplateLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={defaultTemplateForm.description}
                onChange={e => setDefaultTemplateForm(f => ({ ...f, description: e.target.value }))}
                disabled={defaultTemplateLoading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content (HTML)</label>
            <textarea
              className="w-full border rounded px-3 py-2 resize-y min-h-[200px]"
              value={defaultTemplateForm.content}
              onChange={e => setDefaultTemplateForm(f => ({ ...f, content: e.target.value }))}
              required
              disabled={defaultTemplateLoading}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowDefaultTemplateModal(false); setDefaultTemplateLoading(false); }}
              disabled={defaultTemplateSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={defaultTemplateSaving || defaultTemplateLoading}>
              {defaultTemplateSaving ? 'Saving…' : 'Save Default'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )}
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
