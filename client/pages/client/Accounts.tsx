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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import ClientLayout from "@/components/ClientLayout";
import BureauScoresChart from "@/components/BureauScoresChart";
import ScoreChartsCard from "@/components/ScoreChartsCard";
import NegativeAccountsCard from "@/components/NegativeAccountsCard";
import { TrialCreditReportWrapper, TrialScoreWrapper, TrialSensitiveWrapper } from "@/components/TrialCreditReportWrapper";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { shouldShowField, tabConfig } from "@/utils/fieldCategorization";
import { calculateUtilization as calculateAccountUtilization } from "../../utils/utilizationCalculator.js";
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  Building,
  Users,
  Filter,
  Eye,
  BarChart3,
  Target,
  Award,
  Percent,
  Zap,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Info,
  Shield,
  Clock,
  PieChart,
  Wallet,
  Star,
  ThumbsUp,
  ThumbsDown,
  Calculator,
  TrendingDown as TrendDown,
  Activity,
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign as Dollar,
  PiggyBank,
  CreditCard as CardIcon,
  Building2,
  Timer,
  FileCheck,
  BarChart,
  LineChart,
  ArrowLeft,
  MapPin,
  User,
  Calendar as CalendarIcon,
  Calendar,
  Home,
  Phone,
  Globe,
  ArrowRight,
  Mail,
  Hash,
  Briefcase,
  ChevronRight,
  UserCheck,
  FileSearch,
  TrendingUp as TrendUp,
  Banknote,
  ScrollText,
  Lock,
  Gauge,
  BadgeCheck,
} from "lucide-react";
import FundingProjectionsCalculator from '../../utils/fundingProjections.js';
import GapAnalyzer from '../../utils/gapAnalyzer.js';
import PersonalCardsDisplay from '../../components/PersonalCardsDisplay';
import BusinessCardsDisplay from '../../components/BusinessCardsDisplay';
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { clientsApi } from "@/lib/api";
import { useAuthContext } from "@/contexts/AuthContext";

// Import the same detailed report data from Reports.tsx for consistency
const detailedReport = {
  personalInfo: {
    name: "Sarah Elizabeth Johnson",
    ssn: "***-**-4567",
    dateOfBirth: "03/15/1988",
    addresses: [
      {
        street: "1234 Maple Street",
        city: "Boston",
        state: "MA",
        zip: "02101",
        type: "Current",
        reportedDate: "2023-01-15",
        verified: true,
      },
      {
        street: "5678 Oak Avenue",
        city: "Cambridge",
        state: "MA",
        zip: "02138",
        type: "Previous",
        reportedDate: "2020-06-01",
        verified: true,
      },
    ],
    employment: {
      employer: "Tech Solutions Inc",
      position: "Software Engineer",
      income: 85000,
      employmentLength: "3 years",
      verified: true,
    },
    phoneNumbers: [
      { number: "(617) 555-0123", type: "Mobile", verified: true },
      { number: "(617) 555-0124", type: "Home", verified: false },
    ],
  },
  scores: {
    experian: 775,
    transunion: 769,
    equifax: 772,
  },
  previousScores: {
    experian: 705,
    transunion: 699,
    equifax: 702,
  },
  accounts: [
    {
      id: 1,
      creditor: "Chase Bank",
      accountNumber: "****1234",
      type: "Credit Card",
      status: "Open",
      balance: 2450,
      limit: 5000,
      minimumPayment: 75,
      actualPayment: 125,
      opened: "2020-03-15",
      lastActivity: "2024-01-10",
      paymentHistory: "Current",
      utilization: 49,
      remarks: "Pays as agreed",
      latePayments: {
        total: 2,
        last30Days: 0,
        last60Days: 1,
        last90Days: 1,
        over90Days: 0,
      },
      monthlyHistory: [
        {
          month: "2024-01",
          balance: 2450,
          payment: 125,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-12",
          balance: 2380,
          payment: 100,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-11",
          balance: 2290,
          payment: 75,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-10",
          balance: 2150,
          payment: 0,
          status: "30 Days Late",
          daysLate: 32,
        },
        {
          month: "2023-09",
          balance: 2050,
          payment: 75,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-08",
          balance: 1980,
          payment: 100,
          status: "Current",
          daysLate: 0,
        },
      ],
      transactions: [
        {
          date: "2024-01-15",
          description: "Payment Thank You",
          amount: -125,
          type: "Payment",
        },
        {
          date: "2024-01-12",
          description: "AMAZON.COM",
          amount: 89.99,
          type: "Purchase",
        },
        {
          date: "2024-01-10",
          description: "STARBUCKS #1234",
          amount: 12.45,
          type: "Purchase",
        },
        {
          date: "2024-01-08",
          description: "GROCERY STORE",
          amount: 156.78,
          type: "Purchase",
        },
        {
          date: "2024-01-05",
          description: "GAS STATION",
          amount: 45.2,
          type: "Purchase",
        },
        {
          date: "2024-01-03",
          description: "Interest Charge",
          amount: 23.45,
          type: "Fee",
        },
      ],
    },
    {
      id: 2,
      creditor: "Wells Fargo Auto",
      accountNumber: "****5678",
      type: "Auto Loan",
      status: "Open",
      balance: 18500,
      originalAmount: 25000,
      monthlyPayment: 425,
      opened: "2022-06-01",
      lastActivity: "2024-01-05",
      paymentHistory: "Current",
      utilization: 74,
      remarks: "Pays as agreed",
      interestRate: 5.99,
      termLength: "60 months",
      latePayments: {
        total: 0,
        last30Days: 0,
        last60Days: 0,
        last90Days: 0,
        over90Days: 0,
      },
      monthlyHistory: [
        {
          month: "2024-01",
          balance: 18500,
          payment: 425,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-12",
          balance: 18890,
          payment: 425,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-11",
          balance: 19280,
          payment: 425,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-10",
          balance: 19670,
          payment: 425,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-09",
          balance: 20060,
          payment: 425,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-08",
          balance: 20450,
          payment: 425,
          status: "Current",
          daysLate: 0,
        },
      ],
      transactions: [
        {
          date: "2024-01-05",
          description: "Auto Loan Payment",
          amount: -425,
          type: "Payment",
        },
        {
          date: "2023-12-05",
          description: "Auto Loan Payment",
          amount: -425,
          type: "Payment",
        },
        {
          date: "2023-11-05",
          description: "Auto Loan Payment",
          amount: -425,
          type: "Payment",
        },
      ],
    },
    {
      id: 3,
      creditor: "Capital One",
      accountNumber: "****9012",
      type: "Credit Card",
      status: "Closed",
      balance: 0,
      limit: 2000,
      payment: 0,
      opened: "2018-12-01",
      closed: "2023-08-15",
      lastActivity: "2023-08-15",
      paymentHistory: "Paid as Agreed",
      utilization: 0,
      remarks: "Account closed by consumer",
      latePayments: {
        total: 1,
        last30Days: 0,
        last60Days: 0,
        last90Days: 0,
        over90Days: 1,
      },
      monthlyHistory: [
        {
          month: "2023-08",
          balance: 0,
          payment: 250,
          status: "Paid in Full",
          daysLate: 0,
        },
        {
          month: "2023-07",
          balance: 250,
          payment: 0,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-06",
          balance: 180,
          payment: 50,
          status: "Current",
          daysLate: 0,
        },
      ],
    },
    {
      id: 4,
      creditor: "Discover Card",
      accountNumber: "****4567",
      type: "Credit Card",
      status: "Open",
      balance: 1200,
      limit: 3000,
      minimumPayment: 35,
      actualPayment: 50,
      opened: "2021-09-12",
      lastActivity: "2024-01-12",
      paymentHistory: "Current",
      utilization: 40,
      remarks: "Pays as agreed",
      latePayments: {
        total: 0,
        last30Days: 0,
        last60Days: 0,
        last90Days: 0,
        over90Days: 0,
      },
      monthlyHistory: [
        {
          month: "2024-01",
          balance: 1200,
          payment: 50,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-12",
          balance: 1150,
          payment: 75,
          status: "Current",
          daysLate: 0,
        },
        {
          month: "2023-11",
          balance: 1100,
          payment: 50,
          status: "Current",
          daysLate: 0,
        },
      ],
      transactions: [
        {
          date: "2024-01-12",
          description: "Payment - Thank You",
          amount: -50,
          type: "Payment",
        },
        {
          date: "2024-01-10",
          description: "WALMART.COM",
          amount: 67.89,
          type: "Purchase",
        },
        {
          date: "2024-01-08",
          description: "RESTAURANT",
          amount: 34.56,
          type: "Purchase",
        },
      ],
    },
  ],
  collections: [
    {
      id: 1,
      agency: "ABC Collections",
      originalCreditor: "Boston Medical Center",
      currentCreditor: "ABC Collections",
      accountNumber: "****7890",
      amount: 750,
      originalAmount: 850,
      dateOpened: "2023-07-15",
      dateReported: "2023-09-15",
      lastActivity: "2024-01-05",
      status: "Open",
      disputeStatus: "Pending Verification",
      paymentHistory: [
        { date: "2024-01-05", amount: 50, balance: 700 },
        { date: "2023-12-05", amount: 50, balance: 750 },
      ],
      notes: "Medical collection from emergency room visit",
      phoneNumber: "(800) 555-0199",
    },
    {
      id: 2,
      agency: "XYZ Recovery Services",
      originalCreditor: "National Grid Utility",
      currentCreditor: "XYZ Recovery Services",
      accountNumber: "****3456",
      amount: 320,
      originalAmount: 320,
      dateOpened: "2023-10-20",
      dateReported: "2023-11-20",
      lastActivity: "2023-11-20",
      status: "Open",
      disputeStatus: "None",
      paymentHistory: [],
      notes: "Utility bill from previous address",
      phoneNumber: "(800) 555-0177",
    },
    {
      id: 3,
      agency: "Recovery Plus Inc",
      originalCreditor: "Verizon Wireless",
      currentCreditor: "Recovery Plus Inc",
      accountNumber: "****9876",
      amount: 485,
      originalAmount: 485,
      dateOpened: "2023-08-10",
      dateReported: "2023-09-10",
      lastActivity: "2023-12-15",
      status: "Settled",
      disputeStatus: "Verified",
      paymentHistory: [
        {
          date: "2023-12-15",
          amount: 242.5,
          balance: 0,
          note: "Settled for 50%",
        },
      ],
      notes: "Cell phone bill - settled for 50%",
      phoneNumber: "(800) 555-0155",
    },
  ],
  inquiries: [
    {
      id: 1,
      company: "Chase Bank",
      date: "2024-01-10",
      type: "Hard",
      purpose: "Credit Card Application",
      requestedBy: "Chase Credit Card Division",
      address: "P.O. Box 15298, Wilmington, DE 19850",
    },
    {
      id: 2,
      company: "CarMax Auto Finance",
      date: "2023-12-05",
      type: "Hard",
      purpose: "Auto Financing",
      requestedBy: "CarMax Auto Finance",
      address: "12800 Tuckahoe Creek Pkwy, Richmond, VA 23238",
    },
    {
      id: 3,
      company: "Credit Karma",
      date: "2024-01-15",
      type: "Soft",
      purpose: "Account Review",
      requestedBy: "Credit Karma, Inc",
      address: "P.O. Box 30963, Oakland, CA 94604",
    },
    {
      id: 4,
      company: "Experian",
      date: "2024-01-01",
      type: "Soft",
      purpose: "Consumer Credit Report",
      requestedBy: "Experian Consumer Services",
      address: "P.O. Box 9701, Allen, TX 75013",
    },
    {
      id: 5,
      company: "Wells Fargo Bank",
      date: "2023-11-22",
      type: "Hard",
      purpose: "Credit Line Increase",
      requestedBy: "Wells Fargo Credit Card Services",
      address: "P.O. Box 14517, Des Moines, IA 50306",
    },
  ],
  publicRecords: [
    {
      id: 1,
      type: "Bankruptcy",
      status: "Discharged",
      filingDate: "2019-03-15",
      dischargeDate: "2019-08-20",
      court: "US Bankruptcy Court District of Massachusetts",
      caseNumber: "19-12345",
      assets: 15000,
      liabilities: 45000,
      chapter: "Chapter 7",
      notes: "No asset case, discharged without issues",
    },
  ],
  disputeHistory: [
    {
      id: 1,
      date: "2024-01-10",
      bureau: "Experian",
      accountDisputed: "ABC Collections - Medical",
      reason: "Not my account",
      status: "Under Investigation",
      expectedResolution: "2024-02-10",
      result: "Pending",
    },
    {
      id: 2,
      date: "2023-12-15",
      bureau: "TransUnion",
      accountDisputed: "Capital One Credit Card",
      reason: "Incorrect payment history",
      status: "Resolved",
      expectedResolution: "2024-01-15",
      result: "Updated - Late payment removed",
    },
    {
      id: 3,
      date: "2023-11-20",
      bureau: "Equifax",
      accountDisputed: "Recovery Plus Inc",
      reason: "Paid in full but still showing balance",
      status: "Resolved",
      expectedResolution: "2023-12-20",
      result: "Verified - Account updated to show settled status",
    },
  ],
  creditMonitoring: [
    {
      date: "2024-01-15",
      type: "Score Change",
      description: "Experian score increased by 5 points",
      impact: "Positive",
      reason: "Credit utilization decreased",
    },
    {
      date: "2024-01-10",
      type: "New Inquiry",
      description: "Hard inquiry added by Chase Bank",
      impact: "Negative",
      reason: "Credit card application",
    },
    {
      date: "2024-01-05",
      type: "Payment Recorded",
      description: "On-time payment recorded for Wells Fargo Auto",
      impact: "Positive",
      reason: "Consistent payment history",
    },
    {
      date: "2023-12-20",
      type: "Account Updated",
      description: "Capital One account updated with corrected payment history",
      impact: "Positive",
      reason: "Successful dispute resolution",
    },
  ],
};

