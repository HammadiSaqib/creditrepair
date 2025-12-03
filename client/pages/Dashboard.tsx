import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Users,
  FileText,
  Search,
  MoreHorizontal,
  TrendingUp,
  Calendar,
  UserPlus,
  Filter,
  Download,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
  Award,
  BarChart3,
  Crown,
  DollarSign,
  Settings,
  Lock,
  Unlock,
  Copy,
  Building2,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clientsApi, analyticsApi, apiRequest, api, creditReportScraperApi, authApi } from "@/lib/api";
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useAuthContext } from "@/contexts/AuthContext";
import PaymentPrompt from "@/components/PaymentPrompt";
import RestrictedFeature from "@/components/RestrictedFeature";
import AdminCalendar from "@/components/AdminCalendar";
import { EmailVerificationModal } from "@/components/EmailVerificationModal";
import AdminContractPrompt from "@/components/AdminContractPrompt";

type DashboardStats = {
  totalClients: number;
  loginEnabled: number;
  loginDisabled: number;
  fundable: number;
  notFundable: number;
  reportPulls: number;
  fundingInvoicesPaid: number;
  totalBanks: number;
  totalCards: number;
};

type DashboardClient = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  creditScore: number;
  previousScore: number;
  lastReport: string;
  disputesActive: number;
  progress: string;
  joinDate: string;
};

type Activity = {
  id: number;
  type: string;
  client: string;
  description: string;
  time: string;
  status: string;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "New":
      return "bg-green-100 text-green-800 border-green-200";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Completed":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getProgressIcon = (progress: string) => {
  switch (progress) {
    case "improving":
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case "stable":
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    case "new":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "improved":
      return <Star className="h-4 w-4 text-green-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />;
  }
};

