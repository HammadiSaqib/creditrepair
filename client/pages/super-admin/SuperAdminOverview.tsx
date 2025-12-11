import { useState, useEffect } from "react";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  CreditCard,
  BarChart3,
  Shield,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
  UserCheck,
  UsersIcon,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  MessageSquare,
  FileText,
  Activity,
  Plus,
  MapPin,
  Link,
  Video,
} from "lucide-react";
import { superAdminApi } from "@/lib/api";
import { toast } from "sonner";
import SalesChatChart from "@/components/charts/SalesChatChart";
import ReportPullingChart from "@/components/charts/ReportPullingChart";
import DynamicAlertsCard from "@/components/DynamicAlertsCard";
import { calendarApi } from "@/lib/api";

// Types for super admin data
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  max_users: number;
  is_active: boolean;
  created_at: string;
}

interface AdminProfile {
  id: string;
  user_id: string;
  permissions: string[];
  access_level: 'super_admin' | 'admin' | 'moderator';
  subscription_status: 'active' | 'inactive' | 'suspended';
  last_login: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface UserManagement {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login: string;
  created_at: string;
}

interface SubscriptionManagement {
  id: string;
  admin_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  plan?: SubscriptionPlan;
  admin?: AdminProfile;
}

interface DashboardStats {
  totalPlans: number;
  activeAdmins: number;
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalTransactions: number;
  totalClients: number;
  clientsPerAdmin: number;
}

interface ClientStatistics {
  overall: {
    total: number;
    ready: number;
    notReady: number;
    fundable: number;
    notFundable: number;
  };
  byAdmin: Array<{
    admin_name: string;
    admin_email: string;
    admin_title?: string;
    admin_department?: string;
    total_clients: number;
    ready_clients: number;
    not_ready_clients: number;
    fundable_clients: number;
    not_fundable_clients: number;
  }>;
}

interface BillingTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  plan_name: string;
  plan_type: 'monthly' | 'yearly' | 'lifetime' | 'course';
  created_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface ClientWithAdmin {
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

export default function SuperAdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPlans: 0,
    activeAdmins: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    totalTransactions: 0,
    totalClients: 0,
    clientsPerAdmin: 0,
  });
  const [clientStats, setClientStats] = useState<ClientStatistics | null>(null);
  const [salesChatData, setSalesChatData] = useState<any[]>([]);
  const [reportPullingData, setReportPullingData] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  
  // New state for events and invitations
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [invitationForm, setInvitationForm] = useState({
    email: '',
    type: '',
    name: '',
    meetingLink: '',
    bulkRecipients: [] as string[]
  });
  const [recentInvitations, setRecentInvitations] = useState<any[]>([]);
  const [invitationLoading, setInvitationLoading] = useState(false);
  
  // Event scheduling state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'meeting', // meeting, physical_event, offer
    meetingLink: '',
    location: '',
    isPhysical: false
  });
  const [eventLoading, setEventLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionManagement[]>([]);
  const [billingTransactions, setBillingTransactions] = useState<BillingTransaction[]>([]);
  const [clients, setClients] = useState<ClientWithAdmin[]>([]);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
    loadUpcomingEvents();
    loadRecentInvitations();
  }, []);

  // Load upcoming events from calendar API
  const loadUpcomingEvents = async () => {
    setEventsLoading(true);
    try {
      // Use the dedicated upcoming admin events endpoint
      const response = await fetch('/api/calendar/admin/upcoming', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.upcoming_events) {
        setUpcomingEvents(data.data.upcoming_events);
      } else {
        console.warn('No upcoming events data:', data);
        setUpcomingEvents([]);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      // Use fallback mock data if API fails
      setUpcomingEvents([
        {
          id: 1,
          title: "Credit Report Pull - John Doe",
          date: new Date().toISOString(),
          type: "report_pull",
          client_name: "John Doe"
        },
        {
          id: 2,
          title: "Client Meeting - Jane Smith",
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          type: "meeting",
          client_name: "Jane Smith"
        },
        {
          id: 3,
          title: "Report Review - Mike Johnson",
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          type: "review",
          client_name: "Mike Johnson"
        }
      ]);
    } finally {
      setEventsLoading(false);
    }
  };

  // Load recent invitations
  const loadRecentInvitations = async () => {
    try {
      setInvitationLoading(true);
      const response = await superAdminApi.getInvitations({ limit: 5 });
      
      if (response.data?.success && response.data.data) {
        setRecentInvitations(response.data.data || []);
      } else {
        console.error("Failed to load invitations:", response.data?.error || "Unknown error");
        // Fallback to mock data if API fails
        const mockInvitations = [
          {
            id: 1,
            email: "admin@example.com",
            type: "admin",
            status: "sent",
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            email: "client@example.com",
            type: "client",
            status: "pending",
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            email: "affiliate@example.com",
            type: "affiliate",
            status: "accepted",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setRecentInvitations(mockInvitations);
      }
    } catch (error) {
      console.error("Error loading invitations:", error);
      // Fallback to mock data on error
      const mockInvitations = [
        {
          id: 1,
          email: "admin@example.com",
          type: "admin",
          status: "sent",
          created_at: new Date().toISOString()
        }
      ];
      setRecentInvitations(mockInvitations);
    } finally {
      setInvitationLoading(false);
    }
  };

  // Handle individual invitation
  const handleSendInvitation = async () => {
    if (!invitationForm.email || !invitationForm.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate meeting link for meeting invitations
    if (invitationForm.type === 'meeting' && !invitationForm.meetingLink) {
      toast.error("Meeting link is required for meeting invitations");
      return;
    }

    setInvitationLoading(true);
    try {
      const response = await superAdminApi.sendInvitation({
        email: invitationForm.email,
        type: invitationForm.type,
        name: invitationForm.name,
        meetingLink: invitationForm.meetingLink,
        bulkRecipients: invitationForm.bulkRecipients
      });

      if (response.success) {
        // Add the new invitation to the list
        const newInvitation = response.data;
        setRecentInvitations(prev => [newInvitation, ...prev.slice(0, 4)]);
        setInvitationForm({ email: '', type: '', name: '', meetingLink: '', bulkRecipients: [] });
        
        toast.success(`Invitation sent to ${invitationForm.email}`);
      } else {
        toast.error(response.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInvitationLoading(false);
    }
  };

  // Handle CSV upload and bulk invitations
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    try {
      setInvitationLoading(true);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file must contain at least a header and one data row");
        return;
      }

      // Parse CSV (assuming format: email,name,type)
      const invitations = [];
      for (let i = 1; i < lines.length; i++) {
        const [email, name, type] = lines[i].split(',').map(s => s.trim());
        if (email && type) {
          invitations.push({ email, name: name || '', type });
        }
      }

      if (invitations.length === 0) {
        toast.error("No valid invitations found in CSV file");
        return;
      }

      const response = await superAdminApi.sendBulkInvitations(invitations);
      
      if (response.success) {
        const { sent, failed } = response.data.summary;
        toast.success(`Sent ${sent} invitations successfully. ${failed} failed.`);
        
        // Refresh the invitations list
        loadRecentInvitations();
      } else {
        toast.error(response.error || "Failed to send bulk invitations");
      }
    } catch (error) {
      console.error("Error processing CSV:", error);
      toast.error("Failed to process CSV file");
    } finally {
      setInvitationLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Download CSV template for bulk invitations
  const downloadCSVTemplate = () => {
    const csvContent = "email,name,type\nexample@email.com,John Doe,admin\nexample2@email.com,Jane Smith,client\nexample3@email.com,Bob Johnson,affiliate\nexample4@email.com,Meeting Attendee,meeting";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'invitation_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV template downloaded successfully");
  };

  // Get event type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'report_pull':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200';
      case 'meeting':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200';
      case 'review':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200';
    }
  };

  // Get event type dot color
  const getEventDotColor = (type: string) => {
    switch (type) {
      case 'report_pull':
        return 'bg-blue-500';
      case 'meeting':
        return 'bg-green-500';
      case 'review':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format relative date
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    return date.toLocaleDateString();
  };

  // Handle event creation
  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate meeting link for online meetings
    if (eventForm.type === 'meeting' && !eventForm.isPhysical && !eventForm.meetingLink) {
      toast.error("Meeting link is required for online meetings");
      return;
    }

    // Validate location for physical events
    if ((eventForm.type === 'meeting' && eventForm.isPhysical) || eventForm.type === 'physical_event') {
      if (!eventForm.location) {
        toast.error("Location is required for physical events");
        return;
      }
    }

    setEventLoading(true);
    try {
      const eventDateTime = new Date(`${eventForm.date}T${eventForm.time}`);
      
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventDateTime.toISOString(),
        time: eventForm.time, // Add the time field
        duration: '1h', // Add default duration
        type: eventForm.type,
        meeting_link: eventForm.meetingLink || null,
        location: eventForm.location || null,
        is_virtual: !eventForm.isPhysical && eventForm.type !== 'physical_event', // Set is_virtual properly
        is_physical: eventForm.isPhysical || eventForm.type === 'physical_event',
        visible_to_admins: true // Make events visible to all admins
      };

      const response = await calendarApi.createEvent(eventData);

      if (response.data?.success) {
        toast.success("Event scheduled successfully!");
        setShowEventModal(false);
        setEventForm({
          title: '',
          description: '',
          date: '',
          time: '',
          type: 'meeting',
          meetingLink: '',
          location: '',
          isPhysical: false
        });
        // Reload events to show the new one
        loadUpcomingEvents();
      } else {
        toast.error(response.data?.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } finally {
      setEventLoading(false);
    }
  };

  // Handle calendar date click
  const handleCalendarDateClick = (date: Date) => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);
    if (selected >= today) {
      setEventForm(prev => ({
        ...prev,
        date: selected.toISOString().split('T')[0]
      }));
      setShowEventModal(true);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load actual data from all endpoints
      const [plansResponse, adminsResponse, usersResponse, subscriptionsResponse, transactionsResponse, clientsResponse, clientStatsResponse, salesChatResponse, reportPullingResponse, alertsResponse] = await Promise.all([
        superAdminApi.getPlans({ limit: 1000 }),
        superAdminApi.getAdminProfiles({ limit: 1000 }),
        superAdminApi.getUsers({ limit: 1000 }),
        superAdminApi.getUserSubscriptions({ limit: 1000 }),
        superAdminApi.getBillingTransactions({ limit: 1000 }),
        superAdminApi.getClients({ limit: 1000 }),
        superAdminApi.getClientStatistics(),
        superAdminApi.getSalesChatAnalytics(),
        superAdminApi.getReportPullingAnalytics(),
        superAdminApi.getRecentAlerts()
      ]);

      

      // Extract data from responses - APIs return nested data structure
        const plansData = plansResponse?.data?.data || [];
        const adminsData = adminsResponse?.data?.data || [];
        const usersData = usersResponse?.data?.data || [];
        const subscriptionsData = subscriptionsResponse?.data?.subscriptions || [];
        const transactionsData = transactionsResponse?.data?.transactions || [];
        const clientsData = clientsResponse?.data?.data || [];
        const clientStatsData = clientStatsResponse?.data || { overall: { total: 0, ready: 0, notReady: 0, fundable: 0, notFundable: 0 }, byAdmin: [] };

      // Set the data arrays
      setPlans(Array.isArray(plansData) ? plansData : []);
      setAdmins(Array.isArray(adminsData) ? adminsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
      setBillingTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setClientStats(clientStatsData);
      
      // Process new analytics data
      setSalesChatData(salesChatResponse?.data?.data || null);
      setReportPullingData(reportPullingResponse?.data?.data || null);
      setAlertsData(alertsResponse?.data?.data || null);

      // Calculate statistics from actual data
      const totalPlans = Array.isArray(plansData) ? plansData.length : 0;
      const activeAdmins = Array.isArray(adminsData) ? adminsData.filter((admin: any) => 
        admin.is_active === true || admin.is_active === 1 || admin.status === 'active'
      ).length : 0;
      const totalUsers = Array.isArray(usersData) ? usersData.length : 0;
      const activeSubscriptions = Array.isArray(subscriptionsData) ? subscriptionsData.filter((sub: any) => 
        sub.status === 'active'
      ).length : 0;
      
      // Calculate revenue from successful billing transactions
      const successfulTransactions = Array.isArray(transactionsData) ? 
        transactionsData.filter((transaction: any) => transaction.status === 'succeeded') : [];
      
      const totalTransactions = successfulTransactions.length;
      
      // Calculate current month revenue
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const currentMonthRevenue = successfulTransactions
        .filter((transaction: any) => {
          const transactionDate = new Date(transaction.created_at);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, transaction: any) => {
          const amount = parseFloat(transaction.amount) || 0;
          return sum + amount;
        }, 0);
      
      // Calculate previous month revenue for growth rate
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const previousMonthRevenue = successfulTransactions
        .filter((transaction: any) => {
          const transactionDate = new Date(transaction.created_at);
          return transactionDate.getMonth() === previousMonth && 
                 transactionDate.getFullYear() === previousYear;
        })
        .reduce((sum: number, transaction: any) => {
          const amount = parseFloat(transaction.amount) || 0;
          return sum + amount;
        }, 0);
      
      // Calculate growth rate
      const revenueGrowth = previousMonthRevenue > 0 ? 
        ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

      // Calculate client statistics
      const totalClients = Array.isArray(clientsData) ? clientsData.length : 0;
      const clientsPerAdmin = activeAdmins > 0 ? Math.round((totalClients / activeAdmins) * 100) / 100 : 0;

      setStats({
        totalPlans,
        activeAdmins,
        totalUsers,
        activeSubscriptions,
        monthlyRevenue: Math.round(currentMonthRevenue * 100) / 100, // Ensure proper number formatting
        revenueGrowth: Math.round(revenueGrowth * 100) / 100, // Round to 2 decimal places
        totalTransactions,
        totalClients,
        clientsPerAdmin,
      });

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon: Icon, 
    className = "" 
  }: { 
    title: string; 
    value: string | number; 
    change?: string; 
    trend?: 'up' | 'down'; 
    icon: any; 
    className?: string;
  }) => (
    <Card className={`gradient-border hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold gradient-text-primary">{value}</p>
            {change && (
              <div className={`flex items-center mt-1 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${
                  trend === 'down' ? 'rotate-180' : ''
                }`} />
                {change}
              </div>
            )}
          </div>
          <div className="gradient-primary p-3 rounded-lg">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <SuperAdminLayout 
        title="Overview" 
        description="Comprehensive administrative control panel"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-blue"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout 
      title="Super Admin Dashboard" 
      description="Comprehensive administrative control panel with advanced analytics"
    >
      <div className="space-y-8">
        {/* Enhanced Stats Overview with Modern Design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Total Plans"
            value={stats.totalPlans}
            icon={CreditCard}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200"
          />
          <StatCard
            title="Active Admins"
            value={stats.activeAdmins}
            icon={Shield}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions}
            icon={Calendar}
            className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200"
          />
        </div>

        {/* Revenue and Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Monthly Revenue"
            value={`$${(stats.monthlyRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            change={`${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth}%`}
            trend={stats.revenueGrowth >= 0 ? "up" : "down"}
            icon={DollarSign}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200"
          />
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions.toLocaleString()}
            change="successful payments"
            icon={Receipt}
            className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200"
          />
          <StatCard
            title="Total Clients"
            value={stats.totalClients.toLocaleString()}
            change="across all admins"
            icon={UserCheck}
            className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200"
          />
          <StatCard
            title="Clients per Admin"
            value={stats.clientsPerAdmin}
            change="average ratio"
            icon={UsersIcon}
            className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200"
          />
        </div>

        {/* Client Status Overview */}
        {clientStats?.overall && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              title="Ready Clients"
              value={clientStats.overall.ready?.toLocaleString() || '0'}
              change={`${((clientStats.overall.ready || 0) / Math.max(clientStats.overall.total || 1, 1) * 100).toFixed(1)}% of total`}
              icon={CheckCircle}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200"
            />
            <StatCard
              title="Not Ready Clients"
              value={clientStats.overall.notReady?.toLocaleString() || '0'}
              change={`${((clientStats.overall.notReady || 0) / Math.max(clientStats.overall.total || 1, 1) * 100).toFixed(1)}% of total`}
              icon={Clock}
              className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200"
            />
            <StatCard
              title="Fundable Clients"
              value={clientStats.overall.fundable?.toLocaleString() || '0'}
              change={`${((clientStats.overall.fundable || 0) / Math.max(clientStats.overall.total || 1, 1) * 100).toFixed(1)}% of total`}
              icon={Target}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200"
            />
            <StatCard
              title="Not Fundable Clients"
              value={clientStats.overall.notFundable?.toLocaleString() || '0'}
              change={`${((clientStats.overall.notFundable || 0) / Math.max(clientStats.overall.total || 1, 1) * 100).toFixed(1)}% of total`}
              icon={XCircle}
              className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200"
            />
          </div>
        )}
        {/* Calendar and Invitation Management Section */}
        <div className="space-y-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar Section */}
            <Card className="gradient-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-ocean-blue" />
                  <span>Upcoming Events & Report Pulls</span>
                </CardTitle>
                <CardDescription>View scheduled client events and report pulling dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Calendar View */}
                  <div className="grid grid-cols-7 gap-1 text-xs mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center font-medium text-muted-foreground p-2">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 35 }, (_, i) => {
                      const date = new Date();
                      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                      const startDate = new Date(firstDay);
                      startDate.setDate(startDate.getDate() - firstDay.getDay());
                      const currentDate = new Date(startDate);
                      currentDate.setDate(currentDate.getDate() + i);
                      
                      const isCurrentMonth = currentDate.getMonth() === date.getMonth();
                      const isToday = currentDate.toDateString() === date.toDateString();
                      const hasEvent = Math.random() > 0.8; // Mock events
                      
                      return (
                        <div
                          key={i}
                          onClick={() => handleCalendarDateClick(currentDate)}
                          className={`
                            relative p-2 text-center rounded-md cursor-pointer transition-colors
                            ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                            ${isToday ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                            ${hasEvent && isCurrentMonth ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                            ${currentDate >= new Date(new Date().setHours(0,0,0,0)) ? 'hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'cursor-not-allowed opacity-50'}
                          `}
                        >
                          <span className="text-sm">{currentDate.getDate()}</span>
                          {hasEvent && isCurrentMonth && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Upcoming Events List */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center justify-between">
                      <span>Upcoming This Week</span>
                      {eventsLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      )}
                    </h4>
                    <div className="space-y-2">
                      {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event) => (
                          <div 
                            key={event.id} 
                            className={`flex items-center justify-between p-2 rounded-lg border ${getEventTypeColor(event.type)}`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${getEventDotColor(event.type)}`}></div>
                              <span className="text-sm">{event.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeDate(event.date)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No upcoming events this week
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invitation Management Section */}
            <Card className="gradient-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-ocean-blue" />
                  <span>Send Invitations</span>
                </CardTitle>
                <CardDescription>Send individual or bulk invitation emails</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Individual Invitation */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Individual Invitation</h4>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={invitationForm.email}
                        onChange={(e) => setInvitationForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                      />
                      <input
                        type="text"
                        placeholder="Enter name (optional)"
                        value={invitationForm.name}
                        onChange={(e) => setInvitationForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                      />
                      <select 
                        value={invitationForm.type}
                        onChange={(e) => setInvitationForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                      >
                        <option value="">Select invitation type</option>
                        <option value="admin">Admin Invitation</option>
                        <option value="client">Client Invitation</option>
                        <option value="affiliate">Affiliate Invitation</option>
                        <option value="meeting">Meeting Invitation</option>
                      </select>
                      
                      {/* Meeting Link Input - Only show for meeting invitations */}
                      {invitationForm.type === 'meeting' && (
                        <input
                          type="url"
                          placeholder="Enter meeting link (e.g., https://zoom.us/j/123456789)"
                          value={invitationForm.meetingLink}
                          onChange={(e) => setInvitationForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                        />
                      )}
                      
                      {/* Bulk Recipient Options for Meeting Invitations */}
                      {invitationForm.type === 'meeting' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Send to:</label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={invitationForm.bulkRecipients?.includes('all_admins') || false}
                                onChange={(e) => {
                                  const recipients = invitationForm.bulkRecipients || [];
                                  if (e.target.checked) {
                                    setInvitationForm(prev => ({ 
                                      ...prev, 
                                      bulkRecipients: [...recipients, 'all_admins'] 
                                    }));
                                  } else {
                                    setInvitationForm(prev => ({ 
                                      ...prev, 
                                      bulkRecipients: recipients.filter(r => r !== 'all_admins') 
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">All Administrators</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={invitationForm.bulkRecipients?.includes('support_team') || false}
                                onChange={(e) => {
                                  const recipients = invitationForm.bulkRecipients || [];
                                  if (e.target.checked) {
                                    setInvitationForm(prev => ({ 
                                      ...prev, 
                                      bulkRecipients: [...recipients, 'support_team'] 
                                    }));
                                  } else {
                                    setInvitationForm(prev => ({ 
                                      ...prev, 
                                      bulkRecipients: recipients.filter(r => r !== 'support_team') 
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">Support Team</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={invitationForm.bulkRecipients?.includes('all_clients') || false}
                                onChange={(e) => {
                                  const recipients = invitationForm.bulkRecipients || [];
                                  if (e.target.checked) {
                                    setInvitationForm(prev => ({ 
                                      ...prev, 
                                      bulkRecipients: [...recipients, 'all_clients'] 
                                    }));
                                  } else {
                                    setInvitationForm(prev => ({ 
                                      ...prev, 
                                      bulkRecipients: recipients.filter(r => r !== 'all_clients') 
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">All Admin Clients</span>
                            </label>
                          </div>
                        </div>
                      )}
                      <button 
                        onClick={handleSendInvitation}
                        disabled={invitationLoading}
                        className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {invitationLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          'Send Invitation'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bulk CSV Upload */}
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-sm">Bulk CSV Upload</h4>
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="cursor-pointer flex flex-col items-center space-y-2"
                        >
                          <FileText className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload CSV file
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Format: email, type, name
                          </span>
                        </label>
                      </div>
                      <button
                        onClick={downloadCSVTemplate}
                        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Download CSV Template</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Invitations */}
                  <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-sm">Recent Invitations</h4>
                    <div className="space-y-1">
                      {recentInvitations.length > 0 ? (
                        recentInvitations.map((invitation) => (
                          <div key={invitation.id} className="flex items-center justify-between text-xs">
                            <span className="truncate flex-1 mr-2">{invitation.email}</span>
                            <Badge 
                              variant="outline" 
                              className={`
                                ${invitation.status === 'sent' ? 'text-green-600 border-green-200' : ''}
                                ${invitation.status === 'pending' ? 'text-blue-600 border-blue-200' : ''}
                                ${invitation.status === 'accepted' ? 'text-green-600 border-green-200' : ''}
                                ${invitation.status === 'failed' ? 'text-red-600 border-red-200' : ''}
                              `}
                            >
                              {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          No recent invitations
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Overview Section - System Health and Alerts */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="gradient-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-ocean-blue" />
                  <span>System Health</span>
                </CardTitle>
                <CardDescription>Overall system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <span className="text-sm font-medium">Server Uptime</span>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      99.9%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <span className="text-sm font-medium">Database Health</span>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Excellent
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <span className="text-sm font-medium">API Response Time</span>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      &lt;120ms
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DynamicAlertsCard data={alertsData} loading={loading} onRefresh={loadDashboardData} />
          </div>

          {/* Client Statistics by Admin */}
          {clientStats?.byAdmin?.length > 0 && (
            <Card className="gradient-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-ocean-blue" />
                  <span>Client Statistics by Admin</span>
                </CardTitle>
                <CardDescription>Detailed breakdown of client status across all administrators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold">Admin</th>
                        <th className="text-center py-3 px-4 font-semibold">Total</th>
                        <th className="text-center py-3 px-4 font-semibold">Ready</th>
                        <th className="text-center py-3 px-4 font-semibold">Not Ready</th>
                        <th className="text-center py-3 px-4 font-semibold">Fundable</th>
                        <th className="text-center py-3 px-4 font-semibold">Not Fundable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientStats.byAdmin.map((admin, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{admin.admin_name}</div>
                              <div className="text-xs text-muted-foreground">{admin.admin_email}</div>
                            </div>
                          </td>
                          <td className="text-center py-4 px-4 font-semibold">{admin.total_clients}</td>
                          <td className="text-center py-4 px-4">
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              {admin.ready_clients}
                            </Badge>
                          </td>
                          <td className="text-center py-4 px-4">
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                              {admin.not_ready_clients}
                            </Badge>
                          </td>
                          <td className="text-center py-4 px-4">
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              {admin.fundable_clients}
                            </Badge>
                          </td>
                          <td className="text-center py-4 px-4">
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                              {admin.not_fundable_clients}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sales Chat Section */}
        <div className="space-y-6 mt-8">
          <SalesChatChart data={salesChatData} loading={loading} />
        </div>

        {/* Reports Section */}
        <div className="space-y-6 mt-8">
          <ReportPullingChart data={reportPullingData} loading={loading} />
        </div>

        {/* Additional Alerts Configuration */}
        <div className="space-y-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="gradient-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-ocean-blue" />
                  <span>Alert Configuration</span>
                </CardTitle>
                <CardDescription>Manage alert thresholds and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <span className="text-sm font-medium">High API Usage Alert</span>
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      80% threshold
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <span className="text-sm font-medium">Low System Performance</span>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Enabled
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <span className="text-sm font-medium">Subscription Expiry Alerts</span>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      7 days notice
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        
      </div>

      {/* Event Scheduling Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-ocean-blue" />
              <span>Schedule Event</span>
            </DialogTitle>
            <DialogDescription>
              Create a new event that will be visible to all admins on their dashboard calendars.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title *</Label>
              <Input
                id="event-title"
                placeholder="Enter event title"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                placeholder="Enter event description (optional)"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date *</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">Time *</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={eventForm.time}
                  onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type *</Label>
              <Select value={eventForm.type} onValueChange={(value) => setEventForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4" />
                      <span>Meeting</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="physical_event">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Physical Event</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="report_pull">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Report Pull</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>Other</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meeting Type Selection for Meetings */}
            {eventForm.type === 'meeting' && (
              <div className="space-y-3">
                <Label>Meeting Type</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="meetingType"
                      checked={!eventForm.isPhysical}
                      onChange={() => setEventForm(prev => ({ ...prev, isPhysical: false }))}
                      className="text-blue-600"
                    />
                    <Video className="h-4 w-4" />
                    <span className="text-sm">Online Meeting</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="meetingType"
                      checked={eventForm.isPhysical}
                      onChange={() => setEventForm(prev => ({ ...prev, isPhysical: true }))}
                      className="text-blue-600"
                    />
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Physical Meeting</span>
                  </label>
                </div>
              </div>
            )}

            {/* Meeting Link Input - Only for online meetings */}
            {eventForm.type === 'meeting' && !eventForm.isPhysical && (
              <div className="space-y-2">
                <Label htmlFor="meeting-link">Meeting Link *</Label>
                <div className="flex space-x-2">
                  <Link className="h-4 w-4 mt-3 text-muted-foreground" />
                  <Input
                    id="meeting-link"
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    value={eventForm.meetingLink}
                    onChange={(e) => setEventForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Location Input - For physical events and physical meetings */}
            {((eventForm.type === 'meeting' && eventForm.isPhysical) || eventForm.type === 'physical_event') && (
              <div className="space-y-2">
                <Label htmlFor="event-location">Location *</Label>
                <div className="flex space-x-2">
                  <MapPin className="h-4 w-4 mt-3 text-muted-foreground" />
                  <Input
                    id="event-location"
                    placeholder="Enter physical location or address"
                    value={eventForm.location}
                    onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={eventLoading}>
              {eventLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Event</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