export default function CreditReport() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("accounts");
  const [reportData, setReportData] = useState(detailedReport);
  const [apiData, setApiData] = useState<any>(null);
  const [qualifyView, setQualifyView] = useState<'cards' | 'table'>('table');
  const [eligibilityBureau, setEligibilityBureau] = useState<'all' | 'tu' | 'ex' | 'eq'>('all');
  const analysisRef = useRef<HTMLDivElement>(null);
  
  // Subscription status for tab access control
  const subscriptionStatus = useSubscriptionStatus();

  // Global helper: read underwriting flag for a bureau/key
  // This is used by the Basic (table) header indicator so it must be in component scope
  const getCriteriaFlag = (bureau: number, key: string) =>
    Boolean((reportData as any)?.qualificationCriteria?.[bureau]?.[key]);

  // Funding eligibility based on underwriting criteria (mirrors Underwriting.tsx)
  const isFundingEligible = useMemo(() => {
    const getCriteria = (bureau: number, key: string) =>
      Boolean((reportData as any)?.qualificationCriteria?.[bureau]?.[key]);

    const criteriaFlags = {
      score: [
        getCriteria(1, "score700Plus") || getCriteria(1, "score730Plus"),
        getCriteria(3, "score700Plus") || getCriteria(3, "score730Plus"),
        getCriteria(2, "score700Plus") || getCriteria(2, "score730Plus"),
      ],
      openUtil: [
        getCriteria(1, "openRevolvingUnder30"),
        getCriteria(3, "openRevolvingUnder30"),
        getCriteria(2, "openRevolvingUnder30"),
      ],
      allUtil: [
        getCriteria(1, "allRevolvingUnder30"),
        getCriteria(3, "allRevolvingUnder30"),
        getCriteria(2, "allRevolvingUnder30"),
      ],
      openCount: [
        getCriteria(1, "minFiveOpenRevolving"),
        getCriteria(3, "minFiveOpenRevolving"),
        getCriteria(2, "minFiveOpenRevolving"),
      ],
      unsecuredRecent: [
        getCriteria(1, "maxFourUnsecuredIn12Months"),
        getCriteria(3, "maxFourUnsecuredIn12Months"),
        getCriteria(2, "maxFourUnsecuredIn12Months"),
      ],
      inquiries: [
        getCriteria(1, "noInquiries"),
        getCriteria(3, "noInquiries"),
        getCriteria(2, "noInquiries"),
      ],
      bankruptcies: [
        getCriteria(1, "noBankruptcies"),
        getCriteria(3, "noBankruptcies"),
        getCriteria(2, "noBankruptcies"),
      ],
      collections: [
        getCriteria(1, "noCollections") || getCriteria(1, "noCollectionsLiensJudgements"),
        getCriteria(3, "noCollections") || getCriteria(3, "noCollectionsLiensJudgements"),
        getCriteria(2, "noCollections") || getCriteria(2, "noCollectionsLiensJudgements"),
      ],
      chargeOffs: [
        getCriteria(1, "noChargeOffs"),
        getCriteria(3, "noChargeOffs"),
        getCriteria(2, "noChargeOffs"),
      ],
      latePays: [
        getCriteria(1, "noLatePayments") || getCriteria(1, "noLatePaymentsIn12Months"),
        getCriteria(3, "noLatePayments") || getCriteria(3, "noLatePaymentsIn12Months"),
        getCriteria(2, "noLatePayments") || getCriteria(2, "noLatePaymentsIn12Months"),
      ],
    } as const;

    return Object.values(criteriaFlags).every(flags => flags.every(Boolean));
  }, [reportData]);

  // Effective eligibility: either server-provided all-bureau pass OR local per-bureau pass
  const effectiveFundingEligible = useMemo(() => {
    const getCriteria = (bureau: number, key: string) =>
      Boolean((reportData as any)?.qualificationCriteria?.[bureau]?.[key]);

    // Helper: count total inquiries by BureauId (no time window)
    const totalInquiryCountByBureauId = (bureauId: number): number => {
      const list = (apiData as any)?.reportData?.reportData?.Inquiries ?? (apiData as any)?.Inquiries ?? [];
      try {
        return list.filter((inq: any) => Number(inq?.BureauId) === Number(bureauId)).length;
      } catch {
        return 0;
      }
    };

    const criteriaFlags = {
      score: [
        getCriteria(1, "score700Plus") || getCriteria(1, "score730Plus"),
        getCriteria(3, "score700Plus") || getCriteria(3, "score730Plus"),
        getCriteria(2, "score700Plus") || getCriteria(2, "score730Plus"),
      ],
      openUtil: [
        getCriteria(1, "openRevolvingUnder30"),
        getCriteria(3, "openRevolvingUnder30"),
        getCriteria(2, "openRevolvingUnder30"),
      ],
      openCount: [
        getCriteria(1, "minFiveOpenRevolving"),
        getCriteria(3, "minFiveOpenRevolving"),
        getCriteria(2, "minFiveOpenRevolving"),
      ],
      unsecuredRecent: [
        getCriteria(1, "maxFourUnsecuredIn12Months"),
        getCriteria(3, "maxFourUnsecuredIn12Months"),
        getCriteria(2, "maxFourUnsecuredIn12Months"),
      ],
      inquiries: [
        totalInquiryCountByBureauId(1) < 4,
        totalInquiryCountByBureauId(3) < 4,
        totalInquiryCountByBureauId(2) < 4,
      ],
      bankruptcies: [
        getCriteria(1, "noBankruptcies"),
        getCriteria(3, "noBankruptcies"),
        getCriteria(2, "noBankruptcies"),
      ],
      collections: [
        getCriteria(1, "noCollections") || getCriteria(1, "noCollectionsLiensJudgements"),
        getCriteria(3, "noCollections") || getCriteria(3, "noCollectionsLiensJudgements"),
        getCriteria(2, "noCollections") || getCriteria(2, "noCollectionsLiensJudgements"),
      ],
      chargeOffs: [
        getCriteria(1, "noChargeOffs"),
        getCriteria(3, "noChargeOffs"),
        getCriteria(2, "noChargeOffs"),
      ],
      latePays: [
        getCriteria(1, "noLatePayments"),
        getCriteria(3, "noLatePayments"),
        getCriteria(2, "noLatePayments"),
      ],
    } as const;

    const flagGroups = Object.values(criteriaFlags);
    const perBureauEligible = [0, 1, 2].map((i) => flagGroups.every((group) => group[i]));
    const localEligible = perBureauEligible.some(Boolean);

    return Boolean(isFundingEligible) || localEligible;
  }, [reportData, apiData, isFundingEligible]);