const getScoreChange = (current: number, previous: number) => {
  const change = current - previous;
  return {
    value: change,
    isPositive: change >= 0,
    icon: change >= 0 ? ArrowUp : ArrowDown,
    color: change >= 0 ? "text-green-600" : "text-red-600",
  };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useAuthContext();
  const subscriptionStatus = useSubscriptionStatus();
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAffiliateAccess, setHasAffiliateAccess] = useState(false);
  const [affiliateVerificationStatus, setAffiliateVerificationStatus] = useState<string | null>(null);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [affiliateLink, setAffiliateLink] = useState<string>("");
  const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    loginEnabled: 0,
    loginDisabled: 0,
    fundable: 0,
    notFundable: 0,
    reportPulls: 0,
    fundingInvoicesPaid: 0,
    totalBanks: 0,
    totalCards: 0,
  });
  const [clients, setClients] = useState<DashboardClient[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState([
    { date: 20, month: new Date().getMonth(), year: new Date().getFullYear(), client: "John Smith", type: "Letter", description: "Letter sending day" },
    { date: 15, month: new Date().getMonth(), year: new Date().getFullYear(), client: "Sarah Johnson", type: "Class", description: "Class online" },
    { date: 25, month: new Date().getMonth(), year: new Date().getFullYear(), client: "Michael Brown", type: "Meeting", description: "Client consultation" },
    { date: new Date().getDate(), month: new Date().getMonth(), year: new Date().getFullYear(), client: "Current Client", type: "Review", description: "Credit report review" }
  ]);
  const [newClient, setNewClient] = useState({
    platform: "",
    email: "",
    password: "",
    ssnLast4: "",
  });
  const [showDashboardPassword, setShowDashboardPassword] = useState(false);
  const creditReportRegisterUrl = "https://myfreescorenow.com/enroll/?AID=adrwealthadvisorsllc&PID=78140";

  useEffect(() => {
    fetchDashboardData();
    checkAffiliateAccess();
  }, []);

  // Open email verification modal ONLY after purchase (active subscription)
  useEffect(() => {
    // Auto-open verification modal after first purchase if email not verified
    const shouldOpen =
      !subscriptionStatus.isLoading &&
      subscriptionStatus.hasActiveSubscription &&
      (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') &&
      !userProfile?.email_verified;

    setIsEmailVerificationModalOpen(!!shouldOpen);
  }, [userProfile, subscriptionStatus.hasActiveSubscription, subscriptionStatus.isLoading]);

  const checkAffiliateAccess = async () => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') {
      try {
        const affiliateResponse = await api.get('/api/auth/affiliate/status');
        const { status, affiliate_id, referral_slug } = affiliateResponse.data || {};
        setHasAffiliateAccess(true);
        setAffiliateVerificationStatus(status || null);
        if (affiliate_id) {
          setAffiliateId(String(affiliate_id));
          const refPart = referral_slug && typeof referral_slug === 'string' && referral_slug.length > 0 
            ? referral_slug 
            : String(affiliate_id);
          setAffiliateLink(`${window.location.origin}/ref/${refPart}`);
        } else {
          setAffiliateId(null);
          setAffiliateLink("");
        }
      } catch (error) {
        setHasAffiliateAccess(false);
        setAffiliateVerificationStatus(null);
        setAffiliateId(null);
        setAffiliateLink("");
      }
    }
  };

  const handleAffiliateProAccess = () => {
    if (affiliateVerificationStatus === 'pending_verification') {
      // Navigate to email verification page
      navigate('/affiliate/verify-email');
    } else if (affiliateVerificationStatus === 'active') {
      // Navigate to affiliate dashboard
      navigate('/affiliate/dashboard');
    } else {
      // Show error or contact support
      toast({
        title: "Access Issue",
        description: "Please contact support to activate your affiliate access.",
        variant: "destructive",
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Test basic API connectivity using our axios-based API client
      try {
        console.log("Testing basic API connectivity...");
        const pingResponse = await api.get("/api/ping");
        console.log("Ping response:", pingResponse.data);
      } catch (pingError) {
        console.error("Ping test failed:", pingError);
      }

      // Try to fetch real data from API with error handling
      const [statsResponse, clientsResponse, activityResponse, banksStatsResponse, cardsStatsResponse] =
        await Promise.all([
          analyticsApi
            .getDashboardAnalytics()
            .catch((err) => ({ error: err.message })),
          clientsApi
            .getClients({ limit: 5 })
            .catch((err) => ({ error: err.message })),
          analyticsApi
            .getRecentActivities(4)
            .catch((err) => ({ error: err.message })),
          api
            .get('/api/banks/stats')
            .catch((err) => ({ error: err.message })),
          api
            .get('/api/cards/stats')
            .catch((err) => ({ error: err.message })),
        ]);

      console.log("Dashboard API Responses:", {
        statsResponse,
        clientsResponse,
        activityResponse,
        banksStatsResponse,
        cardsStatsResponse,
      });

      // Use API data if available, otherwise use mock data
      if (statsResponse.data && !statsResponse.error) {
        console.log("Using API stats data:", statsResponse.data);
        
        // Calculate fundable clients (credit score > 650), report pulls, and login status
        let fundableCount = 0;
        let notFundableCount = 0;
        let reportPullsCount = 0;
        let loginEnabledCount = 0;
        let loginDisabledCount = 0;
        
        // If we have clients data, calculate counts
        if (clientsResponse.data && !clientsResponse.error && clientsResponse.data.clients) {
          const clients = clientsResponse.data.clients;
          
          fundableCount = clients.filter(client => 
            client.fundable_status === 'fundable'
          ).length;
          notFundableCount = clients.filter(client => 
            client.fundable_status === 'not_fundable'
          ).length;
          
          // Count login enabled/disabled clients
          // Consider login_disabled, is_locked, and inactive status
          loginEnabledCount = clients.filter(client => 
            !client.login_disabled && !client.is_locked && client.status?.toLowerCase() === 'active'
          ).length;
          
          loginDisabledCount = clients.filter(client => 
            client.login_disabled || client.is_locked || client.status?.toLowerCase() === 'inactive'
          ).length;
        }
        
        // Get report pulls count from credit report history
        try {
          const reportHistoryResponse = await creditReportScraperApi.getReportHistory();
          if (reportHistoryResponse.data?.success && reportHistoryResponse.data.data) {
            // Count reports from this month
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            reportPullsCount = reportHistoryResponse.data.data.filter(report => {
              const reportDate = new Date(report.created_at);
              return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
            }).length;
          }
        } catch (error) {
          console.log("Could not fetch report history for dashboard stats:", error);
          reportPullsCount = Math.floor(Math.random() * 50) + 10; // Fallback to mock data
        }
        
        setStats({
          totalClients: statsResponse.data.total_clients?.current || 0,
          loginEnabled: loginEnabledCount,
          loginDisabled: loginDisabledCount,
          fundable: typeof statsResponse.data.fundable === 'number' ? statsResponse.data.fundable : fundableCount,
          notFundable: typeof statsResponse.data.notFundable === 'number' ? statsResponse.data.notFundable : notFundableCount,
          reportPulls: reportPullsCount,
          fundingInvoicesPaid: statsResponse.data.funding_invoices_paid_this_month || 0,
          totalBanks: banksStatsResponse?.data?.total ? Number(banksStatsResponse.data.total) : 0,
          totalCards: cardsStatsResponse?.data?.total ? Number(cardsStatsResponse.data.total) : 0,
        });
      } else {
        console.log("Using fallback stats, API error:", statsResponse.error);
        // Fallback to mock stats
        setStats({
          totalClients: 127,
          loginEnabled: 123,
          loginDisabled: 4,
          fundable: 67,
          notFundable: 60,
          reportPulls: 23,
          fundingInvoicesPaid: 5,
          totalBanks: 0,
          totalCards: 0,
        });
      }

      if (clientsResponse.data && !clientsResponse.error) {
        const transformedClients = (clientsResponse.data.clients || []).map(
          (client) => ({
            id: client.id,
            name: `${client.first_name} ${client.last_name}`,
            email: client.email,
            phone: client.phone,
            status:
              client.status === "active"
                ? "Active"
                : client.status === "inactive"
                  ? "Inactive"
                  : client.status === "completed"
                    ? "Completed"
                    : "On Hold",
            creditScore: client.credit_score || 650,
            previousScore: client.previous_credit_score || 600,
            lastReport: new Date(client.updated_at).toISOString().split("T")[0],
            disputesActive: 0, // Will be populated when we integrate disputes
            progress:
              client.credit_score && client.previous_credit_score
                ? client.credit_score > client.previous_credit_score
                  ? "improving"
                  : "stable"
                : "new",
            joinDate: client.created_at,
            fundableStatus:
              client.fundable_status === 'fundable'
                ? 'Fundable'
                : client.fundable_status === 'not_fundable'
                ? 'Not Fundable'
                : (client.credit_score || 650) > 650
                ? 'Fundable'
                : 'Not Fundable',
          }),
        );
        setClients(transformedClients);
      } else {
        // Fallback to mock clients
        setClients([
          {
            id: 1,
            name: "Sarah Johnson",
            email: "sarah.j@email.com",
            phone: "(555) 123-4567",
            status: "Active",
            creditScore: 650,
            previousScore: 580,
            lastReport: "2024-01-15",
            disputesActive: 2,
            progress: "improving",
            joinDate: "2024-01-15T10:30:00Z",
          },
          {
            id: 2,
            name: "Michael Chen",
            email: "m.chen@email.com",
            phone: "(555) 234-5678",
            status: "Active",
            creditScore: 580,
            previousScore: 560,
            progress: "improving",
            disputesActive: 1,
            lastReport: "2024-01-14",
            joinDate: "2024-01-14T09:15:00Z",
          },
          {
            id: 3,
            name: "Emma Davis",
            email: "emma.d@email.com",
            phone: "(555) 345-6789",
            status: "Completed",
            creditScore: 720,
            previousScore: 680,
            progress: "improving",
            disputesActive: 0,
            lastReport: "2024-01-13",
            joinDate: "2024-01-13T14:20:00Z",
          },
        ]);
      }

      if (activityResponse.data && !activityResponse.error) {
        // Ensure we have an array - the API might return data in different formats
        let activities = [];
        if (Array.isArray(activityResponse.data)) {
          activities = activityResponse.data;
        } else if (
          activityResponse.data &&
          Array.isArray(activityResponse.data.activities)
        ) {
          activities = activityResponse.data.activities;
        } else if (
          activityResponse.data &&
          typeof activityResponse.data === "object"
        ) {
          // If data is an object but not an array, wrap it in an array if it has activity-like properties
          if (activityResponse.data.id && activityResponse.data.type) {
            activities = [activityResponse.data];
          }
        }
        setRecentActivity(activities);
      } else {
        // Fallback to mock activities
        setRecentActivity([
          {
            id: 1,
            type: "dispute_filed",
            description: "Dispute filed for Sarah Johnson - Medical Collection",
            time: "2024-01-15T10:30:00Z",
            client: "Sarah Johnson",
            status: "success",
          },
          {
            id: 2,
            type: "score_updated",
            description:
              "Credit score increased from 680 to 720 for Emma Davis",
            time: "2024-01-14T16:45:00Z",
            client: "Emma Davis",
            status: "success",
          },
          {
            id: 3,
            type: "client_added",
            description: "New client Michael Chen added to system",
            time: "2024-01-14T09:15:00Z",
            client: "Michael Chen",
            status: "info",
          },
          {
            id: 4,
            type: "payment_received",
            description: "Payment received from Sarah Johnson - $299",
            time: "2024-01-13T11:20:00Z",
            client: "Sarah Johnson",
            status: "success",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      // Complete fallback in case of any unexpected errors
      setStats({
        totalClients: 127,
        loginEnabled: 124,
        loginDisabled: 3,
        fundable: 89,
        notFundable: 38,
        reportPulls: 156,
        fundingInvoicesPaid: 12,
        totalBanks: 0,
        totalCards: 0,
      });

      setClients([
        {
          id: 1,
          name: "Demo Client",
          email: "demo@email.com",
          phone: "(555) 123-4567",
          status: "Active",
          creditScore: 650,
          previousScore: 580,
          lastReport: "2024-01-15",
          disputesActive: 2,
          progress: "improving",
          joinDate: "2024-01-15T10:30:00Z",
        },
      ]);

      setRecentActivity([
        {
          id: 1,
          type: "system_info",
          description: "Demo mode - API unavailable",
          time: new Date().toISOString(),
          client: "System",
          status: "info",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setIsAddClientOpen(true);
  };

  const handleCreditReports = () => {
    navigate("/reports");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleFilterClients = () => {
    // TODO: Implement client filtering functionality
    console.log("Filter clients clicked");
    toast({
      title: "Coming Soon",
      description: "Client filtering functionality will be available soon!",
    });
  };

  const handleViewProfile = (clientId: number) => {
    // TODO: Navigate to client profile page
    console.log("View profile for client:", clientId);
    toast({
      title: "Feature Coming Soon",
      description: `Client profile page for ID: ${clientId} will be available soon.`,
    });
  };

  const handleEditClient = (clientId: number) => {
    // TODO: Open edit client modal
    console.log("Edit client:", clientId);
    toast({
      title: "Feature Coming Soon",
      description: `Client editing for ID: ${clientId} will be available soon.`,
    });
  };

  const handleCopyCreditReportLink = async () => {
    try {
      await navigator.clipboard.writeText(creditReportRegisterUrl);
      toast({ title: "Link copied", description: "Credit report link copied to clipboard" });
    } catch (e) {
      toast({ title: "Copy failed", description: "Please copy the link manually", variant: "destructive" });
    }
  };

  const handleOpenCreditReportLink = () => {
    window.open(creditReportRegisterUrl, "_blank", "noopener,noreferrer");
  };

  const handleViewReports = (clientId: number) => {
    // TODO: Navigate to client reports
    console.log("View reports for client:", clientId);
    navigate(`/reports?client=${clientId}`);
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user is authenticated
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add a new client.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // First, scrape the credit report to get personal information
      console.log("Starting credit report scraping...");
      
      const scraperResponse = await fetch("/api/credit-reports/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform: newClient.platform,
          credentials: {
            username: newClient.email,
            password: newClient.password,
          },
          options: {
            saveHtml: false,
            takeScreenshots: false,
            ...(((newClient.platform === "identityiq" || newClient.platform === "myscoreiq") && newClient.ssnLast4)
              ? { ssnLast4: newClient.ssnLast4 }
              : {}),
          },
        }),
      });

      if (!scraperResponse.ok) {
        const errorData = await scraperResponse.json();
        
        // Handle authentication errors specifically
        if (scraperResponse.status === 401 || scraperResponse.status === 403) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          localStorage.removeItem("auth_token");
          navigate("/login");
          return;
        }
        
        throw new Error(errorData.message || "Failed to scrape credit report");
      }

      const scraperData = await scraperResponse.json();
      console.log("Scraper response:", scraperData);
      console.log("Scraper response keys:", Object.keys(scraperData));
      console.log("Report data structure:", scraperData.data ? Object.keys(scraperData.data) : "No data");

      // Extract personal information from the scraped data
      let firstName = "";
      let lastName = "";
      let dateOfBirth = "";

      // The scraper returns data in the format: { success: true, message: "...", data: { reportData: { ... } } }
      if (scraperData.data && scraperData.data.reportData) {
        const reportData = scraperData.data.reportData;
        console.log("Found reportData, checking Name array:", reportData.Name);
        
        // Try to extract name from Name section (based on scraper structure)
        if (reportData.Name && Array.isArray(reportData.Name) && reportData.Name.length > 0) {
          // Find the primary name entry (BureauId 1 or first entry with Primary type)
          const primaryName = reportData.Name.find(name => name.NameType === "Primary") || reportData.Name[0];
          console.log("Primary name data:", primaryName);
          
          firstName = primaryName.FirstName || "";
          lastName = primaryName.LastName || "";
          console.log("Extracted names:", { firstName, lastName });
        }

        // Try to extract date of birth from DOB section
        if (reportData.DOB && Array.isArray(reportData.DOB) && reportData.DOB.length > 0) {
          const dobData = reportData.DOB[0];
          dateOfBirth = dobData.DOB || "";
          console.log("Extracted DOB:", dateOfBirth);
        }

        // Fallback: try to extract from nested reportData structure or direct data access
        if (!firstName && !lastName) {
          console.log("Trying fallback data access");
          
          // Try direct access to scraperData.data (in case reportData is at the top level)
          if (scraperData.data.Name && Array.isArray(scraperData.data.Name) && scraperData.data.Name.length > 0) {
            const primaryName = scraperData.data.Name.find(name => name.NameType === "Primary") || scraperData.data.Name[0];
            firstName = primaryName.FirstName || "";
            lastName = primaryName.LastName || "";
            console.log("Extracted names from direct data:", { firstName, lastName });
          }
          
          // Try DOB section in direct data
          if (scraperData.data.DOB && Array.isArray(scraperData.data.DOB) && scraperData.data.DOB.length > 0) {
            const dobData = scraperData.data.DOB[0];
            dateOfBirth = dobData.DOB || "";
            console.log("Extracted DOB from direct data:", dateOfBirth);
          }
          
          // Try nested reportData structure
          if (!firstName && !lastName && reportData.reportData) {
            console.log("Trying nested reportData structure");
            const nestedReportData = reportData.reportData;
            
            // Try Name section in nested data
            if (nestedReportData.Name && Array.isArray(nestedReportData.Name) && nestedReportData.Name.length > 0) {
              const primaryName = nestedReportData.Name.find(name => name.NameType === "Primary") || nestedReportData.Name[0];
              firstName = primaryName.FirstName || "";
              lastName = primaryName.LastName || "";
              console.log("Extracted names from nested:", { firstName, lastName });
            }
            
            // Try DOB section in nested data
            if (nestedReportData.DOB && Array.isArray(nestedReportData.DOB) && nestedReportData.DOB.length > 0) {
              const dobData = nestedReportData.DOB[0];
              dateOfBirth = dobData.DOB || "";
              console.log("Extracted DOB from nested:", dateOfBirth);
            }
          }
        }
      }

      // Additional fallback: try direct access to scraperData.data if no reportData wrapper
      if (!firstName && !lastName && scraperData.data) {
        console.log("Trying direct scraperData.data access");
        
        if (scraperData.data.Name && Array.isArray(scraperData.data.Name) && scraperData.data.Name.length > 0) {
          const primaryName = scraperData.data.Name.find(name => name.NameType === "Primary") || scraperData.data.Name[0];
          firstName = primaryName.FirstName || "";
          lastName = primaryName.LastName || "";
          console.log("Extracted names from scraperData.data:", { firstName, lastName });
        }
        
        if (scraperData.data.DOB && Array.isArray(scraperData.data.DOB) && scraperData.data.DOB.length > 0) {
          const dobData = scraperData.data.DOB[0];
          dateOfBirth = dobData.DOB || "";
          console.log("Extracted DOB from scraperData.data:", dateOfBirth);
        }
      }

      console.log("Final extracted data:", { firstName, lastName, dateOfBirth });

      // If we couldn't extract the name, show an error
      if (!firstName && !lastName) {
        throw new Error("Could not extract personal information from credit report. Please verify the credentials and try again.");
      }

      // Create client with extracted information
      const clientData = {
        first_name: firstName,
        last_name: lastName,
        email: newClient.email,
        date_of_birth: dateOfBirth || undefined,
        status: "active" as const,
        platform: newClient.platform,
        platform_email: newClient.email,
        platform_password: newClient.password,
        ...(newClient.ssnLast4 ? { ssn_last_four: newClient.ssnLast4 } : {}),
        notes: `Client created via credit report scraping from ${newClient.platform}`,
      };

      console.log("Creating client with extracted data:", clientData);
      const response = await clientsApi.createClient(clientData);
      console.log("Create client response:", response);

      if (response.error) {
        throw new Error(response.error);
      }

      // Reset form and close modal
      setNewClient({
        platform: "",
        email: "",
        password: "",
        ssnLast4: "",
      });
      setIsAddClientOpen(false);

      // Refresh dashboard data
      fetchDashboardData();

      toast({
        title: "Success!",
        description: `Client ${firstName} ${lastName} has been added successfully with information from their credit report.`,
      });

      // Redirect post-add: paid admins → credit report; unpaid → client profile
      const clientId = response.data?.id || response.id;
      const clientName = `${firstName} ${lastName}`;
      if (clientId) {
        if (subscriptionStatus.hasActiveSubscription) {
          navigate(`/credit-report?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}`);
        } else {
          navigate(`/clients/${clientId}`);
        }
      }
    } catch (error: any) {
      console.error("Error adding client:", error);
      
      // Handle quota exceeded error specifically
      if (error.response?.status === 403 && error.response?.data?.error === 'Client quota exceeded') {
        const planLimits = error.response.data.planLimits;
        toast({
          title: "Client Quota Exceeded",
          description: error.response.data.message || `You have reached the maximum of ${planLimits?.maxClients || 1} client(s) allowed on your plan. Please upgrade to add more clients.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Adding Client",
          description:
            error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewClient((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout
      title="Dashboard Overview"
      description="Monitor your funding business performance and client progress"
      onAddClient={handleAddClient}
    >
      {/* Payment Prompt for Unpaid Users */}
      {!subscriptionStatus.hasActiveSubscription && !subscriptionStatus.isLoading && (
        <div className="mb-8">
          <PaymentPrompt planName={subscriptionStatus.planName} />
        </div>
      )}

      {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8">
        <Card
          className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => navigate("/clients")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Total Clients
            </CardTitle>
            <div className="gradient-primary p-2 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold gradient-text-primary">
              {loading ? "--" : (stats.totalClients || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
              {loading ? "Loading..." : "Active clients"}
            </p>
          </CardContent>
          {/* Progress Chart Background */}
          <div className="absolute bottom-0 right-0 opacity-20">
            <svg
              width="80"
              height="40"
              viewBox="0 0 80 40"
              className="text-blue-500"
            >
              <path
                d="M0,35 Q10,25 20,30 T40,20 T60,15 T80,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-pulse"
              />
              <circle
                cx="20"
                cy="30"
                r="2"
                fill="currentColor"
                className="animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />
              <circle
                cx="40"
                cy="20"
                r="2"
                fill="currentColor"
                className="animate-pulse"
                style={{ animationDelay: "1s" }}
              />
              <circle
                cx="60"
                cy="15"
                r="2"
                fill="currentColor"
                className="animate-pulse"
                style={{ animationDelay: "1.5s" }}
              />
            </svg>
          </div>
        </Card>

        <Card
          className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-800 dark:to-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => navigate("/clients?status=fundable")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Fundable
            </CardTitle>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
              <Award className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {loading ? "--" : (stats.fundable || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : "Clients fundable"}
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-20">
            <svg width="60" height="60" viewBox="0 0 60 60" className="text-purple-500">
              <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
              <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
              <path d="M30,10 L30,15 M30,45 L30,50 M10,30 L15,30 M45,30 L50,30" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </Card>

        <Card
          className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-800 dark:to-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => navigate("/clients?status=notfundable")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Not Fundable
            </CardTitle>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {loading ? "--" : (stats.notFundable || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : "Clients not fundable"}
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-20">
            <svg width="60" height="60" viewBox="0 0 60 60" className="text-orange-500">
              <circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
              <circle cx="30" cy="30" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
              <circle cx="30" cy="30" r="5" fill="currentColor" />
            </svg>
          </div>
        </Card>

        <Card
          className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/50 dark:from-slate-800 dark:to-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => navigate("/clients?loginStatus=enabled")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Login Enabled
            </CardTitle>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg">
              <Unlock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {loading ? "--" : (stats.loginEnabled || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : "Clients with login access"}
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-20">
            <svg
              width="75"
              height="38"
              viewBox="0 0 75 38"
              className="text-green-500"
            >
              <path
                d="M5,30 L15,25 L25,20 L35,15 L45,10 L55,8 L65,5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-pulse"
              />
              <polygon
                points="60,5 65,5 65,10"
                fill="currentColor"
                className="animate-pulse"
                style={{ animationDelay: "1s" }}
              />
            </svg>
          </div>
        </Card>

        <Card
          className="border-0 shadow-lg bg-gradient-to-br from-white to-red-50/50 dark:from-slate-800 dark:to-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => navigate("/clients?loginStatus=disabled")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Login Disabled
            </CardTitle>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg">
              <Lock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {loading ? "--" : (stats.loginDisabled || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : "Clients locked by admin"}
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-20">
            <svg
              width="75"
              height="38"
              viewBox="0 0 75 38"
              className="text-red-500"
            >
              <path
                d="M5,5 L15,10 L25,15 L35,20 L45,25 L55,30 L65,35"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-pulse"
              />
              <polygon
                points="60,35 65,35 65,30"
                fill="currentColor"
                className="animate-pulse"
                style={{ animationDelay: "1s" }}
              />
            </svg>
          </div>
      </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card
          className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/50 dark:from-slate-800 dark:to-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
         
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Total Banks
            </CardTitle>
            <div className="gradient-primary p-2 rounded-lg">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold gradient-text-primary">
              {loading ? "--" : (stats.totalBanks || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : "Registered banks"}
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-20">
            <svg width="80" height="40" viewBox="0 0 80 40" className="text-indigo-500">
              <path d="M0,35 Q10,25 20,30 T40,20 T60,15 T80,10" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
            </svg>
          </div>
        </Card>

        <Card
          className="border-0 shadow-lg bg-gradient-to-br from-white to-teal-50/50 dark:from-slate-800 dark:to-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
          
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Total Products
            </CardTitle>
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-2 rounded-lg">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
              {loading ? "--" : (stats.totalCards || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : "Available products"}
            </p>
          </CardContent>
          <div className="absolute bottom-0 right-0 opacity-20">
            <svg width="60" height="60" viewBox="0 0 60 60" className="text-teal-500">
              <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
              <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
            </svg>
          </div>
        </Card>
      </div>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="text-xl font-bold gradient-text-primary">Get Your Credit Report</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">If you don't have credit reports, register and pull your reports.</div>
              </div>
              <div className="flex-1 min-w-[280px]">
                <Label htmlFor="credit-report-link" className="text-sm font-medium">Credit Report Link</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input id="credit-report-link" value={creditReportRegisterUrl} readOnly className="font-mono text-xs bg-slate-50 dark:bg-slate-800" />
                  <Button
                    size="sm"
                    className="gradient-primary hover:opacity-90"
                    onClick={handleCopyCreditReportLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleOpenCreditReportLink} className="bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90">
                  Register Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

     

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Client Management Section */}
          <div className="lg:col-span-2">
            
        <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="gradient-text-primary">
                Calendar
              </CardTitle>
              <CardDescription>
                Client report reminders and scheduled meetings
              </CardDescription>
            </div>
            <div className="gradient-primary p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <AdminCalendar />
          </CardContent>
        </Card>
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="gradient-text-primary">
                    Recent Clients
                  </CardTitle>
                  <CardDescription>
                    Track your clients and their report progress
                  </CardDescription>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFilterClients}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button
                    onClick={handleAddClient}
                    size="sm"
                    className="gradient-primary hover:opacity-90"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    className="pl-10 bg-gradient-light border-border/40"
                  />
                </div>
              </div>

              {/* Client Table */}
              <div className="rounded-lg border border-border/40 overflow-x-auto overflow-y-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-light">
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Funding Status</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                              <div className="space-y-1">
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : clients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-gray-500 dark:text-gray-400">
                            No clients found. Add your first client to get
                            started!
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      clients.map((client) => {
                        const scoreChange = getScoreChange(
                          client.creditScore,
                          client.previousScore,
                        );
                        const ChangeIcon = scoreChange.icon;

                        return (
                          <TableRow
                            key={client.id}
                            className="hover:bg-gradient-light/50"
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="gradient-primary text-white text-xs">
                                    {client.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {client.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {client.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(client.status)}
                              >
                                {client.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                            <Badge
                              variant="outline"
                              className={`${
                                client.fundableStatus === 'Fundable' ? "border-green-500/30 text-green-600" : 
                                "border-red-500/30 text-red-600"
                              }`}
                            >
                              {client.fundableStatus}
                            </Badge>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`flex items-center space-x-1 ${scoreChange.color}`}
                              >
                                <ChangeIcon className="h-3 w-3" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {scoreChange.isPositive ? "+" : ""}
                                  {scoreChange.value}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-ocean-blue/30 text-ocean-blue"
                              >
                                ${client.creditScore > 650 ? (client.disputesActive * 1000) : 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleViewProfile(client.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditClient(client.id)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Client
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleViewReports(client.id)}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Reports
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </div>

        {/* Right sidebar with activity and quick stats */}
          <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-primary">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleAddClient}
                className="w-full justify-start gradient-primary hover:opacity-90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
              <Button
                  onClick={handleCreditReports}
                  variant="outline"
                  className="w-full justify-start border-ocean-blue/30 text-ocean-blue hover:bg-gradient-soft"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Credit Reports
              </Button>
              <Button
                  onClick={handleSettings}
                  variant="outline"
                  className="w-full justify-start border-sea-green/30 text-sea-green hover:bg-gradient-soft"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
              </Button>
              
              {/* Affiliate Pro Plan Access for Admin Users */}
              {hasAffiliateAccess && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleAffiliateProAccess}
                    variant="outline"
                    className="w-full justify-start border-purple-500/30 text-purple-600 hover:bg-purple-50 hover:border-purple-500 dark:text-purple-400 dark:hover:bg-purple-900/20 dark:border-purple-600/30"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {affiliateVerificationStatus === 'active' 
                      ? 'Affiliate Pro Dashboard'
                      : 'Verify Affiliate Access'
                    }
                  </Button>
                  {affiliateVerificationStatus === 'pending_verification' && (
                    <p className="text-xs text-muted-foreground mt-1 px-2">
                      Complete email verification to access your affiliate pro features
                    </p>
                  )}
                </div>
              )}

              {/* Admin Referral Link / Affiliate CTA */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {(!subscriptionStatus.isLoading && !subscriptionStatus.hasActiveSubscription) ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Get plan to unlock Pro affiliate dashboard access and earn 20–25% commission.
                    </div>
                    <Button onClick={() => navigate('/subscription')} className="w-full gradient-primary">
                      Get Plan
                    </Button>
                  </div>
                ) : hasAffiliateAccess ? (
                  affiliateVerificationStatus === 'active' ? (
                    <div className="space-y-2">
                      <Label htmlFor="admin-referral-link" className="text-sm font-medium">Your Referral Link</Label>
                      <div className="flex items-center gap-2">
                        <Input id="admin-referral-link" value={affiliateLink} readOnly className="font-mono text-xs bg-slate-50 dark:bg-slate-800" />
                        <Button
                          size="sm"
                          className="gradient-primary hover:opacity-90"
                          onClick={() => {
                            if (affiliateLink) {
                              navigator.clipboard.writeText(affiliateLink);
                              toast({ title: 'Link Copied!', description: 'Referral link copied to clipboard' });
                            }
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Verify your affiliate access to get your referral link.</div>
                      <Button onClick={() => navigate('/affiliate/verify-email')} variant="outline" className="w-full justify-start">
                        Verify Affiliate Access
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Affiliate account not set up.</div>
                    <Button onClick={() => navigate('/join-affiliate')} variant="outline" className="w-full justify-start">
                      Set it up now
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-secondary">
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates from your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))
                ) : !Array.isArray(recentActivity) ||
                  recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No recent activity
                  </div>
                ) : (
                  (recentActivity || []).map((activity) => (
                    <div key={activity.id} className="flex space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === "success"
                            ? "bg-green-500"
                            : activity.status === "info"
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {activity.client}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-primary dark:text-white">
                This Month's Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-ocean-blue" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    New Clients
                  </span>
                </div>
                <span className="text-sm font-bold text-ocean-blue">
                  {loading
                    ? "--"
                    : (stats.totalClients || 0) > 0
                      ? Math.floor((stats.totalClients || 0) * 0.15)
                      : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-sea-green" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Got Funded
                  </span>
                </div>
                <span className="text-sm font-bold text-sea-green">
                  {loading
                    ? "--"
                    : (stats.fundable || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Reports Pulls
                  </span>
                </div>
                <span className="text-sm font-bold text-purple-600">
                  {loading ? "--" : (stats.reportPulls || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Funding Invoice Paid
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {loading ? "--" : (stats.fundingInvoicesPaid || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
          </div>
      </div>

      {/* Add New Client Dialog */}
        <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text-primary">
              Add New Client
            </DialogTitle>
            <DialogDescription>
              Enter the client's information to get started with their credit
              repair journey.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitClient} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Select
                  value={newClient.platform}
                  onValueChange={(value) =>
                    handleInputChange("platform", value)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="myfreescorenow">MyFreeScoreNow</SelectItem>
                    <SelectItem value="identityiq">IdentityIQ</SelectItem>
                    <SelectItem value="myscoreiq">MyScoreIQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john.doe@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showDashboardPassword ? "text" : "password"}
                    value={newClient.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDashboardPassword(!showDashboardPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showDashboardPassword ? "Hide password" : "Show password"}
                    aria-pressed={showDashboardPassword}
                    title={showDashboardPassword ? "Hide password" : "Show password"}
                  >
                    {showDashboardPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {(newClient.platform === "identityiq" || newClient.platform === "myscoreiq") && (
                <div className="space-y-2">
                  <Label htmlFor="ssnLast4">SSN Last 4 *</Label>
                  <Input
                    id="ssnLast4"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    autoComplete="off"
                    title="Please enter 4 digits (e.g., 1234)"
                    value={newClient.ssnLast4}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                      handleInputChange("ssnLast4", digitsOnly);
                    }}
                    placeholder="1234"
                    required
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddClientOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gradient-primary"
                disabled={
                  isSubmitting ||
                  !newClient.platform ||
                  !newClient.email ||
                  !newClient.password ||
                  ((newClient.platform === "identityiq" || newClient.platform === "myscoreiq") && (!newClient.ssnLast4 || newClient.ssnLast4.length !== 4))
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Adding Client...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Client
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
        </Dialog>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={isEmailVerificationModalOpen}
        onClose={() => setIsEmailVerificationModalOpen(false)}
      />
      {/* Admin Contract Prompt (post-purchase signing) */}
      <AdminContractPrompt />
    </DashboardLayout>
  );
}
