import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2, AlertCircle, Upload, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FundingManagerLayout from '@/components/FundingManagerLayout';

interface Bank {
  id: number;
  name: string;
  logo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BankStats {
  total: number;
  active: number;
  inactive: number;
}

const BankManagement: React.FC = () => {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [stats, setStats] = useState<BankStats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100); // Default to show up to 100 per page
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 1 });

  // Fetch banks from API
  const fetchBanks = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('limit', String(limit));
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in as a funding manager.');
      }
      
      const response = await fetch(`${API_BASE}/api/banks?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (response.status === 403) {
        throw new Error('Access denied. You need funding manager or admin privileges to view banks.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch banks (${response.status})`);
      }
      
      const data = await response.json();
      setBanks(data.banks || []);
      if (data.pagination) {
        setPagination({
          page: Number(data.pagination.page) || 1,
          limit: Number(data.pagination.limit) || limit,
          total: Number(data.pagination.total) || 0,
          totalPages: Number(data.pagination.totalPages) || 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch banks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in as a funding manager.');
      }
      
      const response = await fetch(`${API_BASE}/api/banks/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (response.status === 403) {
        throw new Error('Access denied. You need funding manager or admin privileges to view bank statistics.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch bank statistics (${response.status})`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchBanks();
    fetchStats();
  }, [searchTerm, statusFilter, page, limit]);

  const resetForm = () => {
    setFormData({
      name: '',
      logo: '',
    });
    setEditingBank(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingBank ? `${API_BASE}/api/banks/${editingBank.id}` : `${API_BASE}/api/banks`;
      const method = editingBank ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save bank');
      }
      
      resetForm();
      fetchBanks();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bank');
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      logo: bank.logo || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bank?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/banks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete bank');
      
      fetchBanks();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bank');
    }
  };

  const toggleBankStatus = async (bank: Bank) => {
    try {
      const response = await fetch(`${API_BASE}/api/banks/${bank.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ is_active: !bank.is_active }),
      });
      
      if (!response.ok) throw new Error('Failed to update bank status');
      
      fetchBanks();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bank status');
    }
  };

  // Server handles search/status filtering via query params; use response as-is
  const filteredBanks = banks;

  if (loading) {
    return (
      <FundingManagerLayout title="Bank Management" description="Manage your banking partners and institutions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </FundingManagerLayout>
    );
  }

  return (
    <FundingManagerLayout title="Bank Management" description="Manage your banking partners and institutions">
      <div className="p-6 max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error Loading Banks
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setError(null);
                      fetchBanks();
                      fetchStats();
                    }}
                    className="text-sm bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Banks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Banks</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-red-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive Banks</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search banks..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Per page</label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={limit}
                  onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value, 10)); }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bank
            </button>
            <button
              onClick={async () => {
                const params = new URLSearchParams();
                if (searchTerm) params.append('search', searchTerm);
                if (statusFilter !== 'all') params.append('status', statusFilter);
                const token = localStorage.getItem('auth_token');
                const res = await fetch(`${API_BASE}/api/banks/export?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) return;
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'banks_export.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <label className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const token = localStorage.getItem('auth_token');
                  const fd = new FormData();
                  fd.append('file', file);
                  const res = await fetch(`${API_BASE}/api/banks/import`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
                  if (res.ok) { fetchBanks(); fetchStats(); }
                  e.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingBank ? 'Edit Bank' : 'Add New Bank'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter bank name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingBank ? 'Update Bank' : 'Add Bank'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Banks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBanks.map((bank) => (
            <div
              key={bank.id}
              onClick={() => navigate(`/funding-manager/banks/${bank.id}`)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-blue-300"
            >
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Bank Logo */}
                  <div className="mb-4">
                    {bank.logo ? (
                      <img
                        src={bank.logo}
                        alt={bank.name}
                        className="h-16 w-16 rounded-lg object-contain border-2 border-gray-200 bg-white p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-gray-200 ${bank.logo ? 'hidden' : ''}`}>
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  {/* Bank Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{bank.name}</h3>
                  
                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bank.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bank.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(bank);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(bank.id);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setPage(pagination.totalPages)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
        
        {/* Empty State */}
        {filteredBanks.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No banks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first bank.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
    </FundingManagerLayout>
  );
};

export default BankManagement;