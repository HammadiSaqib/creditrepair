import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

import { superAdminApi } from '../../lib/api';
import { 
  Search, 
  Filter, 
  Eye, 
  UserCheck, 
  Download, 
  Calendar,
  Mail,
  Phone,
  Clock,
  Users,
  CheckCircle,
  Pause
} from 'lucide-react';



interface Client {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'completed' | 'on_hold';
  created_at: string;
  admin_name?: string;
  admin_email?: string;
  admin_title?: string;
  admin_department?: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  completedClients: number;
  onHoldClients: number;
  newClientsToday: number;
}

const UserManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    completedClients: 0,
    onHoldClients: 0,
    newClientsToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 15;

  useEffect(() => {
    fetchClients();
    fetchClientStats();
  }, [currentPage, searchTerm, statusFilter, adminFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await superAdminApi.getClients({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
        admin: adminFilter === 'all' ? undefined : adminFilter
      });
      
      if (response.data) {
        setClients(response.data.clients || response.data.data || response.data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        } else {
          setTotalPages(Math.ceil((response.data.total || response.data.length) / itemsPerPage));
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientStats = async () => {
    try {
      const response = await superAdminApi.getClients();
      const clientsData = response.data?.clients || response.data?.data || response.data || [];
      
      const today = new Date().toDateString();
      const newToday = clientsData.filter((client: Client) => 
        new Date(client.created_at).toDateString() === today
      ).length;
      
      setClientStats({
        totalClients: response.data?.pagination?.total || clientsData.length,
        activeClients: clientsData.filter((c: Client) => c.status === 'active').length,
        completedClients: clientsData.filter((c: Client) => c.status === 'completed').length,
        onHoldClients: clientsData.filter((c: Client) => c.status === 'on_hold').length,
        newClientsToday: newToday
      });
    } catch (error) {
      console.error('Error fetching client stats:', error);
    }
  };



  const getClientStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: 'up' | 'down';
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-full ${
            trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <Icon className={`h-4 w-4 ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-blue-600'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
        </div>
      </div>



      {/* Main Content */}
      <div className="space-y-4">
          {/* Client Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Clients"
              value={(clientStats.totalClients || 0).toLocaleString()}
              icon={Users}
            />
            <StatCard
              title="Active Clients"
              value={(clientStats.activeClients || 0).toLocaleString()}
              icon={UserCheck}
              trend="up"
            />
            <StatCard
              title="Completed"
              value={clientStats.completedClients}
              icon={CheckCircle}
              trend="up"
            />
            <StatCard
              title="On Hold"
              value={clientStats.onHoldClients}
              icon={Pause}
            />
            <StatCard
              title="New Today"
              value={clientStats.newClientsToday}
              icon={Calendar}
              trend="up"
            />
          </div>

          {/* Client Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={adminFilter} onValueChange={setAdminFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by admin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Admins</SelectItem>
                    {/* Dynamic admin options will be populated from client data */}
                    {Array.from(new Set(clients.map(client => client.admin_name).filter(Boolean))).map(adminName => (
                      <SelectItem key={adminName} value={adminName}>{adminName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Client Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading clients...
                      </TableCell>
                    </TableRow>
                  ) : clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No clients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="font-medium">
                            {client.first_name} {client.last_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{client.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{client.phone || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getClientStatusBadgeColor(client.status)}>
                            {client.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{client.admin_name || 'N/A'}</div>
                            {client.admin_title && (
                              <div className="text-sm text-muted-foreground">{client.admin_title}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{new Date(client.created_at).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </div>


    </div>
  );
};

export default UserManagement;