const { userProfile } = useAuthContext();
const CREDIT_REPAIR_URL = (userProfile?.credit_repair_url?.trim())
  || ((import.meta as any)?.env?.VITE_CREDIT_REPAIR_URL)
  || 'https://www.m2ficoforge.com/';
  
  // Bureau card tabs state - each account group has its own tab state
  const [bureauTabs, setBureauTabs] = useState<Record<string, string>>({});
  
  // Helper function to get or set default tab for an account group
  const getActiveTab = (accountKey: string) => {
    return bureauTabs[accountKey] || 'all';
  };
  
  // Helper function to set active tab for an account group
  const setActiveTabForAccount = (accountKey: string, tab: string) => {
    setBureauTabs(prev => ({
      ...prev,
      [accountKey]: tab
    }));
  };
  
  // Funding application modal states
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [fundingType, setFundingType] = useState<'personal' | 'business' | null>(null);
  const [fundingOption, setFundingOption] = useState<'done-for-you' | 'diy' | null>(null);
  
  // DIY Cards visibility states (for page section instead of modal)
  const [showDIYSection, setShowDIYSection] = useState(false);
  const [diyFundingType, setDiyFundingType] = useState<'personal' | 'business' | null>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Business Information
    titlePosition: '',
    fundingAmount: '',
    intendedUse: '',
    businessName: '',
    businessPhone: '',
    businessEmail: '',
    businessAddress: '',
    city: '',
    state: '',
    zip: '',
    dateCommenced: '',
    businessWebsite: '',
    businessIndustry: '',
    entityType: '',
    incorporationState: '',
    numberOfEmployees: '',
    ein: '',
    monthlyGrossSales: '',
    projectedAnnualRevenue: '',
    
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    birthCity: '',
    ssn: '',
    mothersMaidenName: '',
    homeAddress: '',
    personalCity: '',
    personalState: '',
    personalZip: '',
    homePhone: '',
    mobilePhone: '',
    housingStatus: '',
    monthlyHousingPayment: '',
    yearsAtAddress: '',
    driversLicense: '',
    issuingState: '',
    issueDate: '',
    expirationDate: '',
    
    // Employment Information
    currentEmployer: '',
    position: '',
    yearsAtEmployer: '',
    employerPhone: '',
    employerAddress: '',
    
    // Financial Information
    personalBankName: '',
    personalBankBalance: '',
    businessBankName: '',
    businessBankBalance: '',
    usCitizen: '',
    savingsAccount: '',
    investmentAccounts: '',
    militaryAffiliation: '',
    otherIncome: '',
    otherAssets: '',
    banksToIgnore: [] as string[],
    
    // Document Uploads
    driverLicenseFile: null as File | null,
    einConfirmationFile: null as File | null,
    articlesFromStateFile: null as File | null
  });
  
  // Pay Down modal state
  const [paydownDialogOpen, setPaydownDialogOpen] = useState(false);
  const [selectedPaydownAccount, setSelectedPaydownAccount] = useState<{ creditor: string; accountNumber?: string; limit: number; balance: number; opened?: any } | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number>(30);
  // Default targets aligned with Pay Down table
  const paydownTargets = [30, 25, 20, 15, 10, 5, 0];
  
  // Calculate debt utilization from real account data
  const calculateDebtUtilization = (accounts) => {
    const utilizationByBureau = {
      1: { // TransUnion
        openRevolvingBalance: 0,
        openRevolvingLimit: 0,
        allRevolvingBalance: 0,
        allRevolvingLimit: 0,
        realEstateDebt: 0,
        installmentDebt: 0
      },
      2: { // Equifax
        openRevolvingBalance: 0,
        openRevolvingLimit: 0,
        allRevolvingBalance: 0,
        allRevolvingLimit: 0,
        realEstateDebt: 0,
        installmentDebt: 0
      },
      3: { // Experian
        openRevolvingBalance: 0,
        openRevolvingLimit: 0,
        allRevolvingBalance: 0,
        allRevolvingLimit: 0,
        realEstateDebt: 0,
        installmentDebt: 0
      }
    };

    if (!accounts || !Array.isArray(accounts)) {
      return utilizationByBureau;
    }

    accounts.forEach(account => {
      const bureauId = account.BureauId;
      const currentBalance = parseFloat(account.CurrentBalance) || 0;
      const creditLimit = parseFloat(account.CreditLimit) || 0;
      const highBalance = parseFloat(account.HighBalance) || 0;
      
      if (!utilizationByBureau[bureauId]) return;

      // Revolving accounts (credit cards, lines of credit)
      if (account.CreditType === 'Revolving Account' || account.AccountTypeDescription === 'Revolving Account') {
        // All revolving accounts
        utilizationByBureau[bureauId].allRevolvingBalance += currentBalance;
        utilizationByBureau[bureauId].allRevolvingLimit += creditLimit || highBalance;
        
        // Open revolving accounts only
        if (account.AccountStatus === 'Open' || account.AccountStatus === 'Current') {
          utilizationByBureau[bureauId].openRevolvingBalance += currentBalance;
          utilizationByBureau[bureauId].openRevolvingLimit += creditLimit || highBalance;
        }
      }
      
      // Real estate debt (mortgages)
      if (account.AccountType === 'Mortgage' || account.Industry?.includes('Real Estate') || 
          account.CreditorName?.toLowerCase().includes('mortgage')) {
        if (account.AccountStatus === 'Open' || account.AccountStatus === 'Current') {
          utilizationByBureau[bureauId].realEstateDebt += currentBalance;
        }
      }
      
      // Installment debt (auto loans, personal loans, etc.)
      if (account.CreditType === 'Installment Account' || account.AccountTypeDescription === 'Installment Account') {
        if (account.AccountStatus === 'Open' || account.AccountStatus === 'Current') {
          utilizationByBureau[bureauId].installmentDebt += currentBalance;
        }
      }
    });

    return utilizationByBureau;
  };

  // Get dynamic debt utilization data
  const getDebtUtilizationData = () => {
    if (!apiData?.Accounts) {
      // Return default structure if no account data
      return {
        1: { openRevolvingBalance: 0, openRevolvingLimit: 0, allRevolvingBalance: 0, allRevolvingLimit: 0, realEstateDebt: 0, installmentDebt: 0 },
        2: { openRevolvingBalance: 0, openRevolvingLimit: 0, allRevolvingBalance: 0, allRevolvingLimit: 0, realEstateDebt: 0, installmentDebt: 0 },
        3: { openRevolvingBalance: 0, openRevolvingLimit: 0, allRevolvingBalance: 0, allRevolvingLimit: 0, realEstateDebt: 0, installmentDebt: 0 }
      };
    }
    
    return calculateDebtUtilization(apiData.Accounts);
  };

  // Form validation functions
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 1: // Business Information
        if (!formData.titlePosition.trim()) errors.titlePosition = 'Title/Position is required';
        if (!formData.fundingAmount.trim()) errors.fundingAmount = 'Funding amount is required';
        if (!formData.intendedUse.trim()) errors.intendedUse = 'Intended use is required';
        if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
        if (!formData.businessPhone.trim()) errors.businessPhone = 'Business phone is required';
        if (!formData.businessEmail.trim()) errors.businessEmail = 'Business email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) errors.businessEmail = 'Invalid email format';
        if (!formData.businessAddress.trim()) errors.businessAddress = 'Business address is required';
        if (!formData.city.trim()) errors.city = 'City is required';
        if (!formData.state.trim()) errors.state = 'State is required';
        if (!formData.zip.trim()) errors.zip = 'ZIP code is required';
        if (!formData.dateCommenced.trim()) errors.dateCommenced = 'Business start date is required';
        if (!formData.businessIndustry.trim()) errors.businessIndustry = 'Business industry is required';
        if (!formData.entityType.trim()) errors.entityType = 'Entity type is required';
        if (!formData.numberOfEmployees.trim()) errors.numberOfEmployees = 'Number of employees is required';
        break;
        
      case 2: // Personal Information
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.dateOfBirth.trim()) errors.dateOfBirth = 'Date of birth is required';
        if (!formData.ssn.trim()) errors.ssn = 'SSN is required';
        if (!formData.homeAddress.trim()) errors.homeAddress = 'Home address is required';
        if (!formData.personalCity.trim()) errors.personalCity = 'City is required';
        if (!formData.personalState.trim()) errors.personalState = 'State is required';
        if (!formData.personalZip.trim()) errors.personalZip = 'ZIP code is required';
        if (!formData.mobilePhone.trim()) errors.mobilePhone = 'Mobile phone is required';
        if (!formData.housingStatus.trim()) errors.housingStatus = 'Housing status is required';
        if (!formData.driversLicense.trim()) errors.driversLicense = 'Driver\'s license is required';
        if (!formData.issuingState.trim()) errors.issuingState = 'Issuing state is required';
        break;
        
      case 3: // Employment Information
        if (!formData.currentEmployer.trim()) errors.currentEmployer = 'Current employer is required';
        if (!formData.position.trim()) errors.position = 'Position is required';
        if (!formData.yearsAtEmployer.trim()) errors.yearsAtEmployer = 'Years at employer is required';
        if (!formData.employerPhone.trim()) errors.employerPhone = 'Employer phone is required';
        break;
        
      case 4: // Financial Information
        if (!formData.personalBankName.trim()) errors.personalBankName = 'Personal bank name is required';
        if (!formData.personalBankBalance.trim()) errors.personalBankBalance = 'Personal bank balance is required';
        if (!formData.businessBankName.trim()) errors.businessBankName = 'Business bank name is required';
        if (!formData.businessBankBalance.trim()) errors.businessBankBalance = 'Business bank balance is required';
        if (!formData.usCitizen) errors.usCitizen = 'US citizenship status is required';
        if (!formData.savingsAccount) errors.savingsAccount = 'Savings account status is required';
        if (!formData.investmentAccounts) errors.investmentAccounts = 'Investment accounts status is required';
        if (!formData.militaryAffiliation) errors.militaryAffiliation = 'Military affiliation status is required';
        if (!formData.otherIncome) errors.otherIncome = 'Other income status is required';
        if (!formData.otherAssets) errors.otherAssets = 'Other assets status is required';
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStepNavigation = (direction: 'next' | 'prev' | 'forward' | 'back') => {
    if (direction === 'next' || direction === 'forward') {
      if (validateStep(currentStep)) {
        if (currentStep < 4) {
          setCurrentStep(currentStep + 1);
        } else {
          handleFormSubmission();
        }
      }
    } else if (direction === 'prev' || direction === 'back') {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
        setFormErrors({}); // Clear errors when going back
      } else {
        setFundingOption(null);
        setCurrentStep(1);
        setFormErrors({});
      }
    }
  };

  const handleFormSubmission = async () => {
    if (!validateStep(4)) return;
    
    setIsSubmitting(true);
    try {
      // Prepare the data for submission to funding_requests table
      const submissionData = {
        // Basic funding request fields
        title: `${formData.businessName || 'Business'} - Done for You Funding Request`,
        description: `Done for You funding application for ${formData.businessName || 'business'} requesting $${formData.fundingAmount} for ${formData.intendedUse}`,
        amount: parseFloat(formData.fundingAmount) || 0,
        purpose: 'other', // Since this is a comprehensive application
        priority: 'medium',
        funding_type: 'done-for-you',
        
        // Business Information
        title_position: formData.titlePosition,
        intended_use: formData.intendedUse,
        business_name: formData.businessName,
        business_phone: formData.businessPhone,
        business_email: formData.businessEmail,
        business_address: formData.businessAddress,
        business_city: formData.city,
        business_state: formData.state,
        business_zip: formData.zip,
        date_commenced: formData.dateCommenced,
        business_website: formData.businessWebsite,
        business_industry: formData.businessIndustry,
        entity_type: formData.entityType,
        incorporation_state: formData.incorporationState,
        number_of_employees: parseInt(formData.numberOfEmployees) || null,
        ein: formData.ein,
        monthly_gross_sales: parseFloat(formData.monthlyGrossSales) || null,
        projected_annual_revenue: parseFloat(formData.projectedAnnualRevenue) || null,
        
        // Personal Information
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        birth_city: formData.birthCity,
        ssn: formData.ssn,
        mothers_maiden_name: formData.mothersMaidenName,
        home_address: formData.homeAddress,
        personal_city: formData.personalCity,
        personal_state: formData.personalState,
        personal_zip: formData.personalZip,
        home_phone: formData.homePhone,
        mobile_phone: formData.mobilePhone,
        housing_status: formData.housingStatus,
        monthly_housing_payment: parseFloat(formData.monthlyHousingPayment) || null,
        years_at_address: parseFloat(formData.yearsAtAddress) || null,
        drivers_license: formData.driversLicense,
        issuing_state: formData.issuingState,
        issue_date: formData.issueDate,
        expiration_date: formData.expirationDate,
        
        // Employment Information
        current_employer: formData.currentEmployer,
        position: formData.position,
        years_at_employer: parseFloat(formData.yearsAtEmployer) || null,
        employer_phone: formData.employerPhone,
        employer_address: formData.employerAddress,
        
        // Financial Information
        personal_bank_name: formData.personalBankName,
        personal_bank_balance: parseFloat(formData.personalBankBalance) || null,
        business_bank_name: formData.businessBankName,
        business_bank_balance: parseFloat(formData.businessBankBalance) || null,
        us_citizen: formData.usCitizen,
        savings_account: formData.savingsAccount,
        investment_accounts: formData.investmentAccounts,
        military_affiliation: formData.militaryAffiliation,
        other_income: formData.otherIncome,
        other_assets: formData.otherAssets,
        banks_to_ignore: formData.banksToIgnore
      };

      // Submit to funding requests API
      const response = await fetch('/api/funding-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit funding request');
      }

      const result = await response.json();
      console.log('Funding request submitted successfully:', result);
      
      // Upload documents if any files are selected
      if (formData.driverLicenseFile || formData.einConfirmationFile || formData.articlesFromStateFile) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('requestId', result.id.toString());
          
          if (formData.driverLicenseFile) {
            formDataUpload.append('driverLicenseFile', formData.driverLicenseFile);
          }
          if (formData.einConfirmationFile) {
            formDataUpload.append('einConfirmationFile', formData.einConfirmationFile);
          }
          if (formData.articlesFromStateFile) {
            formDataUpload.append('articlesFromStateFile', formData.articlesFromStateFile);
          }
          
          const uploadResponse = await fetch('/api/funding-requests/upload-documents', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: formDataUpload
          });
          
          if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.json();
            console.error('Document upload failed:', uploadError);
            alert('Funding request submitted successfully, but document upload failed. Please contact support.');
          } else {
            const uploadResult = await uploadResponse.json();
            console.log('Documents uploaded successfully:', uploadResult);
          }
        } catch (uploadError) {
          console.error('Document upload error:', uploadError);
          alert('Funding request submitted successfully, but document upload failed. Please contact support.');
        }
      }
      
      // Show success message and close modal
      setShowFundingModal(false);
      setFundingOption(null);
      setCurrentStep(1);
      setFormData({
        titlePosition: '', fundingAmount: '', intendedUse: '', businessName: '', businessPhone: '', businessEmail: '',
        businessAddress: '', city: '', state: '', zip: '', dateCommenced: '', businessWebsite: '', businessIndustry: '',
        entityType: '', incorporationState: '', numberOfEmployees: '', ein: '', monthlyGrossSales: '', projectedAnnualRevenue: '',
        firstName: '', middleName: '', lastName: '', dateOfBirth: '', birthCity: '', ssn: '', mothersMaidenName: '',
        homeAddress: '', personalCity: '', personalState: '', personalZip: '', homePhone: '', mobilePhone: '',
        housingStatus: '', monthlyHousingPayment: '', yearsAtAddress: '', driversLicense: '', issuingState: '',
        issueDate: '', expirationDate: '', currentEmployer: '', position: '', yearsAtEmployer: '', employerPhone: '',
        employerAddress: '', personalBankName: '', personalBankBalance: '', businessBankName: '', businessBankBalance: '',
        usCitizen: '', savingsAccount: '', investmentAccounts: '', militaryAffiliation: '', otherIncome: '', otherAssets: '',
        banksToIgnore: [], driverLicenseFile: null, einConfirmationFile: null, articlesFromStateFile: null
      });
      setFormErrors({});
      
      // Show success notification
      alert('Your Done for You funding request has been submitted successfully!');
    } catch (error) {
      console.error('Form submission error:', error);
      alert(`Error submitting funding request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add a debug effect to monitor reportData changes
  useEffect(() => {
    console.log('🔍 DEBUG: reportData state changed:', reportData.scores);
  }, [reportData]);

  // Download Analysis tab as PDF without splitting sections
  const downloadAnalysisPdf = async () => {
    try {
      if (activeTab !== 'analysis') return;
      const el = analysisRef.current;
      if (!el) return;
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [10, 10],
        filename: 'CreditReport-Analysis.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css'], avoid: ['.pdf-avoid-break', '.analysis-pdf-root > *'] }
      } as any;
      await (html2pdf() as any).set(opt).from(el).save();
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scoring Model State
  const [compareMode, setCompareMode] = useState<'personal' | 'business' | 'both'>('both');
  const [dynamicFundingData, setDynamicFundingData] = useState(null);
  const [gapAnalysisData, setGapAnalysisData] = useState(null);

  // Calculate dynamic funding projections when report data changes
  useEffect(() => {
    if (reportData && reportData.accounts && reportData.accounts.length > 0) {
      try {
        console.log('🔍 DEBUG: Calculating dynamic funding projections...');
        
        // Initialize funding calculator with credit report data
        const fundingCalculator = new FundingProjectionsCalculator(reportData);
        const projections = fundingCalculator.getAllProjections();
        
        // Validate projections structure
        if (!projections || typeof projections !== 'object') {
          throw new Error('Invalid projections structure');
        }
        
        // Initialize gap analyzer
        const gapAnalyzer = new GapAnalyzer();
        const avgCreditScore = Math.round((reportData.scores.experian + reportData.scores.transunion + reportData.scores.equifax) / 3);
        const gapAnalysis = gapAnalyzer.getComprehensiveAnalysis(projections, avgCreditScore);
        
        // Validate gap analysis structure
        if (!gapAnalysis || typeof gapAnalysis !== 'object') {
          throw new Error('Invalid gap analysis structure');
        }
        
        // Ensure improvementRoadmap has the correct structure
        if (gapAnalysis.improvementRoadmap && typeof gapAnalysis.improvementRoadmap === 'object') {
          // Ensure all roadmap arrays exist
          if (!Array.isArray(gapAnalysis.improvementRoadmap.immediate)) {
            gapAnalysis.improvementRoadmap.immediate = [];
          }
          if (!Array.isArray(gapAnalysis.improvementRoadmap.shortTerm)) {
            gapAnalysis.improvementRoadmap.shortTerm = [];
          }
          if (!Array.isArray(gapAnalysis.improvementRoadmap.longTerm)) {
            gapAnalysis.improvementRoadmap.longTerm = [];
          }
        } else {
          // Create default roadmap structure if missing
          gapAnalysis.improvementRoadmap = {
            immediate: [],
            shortTerm: [],
            longTerm: []
          };
        }
        
        // Validate personal and business data structures
        if (!gapAnalysis.personal || typeof gapAnalysis.personal !== 'object') {
          gapAnalysis.personal = {
            currentFunding: 0,
            benchmarkFunding: 0,
            fundingGap: 0,
            utilizationGap: { current: 0, optimal: 0 },
            creditAgeGap: { current: 0 }
          };
        }
        
        if (!gapAnalysis.business || typeof gapAnalysis.business !== 'object') {
          gapAnalysis.business = {
            currentFunding: 0,
            benchmarkFunding: 0,
            fundingGap: 0,
            einStatus: 'Unknown',
            riskLevel: 'Medium'
          };
        }
        
        setDynamicFundingData(projections);
        setGapAnalysisData(gapAnalysis);
        
        console.log('🔍 DEBUG: Dynamic funding projections calculated:', projections);
        console.log('🔍 DEBUG: Gap analysis completed:', gapAnalysis);
      } catch (error) {
        console.error('Error calculating dynamic funding projections:', error);
        // Fallback to mock data if calculation fails
        setDynamicFundingData(null);
        setGapAnalysisData(null);
      }
    }
  }, [reportData]);

  // Calculate actual credit age from account data
  const calculateCreditAge = () => {
    if (!reportData.accounts || reportData.accounts.length === 0) {
      return "No accounts";
    }

    const currentDate = new Date();
    let totalMonths = 0;
    let validAccounts = 0;

    reportData.accounts.forEach((account: any) => {
      const dateOpened = account.DateOpened || account.dateOpened || account.opened;
      if (dateOpened) {
        const openDate = new Date(dateOpened);
        if (!isNaN(openDate.getTime())) {
          const monthsDiff = (currentDate.getFullYear() - openDate.getFullYear()) * 12 + 
                            (currentDate.getMonth() - openDate.getMonth());
          if (monthsDiff >= 0) {
            totalMonths += monthsDiff;
            validAccounts++;
          }
        }
      }
    });

    if (validAccounts === 0) {
      return "No valid accounts";
    }

    const averageMonths = Math.round(totalMonths / validAccounts);
    const years = Math.floor(averageMonths / 12);
    const months = averageMonths % 12;

    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    }
  };

  // Calculate actual credit utilization from account data
  const calculateUtilization = () => {
    if (!reportData.accounts || reportData.accounts.length === 0) {
      return 0;
    }

    let totalRevolvingBalance = 0;
    let totalRevolvingLimit = 0;
    let totalInstallmentUtilization = 0;
    let installmentAccountCount = 0;

    reportData.accounts.forEach((account: any) => {
      const utilization = calculateAccountUtilization(account);
      
      if (utilization !== null) {
        const accountType = account.CreditType || account.type || account.AccountType || '';
        
        if (accountType.toLowerCase().includes('revolving') || accountType.toLowerCase().includes('credit card')) {
          const balance = parseFloat(account.CurrentBalance || account.balance || '0');
          const limit = parseFloat(account.CreditLimit || account.limit || account.creditLimit || '0');
          
          if (!isNaN(balance) && !isNaN(limit) && limit > 0) {
            totalRevolvingBalance += balance;
            totalRevolvingLimit += limit;
          }
        } else if (accountType.toLowerCase().includes('installment') || accountType.toLowerCase().includes('loan')) {
          totalInstallmentUtilization += utilization;
          installmentAccountCount++;
        }
      }
    });

    // Calculate overall utilization
    let overallUtilization = 0;
    
    if (totalRevolvingLimit > 0) {
      const revolvingUtilization = (totalRevolvingBalance / totalRevolvingLimit) * 100;
      
      if (installmentAccountCount > 0) {
        const avgInstallmentUtilization = totalInstallmentUtilization / installmentAccountCount;
        // Weight revolving accounts more heavily (70%) than installment accounts (30%)
        overallUtilization = (revolvingUtilization * 0.7) + (avgInstallmentUtilization * 0.3);
      } else {
        overallUtilization = revolvingUtilization;
      }
    } else if (installmentAccountCount > 0) {
      overallUtilization = totalInstallmentUtilization / installmentAccountCount;
    }

    return Math.round(overallUtilization);
  };

  // Calculate utilization for OPEN revolving accounts across all bureaus
  const calculateOpenRevolvingUtilization = () => {
    const accounts = reportData?.accounts || [];
    if (accounts.length === 0) return 0;

    let totalBalance = 0;
    let totalLimit = 0;

    accounts.forEach((acc: any) => {
      const typeText = (acc.CreditType || acc.AccountTypeDescription || acc.AccountType || acc.type || '').toString().toLowerCase();
      const statusText = (acc.AccountStatus || acc.AccountCondition || acc.status || '').toString().toLowerCase();
      const isRevolving = /revolving|credit\s*card/.test(typeText);
      const isOpen = statusText.includes('open');
      if (!isRevolving || !isOpen) return;

      const balanceRaw = acc.CurrentBalance ?? acc.balance ?? acc.Balance;
      const limitRaw = acc.CreditLimit ?? acc.limit ?? acc.HighBalance ?? acc.creditLimit;

      const balance = parseFloat(String(balanceRaw ?? '0'));
      const limit = parseFloat(String(limitRaw ?? '0'));

      if (!isNaN(balance) && !isNaN(limit) && limit > 0 && balance >= 0) {
        totalBalance += balance;
        totalLimit += limit;
      }
    });

    if (totalLimit <= 0) return 0;
    return Math.round((totalBalance / totalLimit) * 100);
  };

  // Calculate actual funding projections using credit signals and funding logic
  const calculateFundingProjections = () => {
    if (!reportData.accounts || reportData.accounts.length === 0) {
      return {
        personal: {
          maxCards: 3,
          estimatedFunding: 15000,
          bureauLogic: "No account data available"
        },
        business: {
          maxCards: 2,
          estimatedFunding: 20000,
          bureauLogic: "No account data available"
        }
      };
    }

    // Extract credit signals from account data
    const accounts = reportData.accounts;
    const currentDate = new Date();
    
    // Calculate credit utilization
    const utilization = calculateUtilization();
    
    // Calculate average account age in months
    let totalMonths = 0;
    let validAccounts = 0;
    accounts.forEach((account: any) => {
      const dateOpened = account.DateOpened || account.dateOpened || account.opened;
      if (dateOpened) {
        const openDate = new Date(dateOpened);
        if (!isNaN(openDate.getTime())) {
          const monthsDiff = (currentDate.getFullYear() - openDate.getFullYear()) * 12 + 
                            (currentDate.getMonth() - openDate.getMonth());
          if (monthsDiff >= 0) {
            totalMonths += monthsDiff;
            validAccounts++;
          }
        }
      }
    });
    const averageAccountAge = validAccounts > 0 ? Math.round(totalMonths / validAccounts) : 0;
    
    // Count recent inquiries (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentInquiries = reportData.inquiries ? reportData.inquiries.filter((inquiry: any) => {
      const inquiryDate = new Date(inquiry.date);
      return inquiryDate >= sixMonthsAgo && inquiry.type === 'Hard';
    }).length : 0;
    
    // Count open revolving accounts
    const openRevolvingAccounts = accounts.filter((account: any) => {
      const accountType = account.CreditType || account.type || account.AccountType || '';
      const status = account.AccountStatus || account.status || '';
      return accountType.toLowerCase().includes('revolving') && 
             (status.toLowerCase() === 'open' || status.toLowerCase() === 'current');
    });
    
    // Calculate total credit limits and balances
    let totalCreditLimit = 0;
    let totalBalance = 0;
    openRevolvingAccounts.forEach((account: any) => {
      const limit = parseFloat(account.CreditLimit || account.limit || account.creditLimit || '0');
      const balance = parseFloat(account.CurrentBalance || account.balance || '0');
      if (!isNaN(limit) && !isNaN(balance)) {
        totalCreditLimit += limit;
        totalBalance += balance;
      }
    });
    
    // Get average credit score
    const avgScore = reportData.scores ? 
      Math.round((parseInt(reportData.scores.experian) + parseInt(reportData.scores.transunion) + parseInt(reportData.scores.equifax)) / 3) : 700;
    
    // Calculate personal funding projection
    let personalMaxCards = 5; // Base number
    let personalEstimatedFunding = 25000; // Base funding
    
    // Adjust based on credit score
    if (avgScore >= 750) {
      personalMaxCards = Math.round(personalMaxCards * 1.5);
      personalEstimatedFunding = Math.round(personalEstimatedFunding * 2.5);
    } else if (avgScore >= 700) {
      personalMaxCards = Math.round(personalMaxCards * 1.3);
      personalEstimatedFunding = Math.round(personalEstimatedFunding * 2.0);
    } else if (avgScore >= 650) {
      personalMaxCards = Math.round(personalMaxCards * 1.1);
      personalEstimatedFunding = Math.round(personalEstimatedFunding * 1.5);
    }
    
    // Adjust based on utilization
    if (utilization <= 10) {
      personalMaxCards = Math.round(personalMaxCards * 1.2);
      personalEstimatedFunding = Math.round(personalEstimatedFunding * 1.3);
    } else if (utilization > 30) {
      personalMaxCards = Math.round(personalMaxCards * 0.8);
      personalEstimatedFunding = Math.round(personalEstimatedFunding * 0.7);
    }
    
    // Adjust based on account age
    if (averageAccountAge >= 36) { // 3+ years
      personalMaxCards = Math.round(personalMaxCards * 1.2);
      personalEstimatedFunding = Math.round(personalEstimatedFunding * 1.2);
    } else if (averageAccountAge < 12) { // Less than 1 year
      personalMaxCards = Math.round(personalMaxCards * 0.7);
      personalEstimatedFunding = Math.round(personalEstimatedFunding * 0.6);
    }
    
    // Adjust based on recent inquiries
    if (recentInquiries > 6) {
      personalMaxCards = Math.round(personalMaxCards * 0.6);
      personalEstimatedFunding = Math.round(personalEstimatedFunding * 0.6);
    } else if (recentInquiries <= 2) {
      personalMaxCards = Math.round(personalMaxCards * 1.1);
      personalEstimatedFunding = Math.round(personalEstimatedFunding * 1.1);
    }
    
    // Ensure reasonable bounds
    personalMaxCards = Math.max(2, Math.min(20, personalMaxCards));
    personalEstimatedFunding = Math.max(10000, Math.min(500000, personalEstimatedFunding));
    
    // Calculate business funding (typically higher limits)
    const businessMaxCards = Math.round(personalMaxCards * 0.8);
    const businessEstimatedFunding = Math.round(personalEstimatedFunding * 1.4);
    
    // Generate bureau logic descriptions
    const personalBureauLogic = `Score: ${avgScore}, Util: ${utilization}%, Age: ${Math.round(averageAccountAge/12)}y, Inq: ${recentInquiries}`;
    const businessBureauLogic = `EIN required, Score: ${avgScore}+, Business profile verified`;
    
    return {
      personal: {
        maxCards: personalMaxCards,
        estimatedFunding: personalEstimatedFunding,
        bureauLogic: personalBureauLogic
      },
      business: {
        maxCards: businessMaxCards,
        estimatedFunding: businessEstimatedFunding,
        bureauLogic: businessBureauLogic
      }
    };
  };

  // Comprehensive Audit-Ready Credit Analysis Functions
  const calculateAuditReadyAnalysis = (accounts: any[], inquiries: any, publicRecords: any[], avgScore: number) => {
    console.log('🔍 DEBUG: calculateAuditReadyAnalysis called with:', {
      accountsLength: accounts.length,
      inquiries,
      publicRecordsLength: publicRecords.length,
      avgScore
    });
    
    console.log('🔍 DEBUG: Sample account structure:', accounts[0]);
    console.log('🔍 DEBUG: All unique AccountStatus values:', [...new Set(accounts.map(a => a.AccountStatus))]);
    console.log('🔍 DEBUG: All unique CreditType values:', [...new Set(accounts.map(a => a.CreditType))]);
    console.log('🔍 DEBUG: All unique AccountTypeDescription values:', [...new Set(accounts.map(a => a.AccountTypeDescription))]);
    
    // Filter only open revolving accounts with positive limits - using correct field names from API
    const openRevolvingAccounts = accounts.filter(acc => {
      const isOpen = acc.AccountStatus === 'Open';
      const isRevolving = acc.CreditType === 'Revolving Account' || acc.AccountTypeDescription === 'Revolving Account';
      const hasLimit = parseFloat(acc.CreditLimit || '0') > 0;
      
      if (acc.CreditorName && acc.CreditorName.includes('CAPITAL')) {
        console.log('🔍 DEBUG: Sample filter check for', acc.CreditorName, {
          AccountStatus: acc.AccountStatus,
          CreditType: acc.CreditType,
          AccountTypeDescription: acc.AccountTypeDescription,
          CreditLimit: acc.CreditLimit,
          isOpen,
          isRevolving,
          hasLimit,
          passes: isOpen && isRevolving && hasLimit
        });
      }
      
      return isOpen && isRevolving && hasLimit;
    });

    console.log('🔍 DEBUG: Open revolving accounts found:', openRevolvingAccounts.length);
    console.log('🔍 DEBUG: Sample filtered account:', openRevolvingAccounts[0]);

    // Dedupe obvious bureau duplicates (same lender + same limit)
    const deduplicatedAccounts = openRevolvingAccounts.reduce((unique: any[], account: any) => {
      const creditorName = account.CreditorName || '';
      const creditLimit = parseFloat(account.CreditLimit || '0');
      
      const isDuplicate = unique.some(existing => {
        const existingCreditor = existing.CreditorName || '';
        const existingLimit = parseFloat(existing.CreditLimit || '0');
        return existingCreditor === creditorName && Math.abs(existingLimit - creditLimit) < 100;
      });
      
      if (!isDuplicate) {
        unique.push(account);
      }
      return unique;
    }, []);

    console.log('🔍 DEBUG: Deduplicated accounts:', deduplicatedAccounts.length);

    // Calculate key signals using correct field names
    const totalAggregateLimit = deduplicatedAccounts.reduce((sum, acc) => 
      sum + parseFloat(acc.CreditLimit || '0'), 0);
    
    const highestSingleLimit = Math.max(...deduplicatedAccounts.map(acc => 
      parseFloat(acc.CreditLimit || '0')), 0);

    console.log('🔍 DEBUG: Total aggregate limit:', totalAggregateLimit);
    console.log('🔍 DEBUG: Highest single limit:', highestSingleLimit);

    const signals = {
      totalAggregateLimit,
      highestSingleLimit,
      highLimitTradelines: {
        over10k: deduplicatedAccounts.filter(acc => 
          parseFloat(acc.CreditLimit || '0') >= 10000).length,
        over25k: deduplicatedAccounts.filter(acc => 
          parseFloat(acc.CreditLimit || '0') >= 25000).length
      },
      averageUtilization: deduplicatedAccounts.length > 0 ? 
        deduplicatedAccounts.reduce((sum, acc) => {
          const balance = parseFloat(acc.CurrentBalance || '0');
          const limit = parseFloat(acc.CreditLimit || '0');
          return sum + (limit > 0 ? (balance / limit) * 100 : 0);
        }, 0) / deduplicatedAccounts.length : 0,
      openRevolvingCount: deduplicatedAccounts.length,
      averageAccountAge: deduplicatedAccounts.length > 0 ?
        deduplicatedAccounts.reduce((sum, acc) => {
          const openDate = new Date(acc.DateOpened || '2020-01-01');
          const monthsOpen = Math.max(0, Math.floor((Date.now() - openDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
          return sum + monthsOpen;
        }, 0) / deduplicatedAccounts.length : 0,
      inquiriesByBureau: {
        equifax: (inquiries && inquiries.equifax) || 0,
        experian: (inquiries && inquiries.experian) || 0,
        transunion: (inquiries && inquiries.transunion) || 0,
        total: ((inquiries && inquiries.equifax) || 0) + ((inquiries && inquiries.experian) || 0) + ((inquiries && inquiries.transunion) || 0)
      },
      inquiryHeadroom: {
        equifax: Math.max(0, 4 - ((inquiries && inquiries.equifax) || 0)),
        experian: Math.max(0, 4 - ((inquiries && inquiries.experian) || 0)),
        transunion: Math.max(0, 4 - ((inquiries && inquiries.transunion) || 0))
      },
      installmentLoad: accounts.filter(acc => 
        acc.CreditType === 'Installment' && acc.AccountStatus === 'Open')
        .reduce((sum, acc) => {
          const balance = parseFloat(acc.CurrentBalance || '0');
          const original = parseFloat(acc.HighBalance || '1');
          return sum + (original > 0 ? balance / original : 0);
        }, 0) / Math.max(1, accounts.filter(acc => 
          acc.CreditType === 'Installment' && acc.AccountStatus === 'Open').length),
      latePaymentCounts: {
        late30: accounts.reduce((sum, acc) => {
          // Count 30-day lates from PayStatusHistory (look for '1' characters)
          const history = acc.PayStatusHistory || '';
          const late30Count = (history.match(/1/g) || []).length;
          return sum + late30Count;
        }, 0),
        late60: accounts.reduce((sum, acc) => {
          // Count 60-day lates from PayStatusHistory (look for '2' characters)
          const history = acc.PayStatusHistory || '';
          const late60Count = (history.match(/2/g) || []).length;
          return sum + late60Count;
        }, 0),
        late90: accounts.reduce((sum, acc) => {
          // Count 90-day lates from PayStatusHistory (look for '3' characters)
          const history = acc.PayStatusHistory || '';
          const late90Count = (history.match(/3/g) || []).length;
          return sum + late90Count;
        }, 0)
      },
      hasDerogatory: (publicRecords && publicRecords.length > 0) || accounts.some(acc => 
        (acc.PaymentStatus && (acc.PaymentStatus.includes('Charge') || acc.PaymentStatus.includes('Collection'))) ||
        (acc.AccountStatus && acc.AccountStatus.includes('Charged Off'))
      ),
      hasMortgage: accounts.some(acc => 
        acc.CreditType === 'Mortgage' && acc.AccountStatus === 'Open')
    };

    // Calculate Implied Capacity Index (ICI)
    const supplyScore = Math.min(100, 
      (signals.totalAggregateLimit / 100000) * 30 +
      (signals.highestSingleLimit / 50000) * 20 +
      (signals.openRevolvingCount / 10) * 15 +
      (signals.highLimitTradelines.over10k / 5) * 10 +
      (signals.highLimitTradelines.over25k / 3) * 25
    );

    const behaviorScore = Math.min(100,
      Math.max(0, 100 - signals.averageUtilization) * 0.4 +
      Math.max(0, 100 - (signals.latePaymentCounts.late30 * 10 + signals.latePaymentCounts.late60 * 20 + signals.latePaymentCounts.late90 * 30)) * 0.3 +
      Math.max(0, 100 - (signals.inquiriesByBureau.total * 5)) * 0.2 +
      Math.max(0, 100 - (signals.installmentLoad * 100)) * 0.1
    );

    const seasoningScore = Math.min(100,
      (signals.averageAccountAge / 120) * 70 + // 120 months = 10 years for max score
      (signals.hasMortgage ? 30 : 0)
    );

    const ici = (supplyScore * 0.4 + behaviorScore * 0.4 + seasoningScore * 0.2) / 100;
    
    // Calculate Credit Decay based on inquiry count using exponential decay formula
    const calculateCreditDecay = (inquiryCount: number): { decayFactor: number, decayPercentage: number } => {
      // Exponential decay formula: 0.95^inquiries
      const decayFactor = Math.pow(0.95, inquiryCount);
      const decayPercentage = (1 - decayFactor) * 100; // Convert to percentage
      
      return {
        decayFactor,
        decayPercentage
      };
    };

    // Apply credit decay to bureau-specific limits
    const applyBureauDecay = (baseLimit: number, bureauInquiries: number): number => {
      const { decayFactor } = calculateCreditDecay(bureauInquiries);
      const finalLimit = baseLimit * decayFactor;
      return Math.floor(finalLimit / 5000) * 5000; // Round to nearest $5k
    };

    // Calculate Anchor Exposure
    const anchorExposure = ici * (signals.totalAggregateLimit + signals.highestSingleLimit);

    // Product mapping with $5k rounding
    const personalCardAmount = Math.floor((anchorExposure * 0.15) / 5000) * 5000;
    const businessCardAmount = Math.floor((anchorExposure * 0.22) / 5000) * 5000;

    // Calculate bureau-specific limits with decay
    const bureauLimits = {
      equifax: {
        baseLimit: personalCardAmount,
        inquiries: signals.inquiriesByBureau.equifax,
        decay: calculateCreditDecay(signals.inquiriesByBureau.equifax),
        finalLimit: applyBureauDecay(personalCardAmount, signals.inquiriesByBureau.equifax)
      },
      experian: {
        baseLimit: personalCardAmount,
        inquiries: signals.inquiriesByBureau.experian,
        decay: calculateCreditDecay(signals.inquiriesByBureau.experian),
        finalLimit: applyBureauDecay(personalCardAmount, signals.inquiriesByBureau.experian)
      },
      transunion: {
        baseLimit: personalCardAmount,
        inquiries: signals.inquiriesByBureau.transunion,
        decay: calculateCreditDecay(signals.inquiriesByBureau.transunion),
        finalLimit: applyBureauDecay(personalCardAmount, signals.inquiriesByBureau.transunion)
      }
    };

    const totalPotentialLimit = bureauLimits.equifax.finalLimit + 
                               bureauLimits.experian.finalLimit + 
                               bureauLimits.transunion.finalLimit;

    console.log('🔍 DEBUG: Credit Decay Analysis:', {
      basePersonalLimit: personalCardAmount,
      bureauLimits,
      totalPotentialLimit
    });

    // Multi-card discount policy
    const calculateMultiCardAmounts = (singleAmount: number, maxCards: number) => {
      const discounts = [1.0, 0.75, 0.60, 0.50]; // 1st, 2nd, 3rd, 4th card
      const amounts = [];
      for (let i = 0; i < Math.min(maxCards, 4); i++) {
        const cardAmount = Math.floor((singleAmount * discounts[i]) / 5000) * 5000;
        amounts.push(cardAmount);
      }
      return amounts;
    };

    // Determine optimal bureau routing
    const bureausByInquiries = [
      { name: 'Equifax', inquiries: signals.inquiriesByBureau.equifax, headroom: signals.inquiryHeadroom.equifax },
      { name: 'Experian', inquiries: signals.inquiriesByBureau.experian, headroom: signals.inquiryHeadroom.experian },
      { name: 'TransUnion', inquiries: signals.inquiriesByBureau.transunion, headroom: signals.inquiryHeadroom.transunion }
    ].sort((a, b) => b.headroom - a.headroom);

    // Calculate max cards by inquiry headroom
    const totalHeadroom = signals.inquiryHeadroom.equifax + signals.inquiryHeadroom.experian + signals.inquiryHeadroom.transunion;
    const maxCardsByInquiries = Math.min(12, totalHeadroom);

    // Generate scenarios
    const personalSingle = personalCardAmount;
    const personalMulti = calculateMultiCardAmounts(personalCardAmount, 2);
    const businessSingle = businessCardAmount;
    const businessMulti = calculateMultiCardAmounts(businessCardAmount, 2);

    // Max scenario (12-card if all bureaus clean)
    const maxScenarioCards = maxCardsByInquiries;
    const maxScenarioPersonal = calculateMultiCardAmounts(personalCardAmount, Math.min(4, Math.floor(maxScenarioCards / 2)));
    const maxScenarioBusiness = calculateMultiCardAmounts(businessCardAmount, Math.min(4, Math.ceil(maxScenarioCards / 2)));

    return {
      signals,
      ici,
      anchorExposure,
      creditDecay: {
        bureauLimits,
        totalPotentialLimit,
        decayAnalysis: {
          equifax: {
            inquiries: signals.inquiriesByBureau.equifax,
            decayFactor: bureauLimits.equifax.decay || 1,
            decayPercentage: ((1 - (bureauLimits.equifax.decay || 1)) * 100),
            limitReduction: bureauLimits.equifax.baseLimit - bureauLimits.equifax.finalLimit
          },
          experian: {
            inquiries: signals.inquiriesByBureau.experian,
            decayFactor: bureauLimits.experian.decay || 1,
            decayPercentage: ((1 - (bureauLimits.experian.decay || 1)) * 100),
            limitReduction: bureauLimits.experian.baseLimit - bureauLimits.experian.finalLimit
          },
          transunion: {
            inquiries: signals.inquiriesByBureau.transunion,
            decayFactor: bureauLimits.transunion.decay || 1,
            decayPercentage: ((1 - (bureauLimits.transunion.decay || 1)) * 100),
            limitReduction: bureauLimits.transunion.baseLimit - bureauLimits.transunion.finalLimit
          }
        }
      },
      scenarios: {
        personalSingle: { amount: personalSingle, cards: 1 },
        personalMulti: { amounts: personalMulti, cards: personalMulti.length, total: personalMulti.reduce((sum, amt) => sum + amt, 0) },
        businessSingle: { amount: businessSingle, cards: 1 },
        businessMulti: { amounts: businessMulti, cards: businessMulti.length, total: businessMulti.reduce((sum, amt) => sum + amt, 0) },
        maxByInquiries: {
          cards: maxScenarioCards,
          personal: { amounts: maxScenarioPersonal, total: maxScenarioPersonal.reduce((sum, amt) => sum + amt, 0) },
          business: { amounts: maxScenarioBusiness, total: maxScenarioBusiness.reduce((sum, amt) => sum + amt, 0) },
          grandTotal: maxScenarioPersonal.reduce((sum, amt) => sum + amt, 0) + maxScenarioBusiness.reduce((sum, amt) => sum + amt, 0)
        }
      },
      bureauRouting: {
        primary: bureausByInquiries[0],
        secondary: bureausByInquiries[1],
        tertiary: bureausByInquiries[2],
        strategy: maxCardsByInquiries === 12 ? 'round-robin across all three bureaus' : `focus on ${bureausByInquiries[0].name} and ${bureausByInquiries[1].name}`
      }
    };
  };

  // Mock data for scoring model (fallback when dynamic data is not available)
  const scoringModelData = {
    userProfile: {
      scoreEquifax: dynamicFundingData ? reportData.scores.equifax : 720,
      scoreTransUnion: dynamicFundingData ? reportData.scores.transunion : 710,
      scoreExperian: dynamicFundingData ? reportData.scores.experian : 700,
      inquiries: {
        equifax: reportData.inquiries ? reportData.inquiries.filter(inquiry => inquiry.bureau === 'Equifax').length : 0,
        transunion: reportData.inquiries ? reportData.inquiries.filter(inquiry => inquiry.bureau === 'TransUnion').length : 0,
        experian: reportData.inquiries ? reportData.inquiries.filter(inquiry => inquiry.bureau === 'Experian').length : 0
      },
      creditAge: calculateCreditAge(),
      utilization: calculateUtilization()
    },
    fundingProjection: calculateFundingProjections()
  };

  const { clientId: urlClientId } = useParams<{ clientId: string }>();
  // Align clientId resolution with other client pages: prefer authenticated user ID
  const clientId = userProfile?.id?.toString() || urlClientId || searchParams.get("clientId");
  const clientName = searchParams.get("clientName") || "Client";

  // Transform API account data to match frontend structure
  const transformApiAccounts = (apiAccounts: any[]) => {
    if (!apiAccounts || !Array.isArray(apiAccounts)) {
      console.log('🔍 DEBUG: No API accounts to transform');
      return [];
    }

    console.log('🔍 DEBUG: Transforming API accounts:', apiAccounts);

    return apiAccounts.map((account, index) => {
      const balance = parseFloat(account.CurrentBalance || 0);
      const limit = parseFloat(account.CreditLimit || account.HighBalance || 0);
      const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;

      // Map BureauId to bureau name
      const getBureauName = (bureauId: number) => {
        switch (bureauId) {
          case 1: return 'Experian';
          case 2: return 'TransUnion';
          case 3: return 'Equifax';
          default: return 'Unknown';
        }
      };

      const transformed = {
        id: index + 1,
        creditor: account.CreditorName || 'Unknown',
        accountNumber: account.AccountNumber ? `**${account.AccountNumber.slice(-4)}` : '**0000',
        type: account.AccountType || account.AccountTypeDescription || 'Unknown',
        status: account.AccountStatus || account.AccountCondition || 'Unknown',
        balance: balance,
        limit: limit,
        creditLimit: limit, // Add creditLimit field for progress calculations
        minimumPayment: 0, // Not available in API data
        actualPayment: 0, // Not available in API data
        opened: account.DateOpened || '',
        dateOpened: account.DateOpened || '', // Add dateOpened field for progress calculations
        lastActivity: account.DateReported || '',
        paymentHistory: account.PaymentStatus || 'Unknown',
        utilization: utilization,
        remarks: account.Remark || 'No remarks',
        bureau: getBureauName(account.BureauId), // Add bureau field for filtering
        latePayments: {
          total: 0, // Would need to parse PayStatusHistory
          last30Days: 0,
          last60Days: 0,
          last90Days: 0,
          over90Days: 0,
        },
        // Add all the API fields directly to the transformed object
        // so they can be accessed in the table rendering
        ...account,
        // Add mock data for fields not available in API
        monthlyHistory: [],
        transactions: [], // Credit reports don't typically include detailed transaction history
        interestRate: 0,
        termLength: account.TermType || ''
      };

      console.log('🔍 DEBUG: Transformed account:', transformed);
      return transformed;
    });
  };

  // Helper functions to calculate account summary statistics
  const calculateAccountStats = () => {
    const accounts = reportData.accounts || [];
    
    console.log('🔍 DEBUG: Calculating account stats from:', accounts);
    console.log('🔍 DEBUG: reportData structure:', reportData);
    
    const totalAccounts = accounts.length;
    const openAccounts = accounts.filter((account: any) => 
      account.status === "Open" || account.AccountStatus === "Open" || account.AccountCondition === "Open"
    ).length;
    const closedAccounts = totalAccounts - openAccounts;
    
    const totalCreditLimit = accounts.reduce((sum: number, account: any) => {
      const limit = parseFloat(account.CreditLimit || account.limit || "0");
      return sum + (isNaN(limit) ? 0 : limit);
    }, 0);
    
    const totalBalance = accounts.reduce((sum: number, account: any) => {
      const balance = parseFloat(account.CurrentBalance || account.balance || "0");
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);
    
    const averageUtilization = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;
    
    const stats = {
      totalAccounts,
      openAccounts,
      closedAccounts,
      totalCreditLimit,
      averageUtilization
    };
    
    console.log('🔍 DEBUG: Calculated account stats:', stats);
    return stats;
  };

  const accountStats = calculateAccountStats();

  // Helper function to determine row background color based on qualification criteria
  const getRowBgColor = (tuCriteria: boolean, expCriteria: boolean, eqCriteria: boolean) => {
    const passCount = [tuCriteria, expCriteria, eqCriteria].filter(Boolean).length;
    
    if (passCount === 3) {
      return 'bg-green-50 border-green-200'; // All pass - light green
    } else if (passCount === 2) {
      return 'bg-yellow-50 border-yellow-200'; // 2 pass - light yellow
    } else if (passCount === 1) {
      return 'bg-orange-50 border-orange-200'; // 1 pass - light orange
    } else {
      return 'bg-red-50 border-red-200'; // None pass - light red
    }
  };

  useEffect(() => {
    const fetchCreditReport = async () => {
      if (!clientId) {
        setError("No client ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Fetch client data to retrieve SSN last four for masked display
        let dbSSNLastFour: string | null = null;
        try {
          const clientResp = await clientsApi.getClient(clientId);
          dbSSNLastFour = clientResp?.data?.ssn_last_four || null;
        } catch (clientErr) {
          console.warn('Failed to fetch client data for SSN last four:', clientErr);
        }
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/credit-reports/client/${clientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch credit report: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched credit report data:', data);
        console.log('🔍 DEBUG: Full response structure:', JSON.stringify(data, null, 2));
        
        // If we have real data, use it; otherwise keep the mock data
        if (data && data.success && data.data && data.data.reportData) {
          // Transform the API data to match our expected structure
          setApiData(data.data.reportData);
          console.log('🔍 DEBUG: API reportData:', data.data.reportData);
          console.log('🔍 DEBUG: API Name data:', data.data.reportData.Name);
          console.log('🔍 DEBUG: API DOB data:', data.data.reportData.DOB);
          console.log('🔍 DEBUG: API Address data:', data.data.reportData.Address);
          console.log('🔍 DEBUG: API Accounts array:', data.data.reportData.Accounts);
          console.log('🔍 DEBUG: API Accounts length:', data.data.reportData.Accounts ? data.data.reportData.Accounts.length : 'undefined');
          
          // Extract scores from the API data
          // Based on the JSON structure: BureauId 1=TransUnion, 2=Equifax, 3=Experian
          console.log('🔍 DEBUG: Full API data:', data.data.reportData);
          console.log('🔍 DEBUG: API Score data:', data.data.reportData.Score);
          
          // Extract scores and score types dynamically from API data
          let scores = {
            experian: "785", // Default fallback
            transunion: "769", // Default fallback
            equifax: "778" // Default fallback
          };

          let scoreTypes = {
            experian: "FICO", // Default fallback
            transunion: "FICO", // Default fallback
            equifax: "FICO" // Default fallback
          };
          
          // If we have Score data from API, use it
          if (data.data.reportData.Score && Array.isArray(data.data.reportData.Score)) {
            const scoreData = data.data.reportData.Score;
            scoreData.forEach((score: any) => {
              if (score.BureauId === 1) {
                scores.transunion = score.Score;
                scoreTypes.transunion = score.ScoreType || "FICO";
              }
              if (score.BureauId === 2) {
                scores.experian = score.Score;
                scoreTypes.experian = score.ScoreType || "FICO";
              }
              if (score.BureauId === 3) {
                scores.equifax = score.Score;
                scoreTypes.equifax = score.ScoreType || "FICO";
              }
            });
            console.log('🔍 DEBUG: Extracted scores from API:', scores);
            console.log('🔍 DEBUG: Extracted score types from API:', scoreTypes);
          } else {
            console.log('🔍 DEBUG: Using fallback scores:', scores);
            console.log('🔍 DEBUG: Using fallback score types:', scoreTypes);
          }
          
          console.log('🔍 DEBUG: Mock scores fallback:', detailedReport.scores);
          
          // Extract personal information
          console.log('🔍 DEBUG: Extracting personal info from:', data.data.reportData);
          const nameData = data.data.reportData.Name?.find(n => n.NameType === "Primary" && n.BureauId === 3);
          const dobData = data.data.reportData.DOB?.find(d => d.BureauId === 3);
          console.log('🔍 DEBUG: Found name data:', nameData);
          console.log('🔍 DEBUG: Found DOB data:', dobData);
          
          const personalInfo = {
            name: nameData || {},
            dateOfBirth: dobData?.DOB || detailedReport.personalInfo.dateOfBirth,
            addresses: (data.data.reportData.Address || []).map(addr => ({
              street: addr.StreetAddress || '',
              city: addr.City || '',
              state: addr.State || '',
              zip: addr.Zip || '',
              type: addr.AddressType || 'Unknown',
              reportedDate: new Date().toISOString() // API doesn't provide this, use current date
            })),
            employers: (data.data.reportData.Employer || []).map(emp => ({
              name: emp.EmployerName || '',
              bureauId: emp.BureauId || 0,
              dateReported: emp.DateReported || emp.DateUpdated || new Date().toISOString(),
              dateUpdated: emp.DateUpdated || null,
              position: emp.Position || null,
              income: emp.Income || null
            })),
            ssn: dbSSNLastFour ? `***-**-${dbSSNLastFour}` : null
          };
          
          // Transform disputes from accounts with dispute flags
          const transformApiDisputes = (accounts) => {
            return accounts
              .filter(account => account.DisputeFlag && account.DisputeFlag !== 'Account not disputed')
              .map((account, index) => ({
                id: index + 1,
                date: account.DateReported || new Date().toISOString().split('T')[0],
                bureau: account.BureauId === 1 ? 'TransUnion' : account.BureauId === 2 ? 'Experian' : 'Equifax',
                accountDisputed: `${account.CreditorName} - ${account.AccountType}`,
                reason: account.DisputeFlag || 'Disputed',
                status: 'Under Investigation',
                expectedResolution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                result: 'Pending'
              }));
          };

          // Transform collections from accounts with negative indicators
          const transformApiCollections = (accounts) => {
            return accounts
              .filter(account => 
                account.AccountStatus === 'Closed' && 
                account.CurrentBalance > 0 ||
                account.PaymentStatus?.includes('Late') ||
                account.WorstPayStatus?.includes('Late') ||
                account.AmountPastDue > 0
              )
              .map((account, index) => ({
                id: index + 1,
                agency: account.CreditorName || 'Unknown Agency',
                originalCreditor: account.CreditorName || 'Unknown Creditor',
                currentCreditor: account.CreditorName || 'Unknown Creditor',
                accountNumber: `****${account.AccountNumber?.slice(-4) || '0000'}`,
                amount: parseInt(account.CurrentBalance) || parseInt(account.AmountPastDue) || 0,
                originalAmount: parseInt(account.HighBalance) || parseInt(account.CurrentBalance) || 0,
                dateOpened: account.DateOpened || new Date().toISOString().split('T')[0],
                dateReported: account.DateReported || new Date().toISOString().split('T')[0],
                lastActivity: account.DateAccountStatus || account.DateReported || new Date().toISOString().split('T')[0],
                status: account.AccountStatus || 'Unknown',
                disputeStatus: account.DisputeFlag === 'Account not disputed' ? 'None' : 'Disputed',
                paymentHistory: [],
                notes: `${account.AccountType} - ${account.Industry}`,
                phoneNumber: "(800) 555-0100"
              }));
          };

          // Extract bureau-specific dates from Score array
          const getBureauDate = (bureauId) => {
            const scoreEntry = data.data.reportData.Score?.find(s => s.BureauId === bureauId);
            if (scoreEntry?.DateScore) {
              return new Date(scoreEntry.DateScore).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
            // Fallback to report date
            const reportDate = data.data.report_date || data.data.created_at || new Date().toISOString();
            return new Date(reportDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          };

          // Calculate debt utilization from real account data
          const calculateDebtUtilization = (accounts) => {
            const utilizationByBureau = {
              1: { // TransUnion
                openRevolvingBalance: 0,
                openRevolvingLimit: 0,
                allRevolvingBalance: 0,
                allRevolvingLimit: 0,
                realEstateDebt: 0,
                installmentDebt: 0
              },
              2: { // Equifax
                openRevolvingBalance: 0,
                openRevolvingLimit: 0,
                allRevolvingBalance: 0,
                allRevolvingLimit: 0,
                realEstateDebt: 0,
                installmentDebt: 0
              },
              3: { // Experian
                openRevolvingBalance: 0,
                openRevolvingLimit: 0,
                allRevolvingBalance: 0,
                allRevolvingLimit: 0,
                realEstateDebt: 0,
                installmentDebt: 0
              }
            };

            accounts.forEach(account => {
              const bureauId = account.BureauId;
              const currentBalance = parseFloat(account.CurrentBalance) || 0;
              const creditLimit = parseFloat(account.CreditLimit) || 0;
              const highBalance = parseFloat(account.HighBalance) || 0;
              
              if (!utilizationByBureau[bureauId]) return;

              // Revolving accounts (credit cards, lines of credit)
              if (account.CreditType === 'Revolving Account' || account.AccountTypeDescription === 'Revolving Account') {
                // All revolving accounts
                utilizationByBureau[bureauId].allRevolvingBalance += currentBalance;
                utilizationByBureau[bureauId].allRevolvingLimit += creditLimit || highBalance;
                
                // Open revolving accounts only
                if (account.AccountStatus === 'Open' || account.AccountStatus === 'Current') {
                  utilizationByBureau[bureauId].openRevolvingBalance += currentBalance;
                  utilizationByBureau[bureauId].openRevolvingLimit += creditLimit || highBalance;
                }
              }
              
              // Real estate debt (mortgages)
              if (account.AccountType === 'Mortgage' || account.Industry?.includes('Real Estate') || 
                  account.CreditorName?.toLowerCase().includes('mortgage')) {
                if (account.AccountStatus === 'Open' || account.AccountStatus === 'Current') {
                  utilizationByBureau[bureauId].realEstateDebt += currentBalance;
                }
              }
              
              // Installment debt (auto loans, personal loans, etc.)
              if (account.CreditType === 'Installment Account' || account.AccountTypeDescription === 'Installment Account') {
                if (account.AccountStatus === 'Open' || account.AccountStatus === 'Current') {
                  utilizationByBureau[bureauId].installmentDebt += currentBalance;
                }
              }
            });

            return utilizationByBureau;
          };

          const debtUtilization = calculateDebtUtilization(data.data.reportData.Accounts || []);

          // Calculate qualification criteria
          const calculateQualificationCriteria = (apiData: any, debtUtilization: any, scoresData: any) => {
            const criteria = {
              1: { // TransUnion
                score700Plus: false,
                score730Plus: false,
                openRevolvingUnder30: false,
                allRevolvingUnder30: false,
                minFiveOpenRevolving: false,
                creditCard3YearsOld5KLimit: false,
                maxFourUnsecuredIn12Months: false,
                noInquiries: false,
                noBankruptcies: false,
                noCollectionsLiensJudgements: false,
                // Added explicit flags used by the Basic table
                noCollections: false,
                noChargeOffs: false,
                noLatePaymentsIn12Months: false
              },
              2: { // Equifax
                score700Plus: false,
                score730Plus: false,
                openRevolvingUnder30: false,
                allRevolvingUnder30: false,
                minFiveOpenRevolving: false,
                creditCard3YearsOld5KLimit: false,
                maxFourUnsecuredIn12Months: false,
                noInquiries: false,
                noBankruptcies: false,
                noCollectionsLiensJudgements: false,
                // Added explicit flags used by the Basic table
                noCollections: false,
                noChargeOffs: false,
                noLatePaymentsIn12Months: false
              },
              3: { // Experian
                score700Plus: false,
                score730Plus: false,
                openRevolvingUnder30: false,
                allRevolvingUnder30: false,
                minFiveOpenRevolving: false,
                creditCard3YearsOld5KLimit: false,
                maxFourUnsecuredIn12Months: false,
                noInquiries: false,
                noBankruptcies: false,
                noCollectionsLiensJudgements: false,
                // Added explicit flags used by the Basic table
                noCollections: false,
                noChargeOffs: false,
                noLatePaymentsIn12Months: false
              }
            };

            if (!apiData?.reportData) return criteria;

            // Check scores for each bureau - use the scores parameter passed in
            const scoreValues = {
              1: parseInt(scoresData.transunion) || 0,  // TransUnion
              2: parseInt(scoresData.equifax) || 0,     // Equifax  
              3: parseInt(scoresData.experian) || 0     // Experian
            };

            [1, 2, 3].forEach(bureauId => {
              const score = scoreValues[bureauId];
              console.log(`🔍 DEBUG: Bureau ${bureauId} score:`, score);
              if (score > 0) {
                criteria[bureauId].score700Plus = score >= 700;
                criteria[bureauId].score730Plus = score >= 730;
                console.log(`🔍 DEBUG: Bureau ${bureauId} - score700Plus: ${criteria[bureauId].score700Plus}, score730Plus: ${criteria[bureauId].score730Plus}`);
              }

              // Check utilization
              if (debtUtilization[bureauId]) {
                const openUtil = debtUtilization[bureauId].openRevolvingLimit > 0 
                  ? (debtUtilization[bureauId].openRevolvingBalance / debtUtilization[bureauId].openRevolvingLimit) * 100 
                  : 0;
                const allUtil = debtUtilization[bureauId].allRevolvingLimit > 0 
                  ? (debtUtilization[bureauId].allRevolvingBalance / debtUtilization[bureauId].allRevolvingLimit) * 100 
                  : 0;
                
                criteria[bureauId].openRevolvingUnder30 = openUtil < 30;
                criteria[bureauId].allRevolvingUnder30 = allUtil < 30;
              }

              // Check accounts for this bureau
              const bureauAccounts = apiData.reportData?.Accounts?.filter((acc: any) => acc.BureauId === bureauId) || [];
              
              const openRevolvingAccounts = bureauAccounts.filter((acc: any) => 
                (acc.CreditType === 'Revolving Account' || acc.AccountTypeDescription === 'Revolving Account') && 
                (acc.AccountStatus === 'Open' || acc.AccountStatus === 'Current')
              );
              
              criteria[bureauId].minFiveOpenRevolving = openRevolvingAccounts.length >= 5;

              // Check for 3+ year old credit card with $5K+ limit
              const qualifyingCard = openRevolvingAccounts.find((acc: any) => {
                if (!acc.DateOpened) return false;
                const openDate = new Date(acc.DateOpened);
                const yearsOld = (new Date().getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
                const creditLimit = parseFloat(acc.CreditLimit) || 0;
                return yearsOld >= 3 && creditLimit >= 5000;
              });
              criteria[bureauId].creditCard3YearsOld5KLimit = !!qualifyingCard;

              // Check unsecured accounts opened in past 12 months
              const recentUnsecuredAccounts = bureauAccounts.filter((acc: any) => {
                if (!acc.DateOpened) return false;
                const openDate = new Date(acc.DateOpened);
                const monthsOld = (new Date().getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
                return monthsOld <= 12 && (acc.CreditType === 'Revolving Account' || acc.AccountTypeDescription === 'Revolving Account');
              });
              criteria[bureauId].maxFourUnsecuredIn12Months = recentUnsecuredAccounts.length <= 4;

              // Check for collections, liens, judgements, late payments
              console.log(`🔍 DEBUG: Bureau ${bureauId} accounts for negative detection:`, bureauAccounts.map(acc => ({
                AccountType: acc.AccountType,
                PaymentStatus: acc.PaymentStatus,
                WorstPayStatus: acc.WorstPayStatus,
                AmountPastDue: acc.AmountPastDue,
                AccountTypeDescription: acc.AccountTypeDescription,
                AccountStatus: acc.AccountStatus
              })));
              
              const negativeAccounts = bureauAccounts.filter((acc: any) => 
                acc.PaymentStatus?.includes('Collection') || 
                acc.PaymentStatus?.includes('Charge') ||
                acc.PaymentStatus?.includes('Late') ||
                acc.WorstPayStatus?.includes('Late') ||
                acc.AccountType?.includes('Collection') ||
                (acc.AmountPastDue && parseFloat(acc.AmountPastDue) > 0)
              );
              
              console.log(`🔍 DEBUG: Bureau ${bureauId} negative accounts found:`, negativeAccounts.length, negativeAccounts);
              criteria[bureauId].noCollectionsLiensJudgements = negativeAccounts.length === 0;

              // Set individual negative-item criteria used in Basic view
              const collectionsCount = negativeAccounts.filter((acc: any) => 
                acc.PaymentStatus?.includes('Collection') || acc.AccountType?.includes('Collection')
              ).length;
              const chargeOffsCount = negativeAccounts.filter((acc: any) => 
                acc.PaymentStatus?.includes('Charge')
              ).length;
              const latePaymentsCount = negativeAccounts.filter((acc: any) => 
                acc.PaymentStatus?.includes('Late') || acc.WorstPayStatus?.includes('Late')
              ).length;

              criteria[bureauId].noCollections = collectionsCount === 0;
              criteria[bureauId].noChargeOffs = chargeOffsCount === 0;
              // Approximate late payments in past 12 months with available fields
              criteria[bureauId].noLatePaymentsIn12Months = latePaymentsCount === 0;
              // Back-compat alias for views that expect noLatePayments
              (criteria[bureauId] as any).noLatePayments = criteria[bureauId].noLatePaymentsIn12Months;

              // Check inquiries for this bureau
              const bureauInquiries = apiData.reportData?.Inquiries?.filter((inq: any) => 
                inq.BureauId === bureauId && inq.InquiryType === 'I'
              ) || [];
              criteria[bureauId].noInquiries = bureauInquiries.length === 0;

              // Check bankruptcies (simplified - would need more detailed bankruptcy data)
              criteria[bureauId].noBankruptcies = true; // Assume no bankruptcies for now
            });

            return criteria;
          };

          const qualificationCriteria = calculateQualificationCriteria(data.data, debtUtilization, scores);
          console.log('🔍 DEBUG: Final qualification criteria:', qualificationCriteria);

          const transformedData = {
            ...detailedReport,
            scores: scores,
            scoreTypes: scoreTypes,
            bureauDates: {
              experian: getBureauDate(1),
              transunion: getBureauDate(2), 
              equifax: getBureauDate(3)
            },
            previousScores: detailedReport.previousScores, // Keep mock previous scores for now
            personalInfo: {
              ...detailedReport.personalInfo,
              ...personalInfo,
              name: personalInfo.name.FirstName && personalInfo.name.LastName 
                ? `${personalInfo.name.FirstName} ${personalInfo.name.Middle || ''} ${personalInfo.name.LastName}`.trim()
                : detailedReport.personalInfo.name
            },
            accounts: transformApiAccounts(data.data.reportData.Accounts || []),
            collections: transformApiCollections(data.data.reportData.Accounts || []),
            disputeHistory: transformApiDisputes(data.data.reportData.Accounts || []),
            inquiries: (data.data.reportData.Inquiries || []).map((inquiry, index) => ({
              id: index + 1,
              company: inquiry.CreditorName || 'Unknown Creditor',
              creditorName: inquiry.CreditorName || 'Unknown Creditor', // Add creditorName field for progress display
              purpose: inquiry.Industry || 'Unknown Purpose',
              type: inquiry.InquiryType === 'I' ? 'Hard' : 'Soft',
              date: inquiry.DateInquiry || new Date().toISOString().split('T')[0],
              bureau: inquiry.BureauId === 1 ? 'TransUnion' : inquiry.BureauId === 2 ? 'Experian' : 'Equifax'
            })),
            publicRecords: apiData?.PublicRecords || [],
            // Keep the original structure for other data
            creditUtilization: detailedReport.creditUtilization,
            debtUtilization: debtUtilization, // Add calculated debt utilization
            qualificationCriteria: qualificationCriteria, // Add calculated qualification criteria
            paymentHistory: detailedReport.paymentHistory,
            creditAge: detailedReport.creditAge,
            creditMix: detailedReport.creditMix,
            recentInquiries: detailedReport.recentInquiries
          };
          
          console.log('🔍 DEBUG: Final transformedData scores:', transformedData.scores);
          console.log('🔍 DEBUG: Final transformedData accounts:', transformedData.accounts);
          console.log('🔍 DEBUG: Setting report data with scores:', transformedData.scores);
          
          // Fetch report history for this client
          try {
            // Get fresh token from localStorage
            const freshToken = localStorage.getItem('auth_token');
            console.log('🔍 DEBUG: Fresh token from localStorage:', freshToken ? `Token exists (${freshToken.substring(0, 20)}...)` : 'No token');
            console.log('🔍 DEBUG: Original token:', token ? `Token exists (${token.substring(0, 20)}...)` : 'No token');
            console.log('🔍 DEBUG: Making request to:', `/api/credit-reports/history?clientId=${clientId}`);
            
            // Use AbortController to handle timeouts
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const historyResponse = await fetch(`/api/credit-reports/history?clientId=${clientId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${freshToken || token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('🔍 DEBUG: History response status:', historyResponse.status);
            console.log('🔍 DEBUG: History response ok:', historyResponse.ok);
            
            if (historyResponse.ok) {
              const historyData = await historyResponse.json();
              console.log('🔍 DEBUG: Report history data:', historyData);
              transformedData.reportHistory = historyData.data || [];
            } else {
              const errorText = await historyResponse.text();
              console.warn('Failed to fetch report history:', historyResponse.status, errorText);
              transformedData.reportHistory = [];
            }
          } catch (historyErr) {
            console.error('Error fetching report history:', historyErr);
            console.error('Error details:', {
              name: historyErr.name,
              message: historyErr.message,
              stack: historyErr.stack
            });
            
            // If it's an AbortError, it was a timeout
            if (historyErr.name === 'AbortError') {
              console.error('Request was aborted (likely timeout)');
            }
            
            transformedData.reportHistory = [];
          }
          
          setReportData(transformedData);
        } else {
          // If no API data, ensure we still update with correct scores and add default bureau dates
          console.log('🔍 DEBUG: No API data, forcing correct scores anyway');
          const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          
          // Create mock qualification criteria for high scores
          const mockQualificationCriteria = {
            1: { // TransUnion
              score700Plus: true,
              score730Plus: true,
              openRevolvingUnder30: true,
              allRevolvingUnder30: true,
              minFiveOpenRevolving: true,
              creditCard3YearsOld5KLimit: true,
              maxFourUnsecuredIn12Months: true,
              noInquiries: true,
              noBankruptcies: true,
              noCollectionsLiensJudgements: true
            },
            2: { // Equifax
              score700Plus: true,
              score730Plus: true,
              openRevolvingUnder30: true,
              allRevolvingUnder30: true,
              minFiveOpenRevolving: true,
              creditCard3YearsOld5KLimit: true,
              maxFourUnsecuredIn12Months: true,
              noInquiries: true,
              noBankruptcies: true,
              noCollectionsLiensJudgements: true
            },
            3: { // Experian
              score700Plus: true,
              score730Plus: true,
              openRevolvingUnder30: true,
              allRevolvingUnder30: true,
              minFiveOpenRevolving: true,
              creditCard3YearsOld5KLimit: true,
              maxFourUnsecuredIn12Months: true,
              noInquiries: true,
              noBankruptcies: true,
              noCollectionsLiensJudgements: true
            }
          };
          
          const updatedMockData = {
            ...detailedReport,
            scores: {
              experian: "785",
              transunion: "769", 
              equifax: "778"
            },
            scoreTypes: {
              experian: "FICO",
              transunion: "FICO",
              equifax: "FICO"
            },
            bureauDates: {
              experian: currentDate,
              transunion: currentDate,
              equifax: currentDate
            },
            qualificationCriteria: mockQualificationCriteria,
            reportHistory: [] // Add empty report history for mock data
          };
          // Apply SSN from client DB if available; otherwise set to null
          updatedMockData.personalInfo = {
            ...updatedMockData.personalInfo,
            ssn: (typeof dbSSNLastFour === 'string' && dbSSNLastFour) ? `***-**-${dbSSNLastFour}` : null
          };
          setReportData(updatedMockData);
        }
      } catch (err) {
        console.error('Error fetching credit report:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch credit report');
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchCreditReport();
  }, [clientId]);

  const getScoreChange = (current: number, previous: number) => {
    const change = current - previous;
    return {
      value: change,
      isPositive: change >= 0,
      icon: change >= 0 ? ArrowUp : ArrowDown,
      color: change >= 0 ? "text-green-600" : "text-red-600",
    };
  };

  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Charge Off":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return "text-green-600";
    if (utilization < 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <ClientLayout
        title={`Credit Report - ${clientName}`}
        description="Loading credit report..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading credit report...</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout
        title={`Credit Report - ${clientName}`}
        description="Error loading credit report"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout
      title={`Credit Report - ${clientName}`}
      description="Detailed credit report analysis and information"
    >
      {/* Header Navigation */}
      <div className="mb-6">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text-primary">
              {clientName}
            </h1>
            <p className="text-muted-foreground">Credit Report Analysis</p>
          </div>
          <div className="flex gap-2">
            
          </div>
        </div>
      </div>

          <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-ocean-blue" />
              Account Details by Bureau
            </CardTitle>
                <CardDescription>
                  Detailed account information from each credit bureau
                </CardDescription>
              </CardHeader>
          <CardContent>
            {(() => {
              // Group accounts by creditor and account number for comparison
              const groupAccountsForComparison = () => {
                if (!reportData.accounts || reportData.accounts.length === 0) {
                  return [];
                }

                const grouped = {};
                const accountGroupTracker = new Set(); // Track unique account groups by first 5 digits + account type
                
                reportData.accounts.forEach(account => {
                  const creditorName = account.CreditorName || account.creditor || 'Unknown';
                  const accountNumber =
                    account.AccountNumber ||
                    account.accountNumber ||
                    account.MaskAccountNumber ||
                    account.maskAccountNumber ||
                    account.MaskedAccountNumber ||
                    account.maskedAccountNumber ||
                    'N/A';
                  const accountType = account.AccountTypeDescription || account.CreditType || account.type || 'N/A';
                  
                  // Get first 5 digits of account number for grouping
                  const normalizedAccountNumber = accountNumber.toString().replace(/[\s\-]/g, '');
                  const first5Digits = normalizedAccountNumber.substring(0, 5);
                  
                  // Create a unique identifier based on first 5 digits + account type
                  const groupIdentifier = `${first5Digits}_${accountType}`.toLowerCase();
                  
                  // Check if this account group already exists
                  const existingKey = Object.keys(grouped).find(key => {
                    const existingAccountNumber = grouped[key].accountNumber.toString().replace(/[\s\-]/g, '');
                    const existingFirst5 = existingAccountNumber.substring(0, 5);
                    const existingType = grouped[key].type;
                    const existingIdentifier = `${existingFirst5}_${existingType}`.toLowerCase();
                    return existingIdentifier === groupIdentifier;
                  });
                  
                  if (existingKey && accountNumber !== 'N/A') {
                    // Merge bureau data into existing group
                    const bureauName = account.bureau || 'Unknown';
                    grouped[existingKey].bureaus[bureauName] = {
                      balance: account.CurrentBalance || account.balance || 0,
                      limit: account.CreditLimit || account.creditLimit || account.limit || 0,
                      status: account.AccountStatus || account.status || 'Unknown',
                      utilization: account.utilization || (() => {
                        const balance = parseInt(account.CurrentBalance || 0);
                        const creditLimit = parseInt(account.CreditLimit || 0);
                        const highBalance = parseInt(account.HighBalance || 0);
                        
                        // Use High Balance as credit limit when Credit Limit is 0
                        const effectiveLimit = creditLimit > 0 ? creditLimit : highBalance;
                        
                        if (balance && effectiveLimit > 0) {
                          return Math.round((balance / effectiveLimit) * 100);
                        }
                        return 0;
                      })(),
                      opened: account.DateOpened || account.dateOpened || account.opened,
                      paymentHistory: account.PaymentStatus || account.paymentHistory || 'N/A',
                      designator: account.AccountDesignator || account.designator || 'N/A',
                      reported: account.DateReported || account.dateReported || account.reported,
                      pastDue: account.AmountPastDue || account.pastDue || 0,
                      highBalance: account.HighBalance || account.highBalance || 0,
                      industry: account.Industry || account.industry || 'N/A',
                      worstStatus: account.WorstPayStatus || account.worstStatus || 'N/A',
                      remark: account.Remark || account.remark || 'N/A',
                      payStatusHistory: account.PayStatusHistory || account.payStatusHistory || 'N/A',
                      payStatusHistoryStartDate: account.PayStatusHistoryStartDate || account.payStatusHistoryStartDate || 'N/A',
                      // Ensure creditor and account number are present for merged bureaus
                      creditorName: account.CreditorName || account.creditor || 'Unknown',
                      accountNumber: (
                        account.AccountNumber ||
                        account.accountNumber ||
                        account.MaskAccountNumber ||
                        account.maskAccountNumber ||
                        account.MaskedAccountNumber ||
                        account.maskedAccountNumber ||
                        'N/A'
                      ),
                      // Add additional bureau-specific fields to avoid N/A in TU/EQ
                      creditType: account.CreditType || account.creditType || grouped[existingKey]?.type || 'N/A',
                      accountTypeDescription: account.AccountTypeDescription || account.accountTypeDescription || 'N/A',
                      accountType: account.AccountType || account.accountType || 'N/A',
                      paymentFrequency: account.PaymentFrequency || account.paymentFrequency || 'N/A',
                      accountCondition: account.AccountCondition || account.accountCondition || account.AccountStatus || 'N/A',
                      disputeFlag: account.DisputeFlag || account.disputeFlag || 'N/A'
                      ,
                      // Ensure status date is carried per bureau
                      dateAccountStatus: account.DateAccountStatus || account.dateAccountStatus || 'N/A'
                    };
                    return; // Skip creating new group
                  }
                  
                  // Create a unique key based on creditor name, first 5 digits, and account type
                  const key = `${creditorName}_${first5Digits}_${accountType}`;
                  
                  if (!grouped[key]) {
                    grouped[key] = {
                      creditor: creditorName,
                      accountNumber: accountNumber,
                      type: accountType,
                      bureaus: {}
                    };
                    
                    // Track this account group to prevent duplicates
                    if (accountNumber !== 'N/A') {
                      accountGroupTracker.add(groupIdentifier);
                    }
                  }
                  
                  // Add account data for this bureau
                  const bureauName = account.bureau || 'Unknown';
                  grouped[key].bureaus[bureauName] = {
                    balance: account.CurrentBalance || account.balance || 0,
                    limit: account.CreditLimit || account.creditLimit || account.limit || 0,
                    status: account.AccountStatus || account.status || 'Unknown',
                    utilization: account.utilization || (calculateAccountUtilization(account)?.utilization ?? 0),
                    opened: account.DateOpened || account.dateOpened || account.opened,
                    paymentHistory: account.PaymentStatus || account.paymentHistory || 'N/A',
                    designator: account.AccountDesignator || account.designator || 'N/A',
                    reported: account.DateReported || account.dateReported || account.reported,
                    pastDue: account.AmountPastDue || account.pastDue || 0,
                    highBalance: account.HighBalance || account.highBalance || 0,
                    industry: account.Industry || account.industry || 'N/A',
                    worstStatus: account.WorstPayStatus || account.worstStatus || 'N/A',
                    remark: account.Remark || account.remark || 'N/A',
                    payStatusHistory: account.PayStatusHistory || account.payStatusHistory || 'N/A',
                    payStatusHistoryStartDate: account.PayStatusHistoryStartDate || account.payStatusHistoryStartDate || 'N/A',
                    creditorName: creditorName,
                    accountNumber: accountNumber,
                    creditType: account.CreditType || account.creditType || accountType || 'N/A',
                    accountTypeDescription: account.AccountTypeDescription || account.accountTypeDescription || 'N/A',
                    accountType: account.AccountType || account.accountType || 'N/A',
                    paymentFrequency: account.PaymentFrequency || account.paymentFrequency || 'N/A',
                    termType: account.TermType || account.termType || 'N/A',
                    dateAccountStatus: account.DateAccountStatus || account.dateAccountStatus || 'N/A',
                    accountCondition: account.AccountCondition || account.accountCondition || 'N/A',
                    disputeFlag: account.DisputeFlag || account.disputeFlag || 'N/A'
                  };
                });
                
                return Object.values(grouped);
              };

              const groupedAccounts = groupAccountsForComparison();

              if (groupedAccounts.length === 0) {
                return (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No accounts found</p>
                    <p className="text-sm text-muted-foreground">Check the Accounts tab for detailed account information</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Header with bureau logos */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-border shadow-sm">
                    <div className="font-bold text-base text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0V9a2 2 0 012-2h14a2 2 0 012 2v2M7 7V3a4 4 0 018 0v4M9 7h6" />
                      </svg>
                      Account Details
                    </div>
                    <div className="text-center bg-card rounded-lg p-3 border border-border shadow-sm hover:shadow-md transition-shadow">
                      <img src="/Experian_logo.svg.png" alt="Experian" className="h-8 w-auto mx-auto mb-2" />
                      <div className="text-sm font-semibold text-blue-700"></div>
                    </div>
                    <div className="text-center bg-card rounded-lg p-3 border border-border shadow-sm hover:shadow-md transition-shadow">
                      <img src="/TransUnion_logo.svg.png" alt="TransUnion" className="h-8 w-auto mx-auto mb-2" />
                      <div className="text-sm font-semibold text-purple-700"></div>
                    </div>
                    <div className="text-center bg-card rounded-lg p-3 border border-border shadow-sm hover:shadow-md transition-shadow">
                      <img src="/Equifax_Logo.svg.png" alt="Equifax" className="h-8 w-auto mx-auto mb-2" />
                      <div className="text-sm font-semibold text-green-700"></div>
                    </div>
                  </div>

                  {/* Account comparison rows */}
                  {groupedAccounts.map((accountGroup, index) => {
                    const accountKey = `${accountGroup.creditor}_${accountGroup.accountNumber}`;
                    const activeTab = getActiveTab(accountKey);
                    
                    return (
                    <div key={index} className="bg-gradient-to-r from-white via-gray-50/30 to-white dark:from-slate-800 dark:via-slate-800/30 dark:to-slate-800 border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
                      {/* Tabs for filtering fields */}
                      <div className="mb-4 border-b border-gray-200">
                        <div className="flex space-x-1">
                          {tabConfig.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTabForAccount(accountKey, tab.id)}
                              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                                activeTab === tab.id
                                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className={`grid grid-cols-1 ${activeTab === 'credit-repair' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
                        {/* Account Info Column */}
                        {activeTab !== 'credit-repair' && (
                        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-xl p-5 border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-300">
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm"></div>
                              <div className="font-bold text-lg text-foreground">{accountGroup.creditor}</div>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center justify-between bg-card rounded-lg p-2 border border-border">
                                <span className="text-muted-foreground font-medium flex items-center gap-2">
                                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  Account #:
                                </span>
                                <span className="font-semibold text-foreground text-xs">{accountGroup.accountNumber}</span>
                              </div>
                              <div className="flex items-center justify-between bg-card rounded-lg p-2 border border-border">
                                <span className="text-muted-foreground font-medium flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2m0 0V9a2 2 0 012-2h14a2 2 0 012 2v2M7 7V3a4 4 0 018 0v4M9 7h6" />
                                  </svg>
                                  Type:
                                </span>
                                <span className="font-semibold text-foreground">{accountGroup.type}</span>
                              </div>
                              {/* Get additional details from first available bureau */}
                              {(() => {
                                const firstBureau = Object.values(accountGroup.bureaus)[0];
                                return firstBureau ? (
                                  <>
                                    <div className="flex items-center justify-between bg-card rounded-lg p-2 border border-border">
                                      <span className="text-muted-foreground font-medium flex items-center gap-2">
                                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Designator:
                                      </span>
                                      <span className="font-semibold text-foreground">{firstBureau.designator || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-card rounded-lg p-2 border border-border">
                                      <span className="text-muted-foreground font-medium flex items-center gap-2">
                                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Opened:
                                      </span>
                                      <span className="font-semibold text-foreground">{firstBureau.opened ? new Date(firstBureau.opened).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-card rounded-lg p-2 border border-border">
                                      <span className="text-muted-foreground font-medium flex items-center gap-2">
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                        Industry:
                                      </span>
                                      <span className="font-semibold text-foreground">{firstBureau.industry || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-card rounded-lg p-2 border border-border">
                                      <span className="text-muted-foreground font-medium flex items-center gap-2">
                                        <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                                        </svg>
                                        Remark:
                                      </span>
                                      <span className="font-semibold text-foreground text-xs truncate max-w-[120px]" title={firstBureau.remark || 'N/A'}>{firstBureau.remark || 'N/A'}</span>
                                    </div>
                                  </>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </div>
                        )}

                        {/* Experian Column */}
                        <div className="text-left bg-card rounded-lg p-4 border border-border">
                          {accountGroup.bureaus.Experian ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={accountGroup.bureaus.Experian.status === 'Open' ? 'default' : 'secondary'}
                                  className={`text-xs font-medium px-3 py-1 ${
                                    accountGroup.bureaus.Experian.status === 'Open' 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {accountGroup.bureaus.Experian.status}
                                </Badge>
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                                  <img src="/Experian_logo.svg.png" alt="Experian" className="h-4 w-auto" />
                                  
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 dark:from-slate-800 dark:to-slate-700">
                                  <div className="font-bold text-xl text-foreground">${parseInt(accountGroup.bureaus.Experian.balance).toLocaleString()}</div>
                                  <div className="text-muted-foreground text-sm">of ${parseInt(accountGroup.bureaus.Experian.limit).toLocaleString()}</div>
                                  {accountGroup.type && (accountGroup.type.toLowerCase().includes('installment') || accountGroup.type.toLowerCase().includes('loan')) ? (
                                    <div className="space-y-1 mt-1">
                                      <div className={`font-bold text-sm ${getUtilizationColor(accountGroup.bureaus.Experian.utilization)}`}>
                                        {accountGroup.bureaus.Experian.utilization}% Paid
                                      </div>
                                      <div className={`font-bold text-sm ${getUtilizationColor(100 - accountGroup.bureaus.Experian.utilization)}`}>
                                        {100 - accountGroup.bureaus.Experian.utilization}% Remaining
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={`font-bold text-lg mt-1 ${getUtilizationColor(accountGroup.bureaus.Experian.utilization)}`}>
                                      {accountGroup.bureaus.Experian.utilization}% utilization
                                    </div>
                                  )}
                                  {/* Removed top summary chips for Experian in credit-repair view */}
                                  {/* Removed duplicate summary chips block */}
                                  {/* Removed third summary chips block */}
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                  {shouldShowField('paymentHistory', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Payment:
                                      </span>
                                      <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.paymentHistory}</span>
                                    </div>
                                  )}
                                  {shouldShowField('reported', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Reported:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.reported);
                                          const v2 = normalize(b.TransUnion?.reported);
                                          const v3 = normalize(b.Equifax?.reported);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.reported ? new Date(accountGroup.bureaus.Experian.reported).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('opened', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Opened:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.opened);
                                          const v2 = normalize(b.TransUnion?.opened);
                                          const v3 = normalize(b.Equifax?.opened);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.opened ? new Date(accountGroup.bureaus.Experian.opened).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('dateAccountStatus', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" />
                                        </svg>
                                        Status Date:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.dateAccountStatus);
                                          const v2 = normalize(b.TransUnion?.dateAccountStatus);
                                          const v3 = normalize(b.Equifax?.dateAccountStatus);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.dateAccountStatus ? new Date(accountGroup.bureaus.Experian.dateAccountStatus).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('creditorName', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Building2 className="w-3 h-3 text-gray-400" /> Creditor:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.creditorName || b.Experian?.CreditorName || b.Experian?.creditor);
                                          const v2 = normalize(b.TransUnion?.creditorName || b.TransUnion?.CreditorName || b.TransUnion?.creditor);
                                          const v3 = normalize(b.Equifax?.creditorName || b.Equifax?.CreditorName || b.Equifax?.creditor);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.creditorName || accountGroup.bureaus.Experian.CreditorName || accountGroup.bureaus.Experian.creditor || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountNumber', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        Account #:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.accountNumber);
                                          const v2 = normalize(b.TransUnion?.accountNumber);
                                          const v3 = normalize(b.Equifax?.accountNumber);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.accountNumber || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('designator', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        Designator:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.designator);
                                          const v2 = normalize(b.TransUnion?.designator);
                                          const v3 = normalize(b.Equifax?.designator);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.designator}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountTypeDescription', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><ScrollText className="w-3 h-3 text-gray-400" /> Type (Desc):</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.accountTypeDescription);
                                          const v2 = normalize(b.TransUnion?.accountTypeDescription);
                                          const v3 = normalize(b.Equifax?.accountTypeDescription);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.accountTypeDescription || accountGroup.type}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountType', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-gray-400" /> Account Type:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.accountType);
                                          const v2 = normalize(b.TransUnion?.accountType);
                                          const v3 = normalize(b.Equifax?.accountType);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.accountType || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('creditType', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Wallet className="w-3 h-3 text-gray-400" /> Credit Type:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.creditType);
                                          const v2 = normalize(b.TransUnion?.creditType);
                                          const v3 = normalize(b.Equifax?.creditType);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.creditType || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('paymentFrequency', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> Payment Frequency:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.paymentFrequency);
                                          const v2 = normalize(b.TransUnion?.paymentFrequency);
                                          const v3 = normalize(b.Equifax?.paymentFrequency);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.paymentFrequency || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountCondition', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Gauge className="w-3 h-3 text-gray-400" /> Condition:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.accountCondition);
                                          const v2 = normalize(b.TransUnion?.accountCondition);
                                          const v3 = normalize(b.Equifax?.accountCondition);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.accountCondition || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('disputeFlag', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3 text-gray-400" /> Dispute:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.disputeFlag);
                                          const v2 = normalize(b.TransUnion?.disputeFlag);
                                          const v3 = normalize(b.Equifax?.disputeFlag);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.disputeFlag || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('industry', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Briefcase className="w-3 h-3 text-gray-400" /> Industry:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.industry);
                                          const v2 = normalize(b.TransUnion?.industry);
                                          const v3 = normalize(b.Equifax?.industry);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.industry || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('termType', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">Term Type:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.termType);
                                          const v2 = normalize(b.TransUnion?.termType);
                                          const v3 = normalize(b.Equifax?.termType);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">{accountGroup.bureaus.Experian.termType || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('pastDue', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        Past Due:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.pastDue);
                                          const v2 = normalize(b.TransUnion?.pastDue);
                                          const v3 = normalize(b.Equifax?.pastDue);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className={`font-semibold ${parseInt(accountGroup.bureaus.Experian.pastDue || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                          ${parseInt(accountGroup.bureaus.Experian.pastDue || 0).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('highBalance', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        High Balance:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.highBalance);
                                          const v2 = normalize(b.TransUnion?.highBalance);
                                          const v3 = normalize(b.Equifax?.highBalance);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700 dark:text-foreground">${parseInt(accountGroup.bureaus.Experian.highBalance || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('worstStatus', activeTab) && (
                                    <div className="flex justify-between items-center py-1">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Worst Status:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Experian?.worstStatus);
                                          const v2 = normalize(b.TransUnion?.worstStatus);
                                          const v3 = normalize(b.Equifax?.worstStatus);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Experian.worstStatus}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {shouldShowField('payStatusHistory', activeTab) && accountGroup.bureaus.Experian.payStatusHistory && accountGroup.bureaus.Experian.payStatusHistory !== 'N/A' && (
                                  <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="font-semibold text-xs text-gray-700 dark:text-foreground mb-2 flex items-center justify-between">
                                      <span>Payment History:</span>
                                      {activeTab === 'credit-repair' && (() => {
                                        const b = accountGroup.bureaus;
                                        const normalize = (val: any) => {
                                          if (val === undefined || val === null) return null;
                                          const s = String(val).trim();
                                          if (!s || s.toLowerCase() === 'n/a') return null;
                                          const n = Number(s);
                                          if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                          const d = new Date(s);
                                          if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                          return s.toLowerCase();
                                        };
                                        const v1 = normalize(b.Experian?.payStatusHistory);
                                        const v2 = normalize(b.TransUnion?.payStatusHistory);
                                        const v3 = normalize(b.Equifax?.payStatusHistory);
                                        const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                        const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                        return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                      })()}
                                    </div>
                                    <div className="text-xs font-mono bg-card p-2 rounded border border-border overflow-x-auto">
                                      {accountGroup.bureaus.Experian.payStatusHistory}
                                    </div>
                                    {accountGroup.bureaus.Experian.payStatusHistoryStartDate && accountGroup.bureaus.Experian.payStatusHistoryStartDate !== 'N/A' && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        From: {new Date(accountGroup.bureaus.Experian.payStatusHistoryStartDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-32 bg-red-50 rounded-lg border border-red-200">
                              <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-300">
                                Not reported
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* TransUnion Column */}
                        <div className="text-left bg-card rounded-lg p-4 border border-border">
                          {accountGroup.bureaus.TransUnion ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={accountGroup.bureaus.TransUnion.status === 'Open' ? 'default' : 'secondary'}
                                  className={`text-xs font-medium px-3 py-1 ${
                                    accountGroup.bureaus.TransUnion.status === 'Open' 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {accountGroup.bureaus.TransUnion.status}
                                </Badge>
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                                  <img src="/TransUnion_logo.svg.png" alt="TransUnion" className="h-4 w-auto" />
                                  
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                                  <div className="font-bold text-xl text-foreground">${parseInt(accountGroup.bureaus.TransUnion.balance).toLocaleString()}</div>
                                  <div className="text-muted-foreground text-sm">of ${parseInt(accountGroup.bureaus.TransUnion.limit).toLocaleString()}</div>
                                  {accountGroup.type && (accountGroup.type.toLowerCase().includes('installment') || accountGroup.type.toLowerCase().includes('loan')) ? (
                                    <div className="space-y-1 mt-1">
                                      <div className={`font-bold text-sm ${getUtilizationColor(accountGroup.bureaus.TransUnion.utilization)}`}>
                                        {accountGroup.bureaus.TransUnion.utilization}% Paid
                                      </div>
                                      <div className={`font-bold text-sm ${getUtilizationColor(100 - accountGroup.bureaus.TransUnion.utilization)}`}>
                                        {100 - accountGroup.bureaus.TransUnion.utilization}% Remaining
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={`font-bold text-lg mt-1 ${getUtilizationColor(accountGroup.bureaus.TransUnion.utilization)}`}>
                                      {accountGroup.bureaus.TransUnion.utilization}% utilization
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                  {shouldShowField('paymentHistory', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Payment:
                                      </span>
                                      <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.paymentHistory}</span>
                                    </div>
                                  )}
                                  {shouldShowField('reported', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Reported:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.reported);
                                          const v2 = normalize(b.Experian?.reported);
                                          const v3 = normalize(b.Equifax?.reported);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.reported ? new Date(accountGroup.bureaus.TransUnion.reported).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('opened', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Opened:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.opened);
                                          const v2 = normalize(b.Experian?.opened);
                                          const v3 = normalize(b.Equifax?.opened);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.opened ? new Date(accountGroup.bureaus.TransUnion.opened).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('dateAccountStatus', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" />
                                        </svg>
                                        Status Date:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.dateAccountStatus);
                                          const v2 = normalize(b.Experian?.dateAccountStatus);
                                          const v3 = normalize(b.Equifax?.dateAccountStatus);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.dateAccountStatus ? new Date(accountGroup.bureaus.TransUnion.dateAccountStatus).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('creditorName', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Building2 className="w-3 h-3 text-gray-400" /> Creditor:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.creditorName || b.TransUnion?.CreditorName || b.TransUnion?.creditor);
                                          const v2 = normalize(b.Experian?.creditorName || b.Experian?.CreditorName || b.Experian?.creditor);
                                          const v3 = normalize(b.Equifax?.creditorName || b.Equifax?.CreditorName || b.Equifax?.creditor);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.creditorName || accountGroup.bureaus.TransUnion.CreditorName || accountGroup.bureaus.TransUnion.creditor || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountNumber', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        Account #:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.accountNumber);
                                          const v2 = normalize(b.Experian?.accountNumber);
                                          const v3 = normalize(b.Equifax?.accountNumber);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.accountNumber || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('designator', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        Designator:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.designator);
                                          const v2 = normalize(b.Experian?.designator);
                                          const v3 = normalize(b.Equifax?.designator);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.designator}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountTypeDescription', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><ScrollText className="w-3 h-3 text-gray-400" /> Type (Desc):</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.accountTypeDescription);
                                          const v2 = normalize(b.Experian?.accountTypeDescription);
                                          const v3 = normalize(b.Equifax?.accountTypeDescription);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.accountTypeDescription || accountGroup.type}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountType', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-gray-400" /> Account Type:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.accountType);
                                          const v2 = normalize(b.Experian?.accountType);
                                          const v3 = normalize(b.Equifax?.accountType);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.accountType || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('creditType', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Wallet className="w-3 h-3 text-gray-400" /> Credit Type:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.creditType);
                                          const v2 = normalize(b.Experian?.creditType);
                                          const v3 = normalize(b.Equifax?.creditType);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.creditType || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('paymentFrequency', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> Payment Frequency:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.paymentFrequency);
                                          const v2 = normalize(b.Experian?.paymentFrequency);
                                          const v3 = normalize(b.Equifax?.paymentFrequency);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.paymentFrequency || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountCondition', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Gauge className="w-3 h-3 text-gray-400" /> Condition:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.accountCondition);
                                          const v2 = normalize(b.Experian?.accountCondition);
                                          const v3 = normalize(b.Equifax?.accountCondition);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.accountCondition || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('disputeFlag', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3 text-gray-400" /> Dispute:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.disputeFlag);
                                          const v2 = normalize(b.Experian?.disputeFlag);
                                          const v3 = normalize(b.Equifax?.disputeFlag);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.disputeFlag || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('industry', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Briefcase className="w-3 h-3 text-gray-400" /> Industry:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.industry);
                                          const v2 = normalize(b.Experian?.industry);
                                          const v3 = normalize(b.Equifax?.industry);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.industry || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('termType', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">Term Type:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.termType);
                                          const v2 = normalize(b.Experian?.termType);
                                          const v3 = normalize(b.Equifax?.termType);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.termType || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('pastDue', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        Past Due:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.pastDue);
                                          const v2 = normalize(b.Experian?.pastDue);
                                          const v3 = normalize(b.Equifax?.pastDue);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className={`font-semibold ${parseInt(accountGroup.bureaus.TransUnion.pastDue || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                          ${parseInt(accountGroup.bureaus.TransUnion.pastDue || 0).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('highBalance', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        High Balance:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.highBalance);
                                          const v2 = normalize(b.Experian?.highBalance);
                                          const v3 = normalize(b.Equifax?.highBalance);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">${parseInt(accountGroup.bureaus.TransUnion.highBalance || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('worstStatus', activeTab) && (
                                    <div className="flex justify-between items-center py-1">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Worst Status:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.TransUnion?.worstStatus);
                                          const v2 = normalize(b.Experian?.worstStatus);
                                          const v3 = normalize(b.Equifax?.worstStatus);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.TransUnion.worstStatus}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {shouldShowField('payStatusHistory', activeTab) && accountGroup.bureaus.TransUnion.payStatusHistory && accountGroup.bureaus.TransUnion.payStatusHistory !== 'N/A' && (
                                  <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="font-semibold text-xs text-gray-700 mb-2 flex items-center justify-between">
                                      <span>Payment History:</span>
                                      {activeTab === 'credit-repair' && (() => {
                                        const b = accountGroup.bureaus;
                                        const normalize = (val: any) => {
                                          if (val === undefined || val === null) return null;
                                          const s = String(val).trim();
                                          if (!s || s.toLowerCase() === 'n/a') return null;
                                          const n = Number(s);
                                          if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                          const d = new Date(s);
                                          if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                          return s.toLowerCase();
                                        };
                                        const v1 = normalize(b.TransUnion?.payStatusHistory);
                                        const v2 = normalize(b.Experian?.payStatusHistory);
                                        const v3 = normalize(b.Equifax?.payStatusHistory);
                                        const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                        const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                        return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                      })()}
                                    </div>
                                    <div className="text-xs font-mono bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                      {accountGroup.bureaus.TransUnion.payStatusHistory}
                                    </div>
                                    {accountGroup.bureaus.TransUnion.payStatusHistoryStartDate && accountGroup.bureaus.TransUnion.payStatusHistoryStartDate !== 'N/A' && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        From: {new Date(accountGroup.bureaus.TransUnion.payStatusHistoryStartDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-32 bg-red-50 rounded-lg border border-red-200">
                              <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-300">
                                Not reported
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Equifax Column */}
                        <div className="text-left bg-card rounded-lg p-4 border border-border">
                          {accountGroup.bureaus.Equifax ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={accountGroup.bureaus.Equifax.status === 'Open' ? 'default' : 'secondary'}
                                  className={`text-xs font-medium px-3 py-1 ${
                                    accountGroup.bureaus.Equifax.status === 'Open' 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {accountGroup.bureaus.Equifax.status}
                                </Badge>
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                                  <img src="/Equifax_Logo.svg.png" alt="Equifax" className="h-4 w-auto" />
                                  
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                                  <div className="font-bold text-xl text-foreground">${parseInt(accountGroup.bureaus.Equifax.balance).toLocaleString()}</div>
                                  <div className="text-muted-foreground text-sm">of ${parseInt(accountGroup.bureaus.Equifax.limit).toLocaleString()}</div>
                                  {accountGroup.type && (accountGroup.type.toLowerCase().includes('installment') || accountGroup.type.toLowerCase().includes('loan')) ? (
                                    <div className="space-y-1 mt-1">
                                      <div className={`font-bold text-sm ${getUtilizationColor(accountGroup.bureaus.Equifax.utilization)}`}>
                                        {accountGroup.bureaus.Equifax.utilization}% Paid
                                      </div>
                                      <div className={`font-bold text-sm ${getUtilizationColor(100 - accountGroup.bureaus.Equifax.utilization)}`}>
                                        {100 - accountGroup.bureaus.Equifax.utilization}% Remaining
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={`font-bold text-lg mt-1 ${getUtilizationColor(accountGroup.bureaus.Equifax.utilization)}`}>
                                      {accountGroup.bureaus.Equifax.utilization}% utilization
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                  {shouldShowField('paymentHistory', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Payment:
                                      </span>
                                      <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.paymentHistory}</span>
                                    </div>
                                  )}
                                  {shouldShowField('reported', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Reported:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.reported);
                                          const v2 = normalize(b.Experian?.reported);
                                          const v3 = normalize(b.TransUnion?.reported);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.reported ? new Date(accountGroup.bureaus.Equifax.reported).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('opened', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Opened:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.opened);
                                          const v2 = normalize(b.Experian?.opened);
                                          const v3 = normalize(b.TransUnion?.opened);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.opened ? new Date(accountGroup.bureaus.Equifax.opened).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('dateAccountStatus', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" />
                                        </svg>
                                        Status Date:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.dateAccountStatus);
                                          const v2 = normalize(b.Experian?.dateAccountStatus);
                                          const v3 = normalize(b.TransUnion?.dateAccountStatus);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.dateAccountStatus ? new Date(accountGroup.bureaus.Equifax.dateAccountStatus).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('creditorName', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Building2 className="w-3 h-3 text-gray-400" /> Creditor:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.creditorName || b.Equifax?.CreditorName || b.Equifax?.creditor);
                                          const v2 = normalize(b.Experian?.creditorName || b.Experian?.CreditorName || b.Experian?.creditor);
                                          const v3 = normalize(b.TransUnion?.creditorName || b.TransUnion?.CreditorName || b.TransUnion?.creditor);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.creditorName || accountGroup.bureaus.Equifax.CreditorName || accountGroup.bureaus.Equifax.creditor || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountNumber', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        Account #:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.accountNumber);
                                          const v2 = normalize(b.Experian?.accountNumber);
                                          const v3 = normalize(b.TransUnion?.accountNumber);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.accountNumber || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('designator', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        Designator:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.designator);
                                          const v2 = normalize(b.Experian?.designator);
                                          const v3 = normalize(b.TransUnion?.designator);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.designator}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountTypeDescription', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><ScrollText className="w-3 h-3 text-gray-400" /> Type (Desc):</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.accountTypeDescription);
                                          const v2 = normalize(b.Experian?.accountTypeDescription);
                                          const v3 = normalize(b.TransUnion?.accountTypeDescription);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.accountTypeDescription || accountGroup.type}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountType', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-gray-400" /> Account Type:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.accountType);
                                          const v2 = normalize(b.Experian?.accountType);
                                          const v3 = normalize(b.TransUnion?.accountType);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.accountType || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('creditType', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Wallet className="w-3 h-3 text-gray-400" /> Credit Type:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.creditType);
                                          const v2 = normalize(b.Experian?.creditType);
                                          const v3 = normalize(b.TransUnion?.creditType);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.creditType || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('paymentFrequency', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> Payment Frequency:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.paymentFrequency);
                                          const v2 = normalize(b.Experian?.paymentFrequency);
                                          const v3 = normalize(b.TransUnion?.paymentFrequency);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.paymentFrequency || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('accountCondition', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Gauge className="w-3 h-3 text-gray-400" /> Condition:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.accountCondition);
                                          const v2 = normalize(b.Experian?.accountCondition);
                                          const v3 = normalize(b.TransUnion?.accountCondition);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.accountCondition || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('disputeFlag', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3 text-gray-400" /> Dispute:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.disputeFlag);
                                          const v2 = normalize(b.Experian?.disputeFlag);
                                          const v3 = normalize(b.TransUnion?.disputeFlag);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.disputeFlag || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('industry', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1"><Briefcase className="w-3 h-3 text-gray-400" /> Industry:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.industry);
                                          const v2 = normalize(b.Experian?.industry);
                                          const v3 = normalize(b.TransUnion?.industry);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.industry || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('termType', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">Term Type:</span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.termType);
                                          const v2 = normalize(b.Experian?.termType);
                                          const v3 = normalize(b.TransUnion?.termType);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.termType || 'N/A'}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('pastDue', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        Past Due:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.pastDue);
                                          const v2 = normalize(b.Experian?.pastDue);
                                          const v3 = normalize(b.TransUnion?.pastDue);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className={`font-semibold ${parseInt(accountGroup.bureaus.Equifax.pastDue || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                          ${parseInt(accountGroup.bureaus.Equifax.pastDue || 0).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('highBalance', activeTab) && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        High Balance:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.highBalance);
                                          const v2 = normalize(b.Experian?.highBalance);
                                          const v3 = normalize(b.TransUnion?.highBalance);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">${parseInt(accountGroup.bureaus.Equifax.highBalance || 0).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  )}
                                  {shouldShowField('worstStatus', activeTab) && (
                                    <div className="flex justify-between items-center py-1">
                                      <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Worst Status:
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {activeTab === 'credit-repair' && (() => {
                                          const b = accountGroup.bureaus;
                                          const normalize = (val: any) => {
                                            if (val === undefined || val === null) return null;
                                            const s = String(val).trim();
                                            if (!s || s.toLowerCase() === 'n/a') return null;
                                            const n = Number(s);
                                            if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                            const d = new Date(s);
                                            if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                            return s.toLowerCase();
                                          };
                                          const v1 = normalize(b.Equifax?.worstStatus);
                                          const v2 = normalize(b.Experian?.worstStatus);
                                          const v3 = normalize(b.TransUnion?.worstStatus);
                                          const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                          const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                          return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                        })()}
                                        <span className="font-semibold text-gray-700">{accountGroup.bureaus.Equifax.worstStatus}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {shouldShowField('payStatusHistory', activeTab) && accountGroup.bureaus.Equifax.payStatusHistory && accountGroup.bureaus.Equifax.payStatusHistory !== 'N/A' && (
                                  <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="font-semibold text-xs text-gray-700 mb-2 flex items-center justify-between">
                                      <span>Payment History:</span>
                                      {activeTab === 'credit-repair' && (() => {
                                        const b = accountGroup.bureaus;
                                        const normalize = (val: any) => {
                                          if (val === undefined || val === null) return null;
                                          const s = String(val).trim();
                                          if (!s || s.toLowerCase() === 'n/a') return null;
                                          const n = Number(s);
                                          if (!Number.isNaN(n) && s.match(/^\d+(\.\d+)?$/)) return n;
                                          const d = new Date(s);
                                          if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                                          return s.toLowerCase();
                                        };
                                        const v1 = normalize(b.Equifax?.payStatusHistory);
                                        const v2 = normalize(b.Experian?.payStatusHistory);
                                        const v3 = normalize(b.TransUnion?.payStatusHistory);
                                        const m = v1 !== null && v2 !== null && v3 !== null && v1 === v2 && v2 === v3;
                                        const cls = m ? 'px-1.5 py-0.5 text-[10px] rounded bg-green-50 text-green-700 border border-green-200' : 'px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200';
                                        return <span className={cls}>{m ? 'Match' : 'Not match'}</span>;
                                      })()}
                                    </div>
                                    <div className="text-xs font-mono bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                      {accountGroup.bureaus.Equifax.payStatusHistory}
                                    </div>
                                    {accountGroup.bureaus.Equifax.payStatusHistoryStartDate && accountGroup.bureaus.Equifax.payStatusHistoryStartDate !== 'N/A' && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        From: {new Date(accountGroup.bureaus.Equifax.payStatusHistoryStartDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-32 bg-red-50 rounded-lg border border-red-200">
                              <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-300">
                                Not reported
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

    </ClientLayout>
  );
}

function Label({ children, className, ...props }: any) {
  return (
    <label className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}

{/* Custom CSS for enhanced animations */}
<style jsx>{`
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 1000px;
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
  }

  .animate-slideInRight {
    animation: slideInRight 0.5s ease-out forwards;
  }

  .animate-slideInLeft {
    animation: slideInLeft 0.5s ease-out forwards;
  }

  .animate-slideDown {
    animation: slideDown 0.6s ease-out forwards;
  }

  .animate-scaleIn {
    animation: scaleIn 0.4s ease-out forwards;
  }

  .animate-pulse-custom {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Smooth transitions for form elements */
  .form-transition {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Enhanced hover effects */
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  /* Step indicator animations */
  .step-indicator {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .step-indicator.active {
    transform: scale(1.05);
  }

  .step-indicator.completed {
    animation: scaleIn 0.3s ease-out;
  }
`}</style>
