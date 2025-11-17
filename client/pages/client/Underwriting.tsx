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
  const [activeTab, setActiveTab] = useState("underwriting");
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

          {/* Floating Underwriting Quick Nav */}
          <div className="fixed bottom-6 right-6 z-40">
            <Popover>
              <PopoverTrigger asChild>
                <Button className="rounded-full shadow-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-2 hover:from-indigo-500 hover:to-pink-500 transition-colors">
                  Underwriting Nav
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-80 p-3">
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => document.getElementById('uw-client-information')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <User className="h-4 w-4" /> Client Information
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => document.getElementById('uw-credit-scores')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <Gauge className="h-4 w-4" /> Credit Scores
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => document.getElementById('uw-do-you-qualify')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <BadgeCheck className="h-4 w-4" /> Do You Qualify
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => document.getElementById('uw-debt-utilization')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <Percent className="h-4 w-4" /> Debt Utilization
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => document.getElementById('uw-accounts-impeding')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <AlertTriangle className="h-4 w-4" /> Accounts impeding eligibility
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => document.getElementById('uw-inquiries-impeding')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <FileSearch className="h-4 w-4" /> Inquiries impeding eligibility
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => document.getElementById('uw-paydown')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    <ArrowDown className="h-4 w-4" /> Pay Down
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {/* Underwriting Section Navigation */}
          <div className="sticky top-4 z-30">
            <div className="mx-auto w-full max-w-5xl bg-white/90 backdrop-blur-md border shadow-lg rounded-full px-3 py-2">
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => document.getElementById('uw-client-information')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Client Information</Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('uw-credit-scores')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Credit Scores</Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('uw-do-you-qualify')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Do You Qualify</Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('uw-debt-utilization')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Debt Utilization</Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('uw-accounts-impeding')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Accounts impeding your eligibility</Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('uw-inquiries-impeding')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Inquiries impeding your eligibility</Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('uw-paydown')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Pay Down</Button>
              </div>
            </div>
          </div>
          {/* Client Information Header */}
          <Card id="uw-client-information" className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Client:</span>
                  <span className="ml-2">
                    {reportData?.personalInfo?.name?.FirstName && reportData?.personalInfo?.name?.LastName 
                      ? `${reportData.personalInfo.name.FirstName} ${reportData.personalInfo.name.LastName}`
                      : clientName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Date:</span>
                  <span className="ml-2">
                    {apiData?.reportData?.reportData?.CreditReport?.[0]?.DateReport || 
                     new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
              {reportData?.personalInfo?.dateOfBirth && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="font-semibold">Date of Birth:</span>
                    <span className="ml-2">{reportData.personalInfo.dateOfBirth}</span>
                  </div>
                  <div>
                    <span className="font-semibold">SSN:</span>
                    <span className="ml-2">{reportData?.personalInfo?.ssn || 'N/A'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Scores with Speedometers */}
          <Card id="uw-credit-scores" className="border-0 shadow-xl bg-gradient-to-br from-white via-gray-50 to-blue-50 scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Credit Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* TransUnion Speedometer */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-h-[320px]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-blue-800">TransUnion</CardTitle>
                      <div className="text-xs text-slate-600 font-medium">
                        {reportData?.bureauDates?.transunion || 'N/A'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center relative p-8">
                    {/* Speedometer with score inside */}
                    <div className="flex justify-center mb-6">
                      <div className="relative w-80 h-40">
                        <svg className="w-80 h-40" viewBox="0 0 320 170">
                          {/* Background arc */}
                          <path
                            d="M 40 130 A 100 100 0 0 1 280 130"
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="20"
                            strokeLinecap="round"
                          />
                          {/* Progress arc */}
                          <path
                            d="M 40 130 A 100 100 0 0 1 280 130"
                            fill="none"
                            stroke="url(#transunionRedToGreenGradient)"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={`${((reportData.scores.transunion - 300) / 550) * 377} 377`}
                            className="transition-all duration-1000 ease-out"
                          />
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="transunionRedToGreenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="20%" stopColor="#f97316" />
                              <stop offset="40%" stopColor="#eab308" />
                              <stop offset="60%" stopColor="#84cc16" />
                              <stop offset="80%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          {/* Score markers */}
                          <circle cx="40" cy="130" r="6" fill="#94a3b8" />
                          <circle cx="160" cy="50" r="6" fill="#94a3b8" />
                          <circle cx="280" cy="130" r="6" fill="#94a3b8" />
                          {/* Score number in center */}
                          <text x="160" y="120" textAnchor="middle" className="fill-slate-700 text-6xl font-bold">
                            {reportData.scores.transunion}
                          </text>
                        </svg>
                        {/* Score labels */}
                        <div className="absolute -bottom-2 left-0 text-base text-red-500 font-medium">300</div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-base text-yellow-500 font-medium"></div>
                        <div className="absolute -bottom-2 right-0 text-base text-green-500 font-medium">850</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 font-medium mb-4">
                      {reportData?.scoreTypes?.transunion || 'Credit Score'}
                    </div>
                    <div
                      className={`flex items-center justify-center mt-2 ${
                        getScoreChange(
                          reportData.scores.transunion,
                          reportData.previousScores.transunion,
                        ).color
                      }`}
                    >
                      <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                        {getScoreChange(
                          reportData.scores.transunion,
                          reportData.previousScores.transunion,
                        ).icon === ArrowUp ? (
                          <ArrowUp className="h-8 w-8 mr-2" />
                        ) : (
                          <ArrowDown className="h-8 w-8 mr-2" />
                        )}
                        <span className="text-[2rem] font-bold leading-none">
                          {getScoreChange(
                            reportData.scores.transunion,
                            reportData.previousScores.transunion,
                          ).isPositive
                            ? "+"
                            : ""}
                          {
                            getScoreChange(
                              reportData.scores.transunion,
                              reportData.previousScores.transunion,
                            ).value
                          }
                        </span>
                      </div>
                    </div>
                    {/* Logo in bottom right corner */}
                    <div className="absolute bottom-4 right-4">
                      <img 
                        src={reportData?.scoreTypes?.transunion === "VantageScore3" ? "/VantageScore.png" : "/FICO_Score_RGB_Blue.png"}
                        alt={reportData?.scoreTypes?.transunion === "VantageScore3" ? "VantageScore" : "FICO Score"}
                        className="h-6 w-auto opacity-60"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Experian Speedometer */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-h-[320px]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-green-800">Experian</CardTitle>
                      <div className="text-xs text-slate-600 font-medium">
                        {reportData?.bureauDates?.experian || 'N/A'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center relative p-8">
                    {/* Speedometer with score inside */}
                    <div className="flex justify-center mb-6">
                      <div className="relative w-80 h-40">
                        <svg className="w-80 h-40" viewBox="0 0 300 150">
                          {/* Background arc */}
                          <path
                            d="M 40 120 A 90 90 0 0 1 260 120"
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="20"
                            strokeLinecap="round"
                          />
                          {/* Progress arc */}
                          <path
                            d="M 40 120 A 90 90 0 0 1 260 120"
                            fill="none"
                            stroke="url(#experianRedToGreenGradient2)"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={`${((reportData.scores.experian - 300) / 550) * 346.4} 346.4`}
                            className="transition-all duration-1000 ease-out"
                          />
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="experianRedToGreenGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="20%" stopColor="#f97316" />
                              <stop offset="40%" stopColor="#eab308" />
                              <stop offset="60%" stopColor="#84cc16" />
                              <stop offset="80%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          {/* Score markers */}
                          <circle cx="40" cy="120" r="6" fill="#94a3b8" />
                          <circle cx="150" cy="40" r="6" fill="#94a3b8" />
                          <circle cx="260" cy="120" r="6" fill="#94a3b8" />
                          {/* Score number in center */}
                          <text x="150" y="110" textAnchor="middle" className="fill-slate-700 text-6xl font-bold">
                            {reportData.scores.experian}
                          </text>
                        </svg>
                        {/* Score labels */}
                        <div className="absolute -bottom-2 left-0 text-base text-red-500 font-medium">300</div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-base text-yellow-500 font-medium"></div>
                        <div className="absolute -bottom-2 right-0 text-base text-green-500 font-medium">850</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 font-medium mb-4">
                      {reportData?.scoreTypes?.experian || 'Credit Score'}
                    </div>
                    <div
                      className={`flex items-center justify-center mt-2 ${
                        getScoreChange(
                          reportData.scores.experian,
                          reportData.previousScores.experian,
                        ).color
                      }`}
                    >
                      <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                        {getScoreChange(
                          reportData.scores.experian,
                          reportData.previousScores.experian,
                        ).icon === ArrowUp ? (
                          <ArrowUp className="h-8 w-8 mr-2" />
                        ) : (
                          <ArrowDown className="h-8 w-8 mr-2" />
                        )}
                        <span className="text-[2rem] font-bold leading-none">
                          {getScoreChange(
                            reportData.scores.experian,
                            reportData.previousScores.experian,
                          ).isPositive
                            ? "+"
                            : ""}
                          {
                            getScoreChange(
                              reportData.scores.experian,
                              reportData.previousScores.experian,
                            ).value
                          }
                        </span>
                      </div>
                    </div>
                    {/* Logo in bottom right corner */}
                    <div className="absolute bottom-4 right-4">
                      <img 
                        src={reportData?.scoreTypes?.experian === "VantageScore3" ? "/VantageScore.png" : "/FICO_Score_RGB_Blue.png"}
                        alt={reportData?.scoreTypes?.experian === "VantageScore3" ? "VantageScore" : "FICO Score"}
                        className="h-6 w-auto opacity-60"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Equifax Speedometer */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-h-[320px]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-purple-800">Equifax</CardTitle>
                      <div className="text-xs text-slate-600 font-medium">
                        {reportData?.bureauDates?.equifax || 'N/A'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center relative p-8">
                    {/* Speedometer with score inside */}
                    <div className="flex justify-center mb-6">
                      <div className="relative w-80 h-40">
                        <svg className="w-80 h-40" viewBox="0 0 320 170">
                          {/* Background arc */}
                          <path
                            d="M 40 130 A 100 100 0 0 1 280 130"
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="20"
                            strokeLinecap="round"
                          />
                          {/* Progress arc */}
                          <path
                            d="M 40 130 A 100 100 0 0 1 280 130"
                            fill="none"
                            stroke="url(#equifaxRedToGreenGradient)"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={`${((reportData.scores.equifax - 300) / 550) * 377} 377`}
                            className="transition-all duration-1000 ease-out"
                          />
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient id="equifaxRedToGreenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="20%" stopColor="#f97316" />
                              <stop offset="40%" stopColor="#eab308" />
                              <stop offset="60%" stopColor="#84cc16" />
                              <stop offset="80%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          {/* Score markers */}
                          <circle cx="40" cy="130" r="6" fill="#94a3b8" />
                          <circle cx="160" cy="50" r="6" fill="#94a3b8" />
                          <circle cx="280" cy="130" r="6" fill="#94a3b8" />
                          {/* Score number in center */}
                          <text x="160" y="120" textAnchor="middle" className="fill-slate-700 text-6xl font-bold">
                            {reportData.scores.equifax}
                          </text>
                        </svg>
                        {/* Score labels */}
                        <div className="absolute -bottom-2 left-0 text-base text-red-500 font-medium">300</div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-base text-yellow-500 font-medium"></div>
                        <div className="absolute -bottom-2 right-0 text-base text-green-500 font-medium">850</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 font-medium mb-4">
                      {reportData?.scoreTypes?.equifax || 'Credit Score'}
                    </div>
                    <div
                      className={`flex items-center justify-center mt-2 ${
                        getScoreChange(
                          reportData.scores.equifax,
                          reportData.previousScores.equifax,
                        ).color
                      }`}
                    >
                      <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                        {getScoreChange(
                          reportData.scores.equifax,
                          reportData.previousScores.equifax,
                        ).icon === ArrowUp ? (
                          <ArrowUp className="h-8 w-8 mr-2" />
                        ) : (
                          <ArrowDown className="h-8 w-8 mr-2" />
                        )}
                        <span className="text-[2rem] font-bold leading-none">
                          {getScoreChange(
                            reportData.scores.equifax,
                            reportData.previousScores.equifax,
                          ).isPositive
                            ? "+"
                            : ""}
                          {
                            getScoreChange(
                              reportData.scores.equifax,
                              reportData.previousScores.equifax,
                            ).value
                          }
                        </span>
                      </div>
                    </div>
                    {/* Logo in bottom right corner */}
                    <div className="absolute bottom-4 right-4">
                      <img 
                        src={reportData?.scoreTypes?.equifax === "VantageScore3" ? "/VantageScore.png" : "/FICO_Score_RGB_Blue.png"}
                        alt={reportData?.scoreTypes?.equifax === "VantageScore3" ? "VantageScore" : "FICO Score"}
                        className="h-6 w-auto opacity-60"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Qualify View Toggle */}
          <div className="flex justify-end items-center gap-2 mt-4 mb-2">
            <span className="text-xs text-gray-600">Qualification view:</span>
            <ToggleGroup
              type="single"
              value={qualifyView}
              onValueChange={(v) => v && setQualifyView(v as 'cards' | 'table')}
              className="bg-white border rounded-md shadow-sm"
            >
              <ToggleGroupItem value="table" className="px-3 py-1 text-sm">
                Basic
              </ToggleGroupItem>
              <ToggleGroupItem value="cards" className="px-3 py-1 text-sm">
                Forensic
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Debt Utilization - Full Width (Do You Qualify) */}
          <Card id="uw-do-you-qualify" className={`${qualifyView === 'table' ? 'hidden' : ''} border-0 shadow-xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 scroll-mt-24`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-2xl font-bold text-gray-800">Do You Qualify</CardTitle>
                  <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-3 py-1 rounded-full">
                  {(() => {
                    // Compute an overall 0–10 score by averaging category grades
                    const grades: number[] = [];

                    // Credit Score grade (highest score across bureaus)
                    try {
                      const tuScore = parseInt((reportData as any)?.scores?.transunion || "0");
                      const exScore = parseInt((reportData as any)?.scores?.experian || "0");
                      const eqScore = parseInt((reportData as any)?.scores?.equifax || "0");
                      const highestScore = Math.max(tuScore, exScore, eqScore);
                      let g = 0;
                      if (highestScore >= 800) g = 10;
                      else if (highestScore >= 790) g = 9;
                      else if (highestScore >= 780) g = 8;
                      else if (highestScore >= 770) g = 7;
                      else if (highestScore >= 760) g = 6;
                      else if (highestScore >= 750) g = 5;
                      else if (highestScore >= 740) g = 4;
                      else if (highestScore >= 730) g = 3;
                      else if (highestScore >= 720) g = 2;
                      else if (highestScore >= 700) g = 1;
                      else g = 0;
                      grades.push(g);
                    } catch {}

                    // Credit Usage grade (lowest utilization across bureaus)
                    try {
                      const debtData = typeof (getDebtUtilizationData as any) === "function" ? (getDebtUtilizationData as any)() : {};
                      const tuUtil = debtData?.[1]?.openRevolvingUtilization;
                      const exUtil = debtData?.[3]?.openRevolvingUtilization;
                      const eqUtil = debtData?.[2]?.openRevolvingUtilization;
                      const utilVals = [tuUtil, exUtil, eqUtil].filter((v) => v !== null && v !== undefined);
                      if (utilVals.length) {
                        const lowest = Math.min(...utilVals);
                        let g = 0;
                        if (lowest <= 0) g = 10;
                        else if (lowest <= 5) g = 9;
                        else if (lowest <= 10) g = 8;
                        else if (lowest <= 15) g = 7;
                        else if (lowest <= 20) g = 6;
                        else if (lowest <= 25) g = 5;
                        else if (lowest <= 30) g = 4;
                        else if (lowest <= 40) g = 3;
                        else if (lowest <= 50) g = 2;
                        else if (lowest <= 70) g = 1;
                        else g = 0;
                        grades.push(g);
                      }
                    } catch {}

                    // Open Accounts grade (highest number of open/current accounts)
                    try {
                      const getOpenCount = (id: number) => {
                        const accounts = (apiData as any)?.Accounts || [];
                        return accounts.filter(
                          (a: any) =>
                            Number(a?.BureauId) === Number(id) &&
                            ["open", "current", "Open", "Current"].includes(String(a?.AccountStatus))
                        ).length;
                      };
                      const highest = Math.max(getOpenCount(1), getOpenCount(2), getOpenCount(3));
                      let g = 0;
                      if (highest >= 15) g = 10;
                      else if (highest >= 13) g = 9;
                      else if (highest >= 12) g = 8;
                      else if (highest >= 11) g = 7;
                      else if (highest >= 10) g = 6;
                      else if (highest >= 9) g = 5;
                      else if (highest >= 8) g = 4;
                      else if (highest >= 7) g = 3;
                      else if (highest >= 6) g = 2;
                      else if (highest >= 5) g = 1;
                      else g = 0;
                      grades.push(g);
                    } catch {}

                    // High-Limit Accounts grade (highest count of open accounts >= $5k limit)
                    try {
                      const getHL = (id: number) => {
                        const accounts = (apiData as any)?.Accounts || [];
                        return accounts.filter(
                          (a: any) =>
                            Number(a?.BureauId) === Number(id) &&
                            String(a?.AccountStatus) === "Open" &&
                            parseFloat(a?.CreditLimit) >= 5000
                        ).length;
                      };
                      const highest = Math.max(getHL(1), getHL(2), getHL(3));
                      let g = 0;
                      if (highest >= 10) g = 10;
                      else if (highest >= 8) g = 9;
                      else if (highest >= 7) g = 8;
                      else if (highest >= 6) g = 7;
                      else if (highest >= 5) g = 6;
                      else if (highest >= 4) g = 5;
                      else if (highest >= 3) g = 4;
                      else if (highest >= 2) g = 3;
                      else if (highest >= 1) g = 2;
                      else g = 0;
                      grades.push(g);
                    } catch {}

                    // New Accounts grade (lowest number opened within last two years)
                    try {
                      const getNewCount = (id: number) => {
                        const accounts = (apiData as any)?.Accounts || [];
                        const currentDate = new Date();
                        const twoYearsAgo = new Date(
                          currentDate.getFullYear() - 2,
                          currentDate.getMonth(),
                          currentDate.getDate()
                        );
                        return accounts.filter(
                          (a: any) =>
                            Number(a?.BureauId) === Number(id) &&
                            a?.DateOpened &&
                            new Date(a?.DateOpened) >= twoYearsAgo
                        ).length;
                      };
                      const lowest = Math.min(getNewCount(1), getNewCount(2), getNewCount(3));
                      let g = 1; // fallback matches prior card logic when unexpected values
                      if (lowest === 0) g = 10;
                      else if (lowest === 1) g = 8;
                      else if (lowest === 2) g = 6;
                      else if (lowest === 3) g = 4;
                      else if (lowest === 4) g = 2;
                      else if (lowest >= 5) g = 0;
                      grades.push(g);
                    } catch {}

                    // Over 50% Usage grade (lowest count of accounts above 50% utilization)
                    try {
                      const highUsageCount = (id: number) => {
                        const accounts = (apiData as any)?.Accounts || [];
                        return accounts.filter((a: any) => {
                          if (Number(a?.BureauId) !== Number(id)) return false;
                          if (!["open", "current", "Open", "Current"].includes(String(a?.AccountStatus))) return false;
                          const bal = parseFloat(a?.Balance) || 0;
                          const lim = parseFloat(a?.CreditLimit) || 0;
                          return lim > 0 && (bal / lim) * 100 > 50;
                        }).length;
                      };
                      const lowest = Math.min(highUsageCount(1), highUsageCount(3), highUsageCount(2));
                      let g = 0;
                      if (lowest === 0) g = 10;
                      else if (lowest === 1) g = 8;
                      else if (lowest === 2) g = 6;
                      else if (lowest === 3) g = 4;
                      else if (lowest === 4) g = 2;
                      else g = 0;
                      grades.push(g);
                    } catch {}

                    // Installment Accounts grade (highest count across bureaus)
                    try {
                      const instCount = (id: number) => {
                        const accounts = (apiData as any)?.Accounts || [];
                        return accounts.filter((a: any) => {
                          if (Number(a?.BureauId) !== Number(id)) return false;
                          if (!["open", "current", "Open", "Current"].includes(String(a?.AccountStatus))) return false;
                          const type = String(a?.AccountType || "").toLowerCase();
                          const isInstallment =
                            type.includes("installment") ||
                            type.includes("auto") ||
                            type.includes("mortgage") ||
                            type.includes("student") ||
                            !a?.CreditLimit;
                          return isInstallment;
                        }).length;
                      };
                      const highest = Math.max(instCount(1), instCount(3), instCount(2));
                      let g = 0;
                      if (highest >= 2) g = 10;
                      else if (highest >= 1) g = 6;
                      else g = 0;
                      grades.push(g);
                    } catch {}

                    // Age grade (highest average age in years across bureaus)
                    try {
                      const avgAgeYears = (id: number) => {
                        const accounts = (apiData as any)?.Accounts || [];
                        const accs = accounts.filter((a: any) => Number(a?.BureauId) === Number(id) && a?.DateOpened);
                        if (!accs.length) return 0;
                        const now = new Date();
                        const totalMonths = accs.reduce((sum: number, a: any) => {
                          const d = new Date(a?.DateOpened);
                          const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
                          return sum + Math.max(0, months);
                        }, 0);
                        return Math.floor(totalMonths / accs.length / 12);
                      };
                      const highest = Math.max(avgAgeYears(1), avgAgeYears(3), avgAgeYears(2));
                      let g = 0;
                      if (highest >= 12) g = 10;
                      else if (highest >= 10) g = 9;
                      else if (highest >= 8) g = 8;
                      else if (highest >= 6) g = 7;
                      else if (highest >= 5) g = 6;
                      else if (highest >= 4) g = 5;
                      else if (highest >= 3) g = 4;
                      else if (highest >= 2) g = 3;
                      else if (highest >= 1) g = 2;
                      else g = 0;
                      grades.push(g);
                    } catch {}

                    // Inquiries grade (lowest count across bureaus, all-time)
                    try {
                      const list = (apiData as any)?.reportData?.reportData?.Inquiries ?? (apiData as any)?.Inquiries ?? [];
                      const countFor = (id: number) => list.filter((inq: any) => Number(inq?.BureauId) === Number(id)).length;
                      const lowest = Math.min(countFor(1), countFor(3), countFor(2));
                      let g = 0;
                      if (lowest === 0) g = 10;
                      else if (lowest === 1) g = 8;
                      else if (lowest === 2) g = 6;
                      else if (lowest === 3) g = 4;
                      else if (lowest === 4) g = 2;
                      else g = 0;
                      grades.push(g);
                    } catch {}

                    // Bankruptcy grade (any bureau with bankruptcy -> 0 else 10)
                    try {
                      const pr = (apiData as any)?.PublicRecords ?? [];
                      const hasBk = (id: number) =>
                        pr.some(
                          (r: any) =>
                            Number(r?.BureauId) === Number(id) && /bankruptcy|chapter/i.test(String(r?.RecordType || ""))
                        );
                      const any = hasBk(1) || hasBk(3) || hasBk(2);
                      grades.push(any ? 0 : 10);
                    } catch {}

                    // Negative Marks grade (counts bureaus with negative marks)
                    try {
                      const accounts = (apiData as any)?.Accounts ?? [];
                      const records = (apiData as any)?.PublicRecords ?? [];
                      const hasNeg = (id: number) => {
                        const hasNegAccount = accounts.some((a: any) => {
                          if (Number(a?.BureauId) !== Number(id)) return false;
                          const status = String(a?.PaymentStatus || "").toLowerCase();
                          const pastDue = parseFloat(a?.PastDue) || 0;
                          return (
                            pastDue > 0 ||
                            /late|charge|collection|delinq|derog|past\s*due|in collections|charge off/i.test(status) ||
                            (status && !/current|paid/i.test(status))
                          );
                        });
                        const hasPR = records.some((r: any) => Number(r?.BureauId) === Number(id));
                        return hasNegAccount || hasPR;
                      };
                      const count = [hasNeg(1), hasNeg(3), hasNeg(2)].filter(Boolean).length;
                      let g = 0;
                      if (count === 0) g = 10;
                      else if (count === 1) g = 6;
                      else if (count === 2) g = 3;
                      else g = 0;
                      grades.push(g);
                    } catch {}

                    const avg = grades.length ? grades.reduce((s, n) => s + n, 0) / grades.length : 0;
                    const overall = Math.round(avg);
                    return `Overall ${overall}/10`;
                  })()}
              </span>
              </div>
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                  <CheckCircle className="h-3 w-3" /> Good to go
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  <AlertTriangle className="h-3 w-3" /> Proceed with caution
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                  <XCircle className="h-3 w-3" /> Not eligible
                </span>
              </div>
              <CardDescription className="mt-2">
                {(() => {
                  const criteriaFlags = {
                    score: [
                      getCriteriaFlag(1, "score700Plus") || getCriteriaFlag(1, "score730Plus"),
                      getCriteriaFlag(3, "score700Plus") || getCriteriaFlag(3, "score730Plus"),
                      getCriteriaFlag(2, "score700Plus") || getCriteriaFlag(2, "score730Plus"),
                    ],
                    openUtil: [
                      getCriteriaFlag(1, "openRevolvingUnder30"),
                      getCriteriaFlag(3, "openRevolvingUnder30"),
                      getCriteriaFlag(2, "openRevolvingUnder30"),
                    ],
                    allUtil: [
                      getCriteriaFlag(1, "allRevolvingUnder30"),
                      getCriteriaFlag(3, "allRevolvingUnder30"),
                      getCriteriaFlag(2, "allRevolvingUnder30"),
                    ],
                    openCount: [
                      getCriteriaFlag(1, "minFiveOpenRevolving"),
                      getCriteriaFlag(3, "minFiveOpenRevolving"),
                      getCriteriaFlag(2, "minFiveOpenRevolving"),
                    ],
                    unsecuredRecent: [
                      getCriteriaFlag(1, "maxFourUnsecuredIn12Months"),
                      getCriteriaFlag(3, "maxFourUnsecuredIn12Months"),
                      getCriteriaFlag(2, "maxFourUnsecuredIn12Months"),
                    ],
                    inquiries: [
                      getCriteriaFlag(1, "noInquiries"),
                      getCriteriaFlag(3, "noInquiries"),
                      getCriteriaFlag(2, "noInquiries"),
                    ],
                    bankruptcies: [
                      getCriteriaFlag(1, "noBankruptcies"),
                      getCriteriaFlag(3, "noBankruptcies"),
                      getCriteriaFlag(2, "noBankruptcies"),
                    ],
                    collections: [
                      getCriteriaFlag(1, "noCollections") || getCriteriaFlag(1, "noCollectionsLiensJudgements"),
                      getCriteriaFlag(3, "noCollections") || getCriteriaFlag(3, "noCollectionsLiensJudgements"),
                      getCriteriaFlag(2, "noCollections") || getCriteriaFlag(2, "noCollectionsLiensJudgements"),
                    ],
                    chargeOffs: [
                      getCriteriaFlag(1, "noChargeOffs"),
                      getCriteriaFlag(3, "noChargeOffs"),
                      getCriteriaFlag(2, "noChargeOffs"),
                    ],
                    latePays: [
                      getCriteriaFlag(1, "noLatePayments"),
                      getCriteriaFlag(3, "noLatePayments"),
                      getCriteriaFlag(2, "noLatePayments"),
                    ],
                  } as const;

                  const criteriaMetCount = Object.values(criteriaFlags).reduce((acc, flags) => acc + (flags.every(Boolean) ? 1 : 0), 0);
                  const criteriaTotal = Object.values(criteriaFlags).length;
                  const ratio = criteriaTotal > 0 ? criteriaMetCount / criteriaTotal : 0;
                  const status = isFundingEligible ? "green" : ratio >= 0.5 ? "yellow" : "red";
                  const label =
                    status === "green" ? "Good to go" :
                    status === "yellow" ? "Proceed with caution" : "Not eligible";
                  const Icon = status === "green" ? CheckCircle : status === "yellow" ? AlertTriangle : XCircle;
                  const colorClasses =
                    status === "green" ? "bg-green-100 text-green-700 border-green-200" :
                    status === "yellow" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-red-100 text-red-700 border-red-200";

                  return (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border ${colorClasses}`}>
                        <Icon className="h-4 w-4" />
                        <span>Your Status: {label}</span>
                      </span>
                      {!isFundingEligible && (
                        <span className="text-xs text-muted-foreground">
                          Meets {criteriaMetCount} of {criteriaTotal} core criteria
                        </span>
                      )}
                    </div>
                  );
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* First Row - 6 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                
                {/* Credit Score Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      Credit Score
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          // Get the highest score from the three bureaus
                          const tuScore = parseInt(reportData?.scores?.transunion || '0');
                          const exScore = parseInt(reportData?.scores?.experian || '0');
                          const eqScore = parseInt(reportData?.scores?.equifax || '0');
                          const highestScore = Math.max(tuScore, exScore, eqScore);
                          
                          // Calculate grade based on highest score
                          if (highestScore >= 800) return '10/10';
                          if (highestScore >= 790) return '9/10';
                          if (highestScore >= 780) return '8/10';
                          if (highestScore >= 770) return '7/10';
                          if (highestScore >= 760) return '6/10';
                          if (highestScore >= 750) return '5/10';
                          if (highestScore >= 740) return '4/10';
                          if (highestScore >= 730) return '3/10';
                          if (highestScore >= 720) return '2/10';
                          if (highestScore >= 700) return '1/10';
                          return '0/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.score700Plus || false,
                      reportData?.qualificationCriteria?.[3]?.score700Plus || false,
                      reportData?.qualificationCriteria?.[2]?.score700Plus || false
                    )}`}>
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const scales = [800, 790, 780, 770, 760, 750, 740, 730, 720, 710, 700];
                            
                            // Updated color logic: below 700 (red), 710-750 (yellow), 760-800 (green)
                            const getColorForScale = (scale) => {
                              if (scale >= 760) return 'green';  // 760-800: green
                              if (scale >= 710) return 'yellow'; // 710-750: yellow
                              return 'red';                      // below 700: red
                            };
                            
                            const colors = scales.map(scale => getColorForScale(scale));
                            
                            // Function to map score to nearest scale
                            const mapScoreToScale = (score) => {
                              if (!score) return null;
                              const numScore = parseInt(score);
                              // If score is below 700, don't map to any scale (will be shown in "Below 700" row)
                              if (numScore < 700) return null;
                              // Find the closest scale value (round down to nearest 10, then find in scales)
                              const roundedScore = Math.floor(numScore / 10) * 10;
                              return scales.find(scale => scale <= roundedScore) || null;
                            };
                            
                            // Get actual scores
                            const tuScore = reportData?.scores?.transunion;
                            const exScore = reportData?.scores?.experian;
                            const eqScore = reportData?.scores?.equifax;
                            
                            // Map scores to scales
                            const tuScale = mapScoreToScale(tuScore);
                            const exScale = mapScoreToScale(exScore);
                            const eqScale = mapScoreToScale(eqScore);
                            
                            const rows = scales.map((scale, index) => (
                              <tr key={scale} className={`border-b bg-${colors[index]}-50`}>
                                <td className={`py-1 px-1 text-${colors[index]}-600`}>{scale}</td>
                                <td className="text-center py-1 px-1 font-semibold text-blue-600">
                                  {tuScale === scale ? tuScore : ''}
                                </td>
                                <td className="text-center py-1 px-1 font-semibold text-green-600">
                                  {exScale === scale ? exScore : ''}
                                </td>
                                <td className="text-center py-1 px-1 font-semibold text-purple-600">
                                  {eqScale === scale ? eqScore : ''}
                                </td>
                              </tr>
                            ));
                            
                            // Add indicator row for scores below the lowest scale
                            const hasLowScores = (tuScore && parseInt(tuScore) < scales[scales.length - 1]) || 
                                               (exScore && parseInt(exScore) < scales[scales.length - 1]) || 
                                               (eqScore && parseInt(eqScore) < scales[scales.length - 1]);
                            
                            if (hasLowScores) {
                              rows.push(
                                <tr key="below-scale" className="border-b bg-red-50">
                                  <td className="py-1 px-1 text-red-600">Below {scales[scales.length - 1]}</td>
                                  <td className="text-center py-1 px-1 font-semibold text-blue-600">
                                    {tuScore && parseInt(tuScore) < scales[scales.length - 1] ? tuScore : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-semibold text-green-600">
                                    {exScore && parseInt(exScore) < scales[scales.length - 1] ? exScore : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-semibold text-purple-600">
                                    {eqScore && parseInt(eqScore) < scales[scales.length - 1] ? eqScore : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Credit Usage Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      Credit Usage
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          // Get the lowest utilization from the three bureaus (lower is better)
                          const debtData = getDebtUtilizationData();
                          const tuUtilization = debtData[1]?.openRevolvingUtilization || 100;
                          const exUtilization = debtData[3]?.openRevolvingUtilization || 100;
                          const eqUtilization = debtData[2]?.openRevolvingUtilization || 100;
                          const lowestUtilization = Math.min(tuUtilization, exUtilization, eqUtilization);
                          
                          // Calculate grade based on lowest utilization (lower is better)
                          if (lowestUtilization <= 0) return '10/10';
                          if (lowestUtilization <= 5) return '9/10';
                          if (lowestUtilization <= 10) return '8/10';
                          if (lowestUtilization <= 15) return '7/10';
                          if (lowestUtilization <= 20) return '6/10';
                          if (lowestUtilization <= 25) return '5/10';
                          if (lowestUtilization <= 30) return '4/10';
                          if (lowestUtilization <= 40) return '3/10';
                          if (lowestUtilization <= 50) return '2/10';
                          if (lowestUtilization <= 70) return '1/10';
                          return '0/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[3]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[2]?.openRevolvingUnder30 || false
                    )}`}>
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Scale-based indicator rows */}
                          {(() => {
                            const scales = [0, 5, 10, 15, 20, 25, 30];
                            
                            // Updated color logic: 30-20 yellow, 15-0 green
                            const getColorForUtilization = (scale) => {
                              if (scale >= 20) return 'yellow';  // 30-20: yellow
                              if (scale >= 0) return 'green';    // 15-0: green
                              return 'green';                    // default green
                            };
                            
                            const colors = scales.map(scale => getColorForUtilization(scale));
                            
                            // Function to map utilization to nearest scale
                            const mapUtilizationToScale = (utilization) => {
                              if (utilization === null || utilization === undefined) return null;
                              const numUtil = Math.round(utilization);
                              // Find the closest scale value (round to nearest 5)
                              const roundedUtil = Math.round(numUtil / 5) * 5;
                              return scales.find(scale => scale >= roundedUtil) || scales[scales.length - 1];
                            };
                            
                            // Get actual utilization data from debtUtilization
                            const debtData = getDebtUtilizationData();
                            const tuUtilization = debtData[1]?.openRevolvingUtilization;
                            const exUtilization = debtData[3]?.openRevolvingUtilization;
                            const eqUtilization = debtData[2]?.openRevolvingUtilization;
                            
                            // Debug logging
                            console.log('🔍 Credit Usage Debug:', {
                              tuUtilization,
                              exUtilization,
                              eqUtilization,
                              scales,
                              hasLowValues: (tuUtilization !== null && tuUtilization < scales[0]) || 
                                           (exUtilization !== null && exUtilization < scales[0]) || 
                                           (eqUtilization !== null && eqUtilization < scales[0]),
                              apiData: debtData
                            });
                            
                            // Map utilizations to scales
                            const tuScale = mapUtilizationToScale(tuUtilization);
                            const exScale = mapUtilizationToScale(exUtilization);
                            const eqScale = mapUtilizationToScale(eqUtilization);
                            
                            const rows = scales.map((scale, index) => (
                              <tr key={scale} className={`border-b bg-${colors[index]}-50`}>
                                <td className={`py-1 px-1 text-${colors[index]}-600`}>{scale}%</td>
                                <td className="text-center py-1 px-1 font-semibold text-blue-600">
                                  {tuScale === scale && tuUtilization !== null && tuUtilization !== undefined && tuUtilization <= 30 ? `${tuUtilization.toFixed(1)}%` : ''}
                                </td>
                                <td className="text-center py-1 px-1 font-semibold text-green-600">
                                  {exScale === scale && exUtilization !== null && exUtilization !== undefined && exUtilization <= 30 ? `${exUtilization.toFixed(1)}%` : ''}
                                </td>
                                <td className="text-center py-1 px-1 font-semibold text-purple-600">
                                  {eqScale === scale && eqUtilization !== null && eqUtilization !== undefined && eqUtilization <= 30 ? `${eqUtilization.toFixed(1)}%` : ''}
                                </td>
                              </tr>
                            ));
                            
                            // Add indicator row for values below the lowest scale
                            const hasLowValues = (tuUtilization !== null && tuUtilization !== undefined && tuUtilization < scales[0]) || 
                                               (exUtilization !== null && exUtilization !== undefined && exUtilization < scales[0]) || 
                                               (eqUtilization !== null && eqUtilization !== undefined && eqUtilization < scales[0]);
                            
                            if (hasLowValues) {
                              rows.unshift(
                                <tr key="below-scale" className="border-b bg-gray-50">
                                  <td className="py-1 px-1 text-gray-600">Below {scales[0]}%</td>
                                  <td className="text-center py-1 px-1 font-semibold text-blue-600">
                                    {(tuUtilization !== null && tuUtilization !== undefined && tuUtilization < scales[0]) ? `${tuUtilization?.toFixed(1)}%` : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-semibold text-green-600">
                                    {(exUtilization !== null && exUtilization !== undefined && exUtilization < scales[0]) ? `${exUtilization?.toFixed(1)}%` : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-semibold text-purple-600">
                                    {(eqUtilization !== null && eqUtilization !== undefined && eqUtilization < scales[0]) ? `${eqUtilization?.toFixed(1)}%` : ''}
                                  </td>
                                </tr>
                              );
                            }

                            // Add indicator row for values above the highest scale (Above 30%)
                            const hasHighValues = (tuUtilization !== null && tuUtilization !== undefined && tuUtilization > scales[scales.length - 1]) || 
                                               (exUtilization !== null && exUtilization !== undefined && exUtilization > scales[scales.length - 1]) || 
                                               (eqUtilization !== null && eqUtilization !== undefined && eqUtilization > scales[scales.length - 1]);

                            if (hasHighValues) {
                              rows.push(
                                <tr key="above-scale" className="border-b bg-red-50">
                                  <td className="py-1 px-1 text-red-600">Above {scales[scales.length - 1]}%</td>
                                  <td className="text-center py-1 px-1 font-semibold text-blue-600">
                                    {(tuUtilization !== null && tuUtilization !== undefined && tuUtilization > scales[scales.length - 1]) ? `${tuUtilization.toFixed(1)}%` : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-semibold text-green-600">
                                    {(exUtilization !== null && exUtilization !== undefined && exUtilization > scales[scales.length - 1]) ? `${exUtilization.toFixed(1)}%` : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-semibold text-purple-600">
                                    {(eqUtilization !== null && eqUtilization !== undefined && eqUtilization > scales[scales.length - 1]) ? `${eqUtilization.toFixed(1)}%` : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Open Accounts Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      Open Accounts
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          // Get the highest number of open accounts from the three bureaus (more is better)
                          const getOpenAccountCount = (bureauId) => {
                            if (!apiData?.Accounts) return 0;
                            return apiData.Accounts.filter(account => 
                              account.BureauId === bureauId && 
                              (account.AccountStatus === 'Open' || account.AccountStatus === 'Current')
                            ).length;
                          };
                          
                          const tuOpenAccounts = getOpenAccountCount(1);
                          const exOpenAccounts = getOpenAccountCount(2);
                          const eqOpenAccounts = getOpenAccountCount(3);
                          const highestOpenAccounts = Math.max(tuOpenAccounts, exOpenAccounts, eqOpenAccounts);
                          
                          // Calculate grade based on number of open accounts (more is better)
                          if (highestOpenAccounts >= 15) return '10/10';
                          if (highestOpenAccounts >= 13) return '9/10';
                          if (highestOpenAccounts >= 12) return '8/10';
                          if (highestOpenAccounts >= 11) return '7/10';
                          if (highestOpenAccounts >= 10) return '6/10';
                          if (highestOpenAccounts >= 9) return '5/10';
                          if (highestOpenAccounts >= 8) return '4/10';
                          if (highestOpenAccounts >= 7) return '3/10';
                          if (highestOpenAccounts >= 6) return '2/10';
                          if (highestOpenAccounts >= 5) return '1/10';
                          return '0/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[3]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[2]?.openRevolvingUnder30 || false
                    )}`}>
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const scales = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5];
                            // Updated color scheme: 15-10 green, 9-5 yellow
                            const colors = ['bg-green-50', 'bg-green-50', 'bg-green-50', 'bg-green-50', 'bg-green-50', 'bg-green-50', 'bg-yellow-50', 'bg-yellow-50', 'bg-yellow-50', 'bg-yellow-50', 'bg-yellow-50'];
                            const textColors = ['text-green-600', 'text-green-600', 'text-green-600', 'text-green-600', 'text-green-600', 'text-green-600', 'text-yellow-600', 'text-yellow-600', 'text-yellow-600', 'text-yellow-600', 'text-yellow-600'];
                            
                            // Function to map account count to scale
                            const mapAccountCountToScale = (count) => {
                              if (count >= 15) return 15;
                              if (count >= 14) return 14;
                              if (count >= 13) return 13;
                              if (count >= 12) return 12;
                              if (count >= 11) return 11;
                              if (count >= 10) return 10;
                              if (count >= 9) return 9;
                              if (count >= 8) return 8;
                              if (count >= 7) return 7;
                              if (count >= 6) return 6;
                              if (count >= 5) return 5;
                              return null; // Return null for counts below 5 to show in "Below 5" row
                            };

                            // Get open account counts for each bureau from API data
                            const getOpenAccountCount = (bureauId) => {
                              if (!apiData?.Accounts) return 0;
                              return apiData.Accounts.filter(account => 
                                account.BureauId === bureauId && 
                                (account.AccountStatus === 'Open' || account.AccountStatus === 'Current')
                              ).length;
                            };

                            const tuOpenAccounts = getOpenAccountCount(1); // TransUnion
                            const exOpenAccounts = getOpenAccountCount(2); // Experian  
                            const eqOpenAccounts = getOpenAccountCount(3); // Equifax

                            const tuScale = mapAccountCountToScale(tuOpenAccounts);
                            const exScale = mapAccountCountToScale(exOpenAccounts);
                            const eqScale = mapAccountCountToScale(eqOpenAccounts);

                            const rows = scales.map((scale, index) => (
                              <tr key={scale} className={`${index < scales.length - 1 ? 'border-b' : ''} ${colors[index]}`}>
                                <td className={`py-1 px-1 ${textColors[index]}`}>{scale}</td>
                                <td className="text-center py-1 px-1 font-medium">
                                  {tuScale === scale ? tuOpenAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1 font-medium">
                                  {exScale === scale ? exOpenAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1 font-medium">
                                  {eqScale === scale ? eqOpenAccounts : ''}
                                </td>
                              </tr>
                            ));
                            
                            // Add indicator row for counts below the lowest scale
                            const hasLowCounts = tuOpenAccounts < scales[scales.length - 1] || 
                                               exOpenAccounts < scales[scales.length - 1] || 
                                               eqOpenAccounts < scales[scales.length - 1];
                            
                            if (hasLowCounts) {
                              rows.push(
                                <tr key="below-scale" className="border-b bg-gray-50">
                                  <td className="py-1 px-1 text-gray-600">Below {scales[scales.length - 1]}</td>
                                  <td className="text-center py-1 px-1 font-medium">
                                    {tuOpenAccounts < scales[scales.length - 1] ? tuOpenAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-medium">
                                    {exOpenAccounts < scales[scales.length - 1] ? exOpenAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-medium">
                                    {eqOpenAccounts < scales[scales.length - 1] ? eqOpenAccounts : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* High-Limit Accounts Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      High-Limit Accounts
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          // Get the highest number of high-limit accounts from the three bureaus (more is better)
                          const getHighLimitAccountCount = (bureauId) => {
                            if (!apiData?.Accounts) return 0;
                            return apiData.Accounts.filter(account => 
                              account.BureauId === bureauId && 
                              account.AccountStatus === 'Open' &&
                              parseFloat(account.CreditLimit) >= 5000
                            ).length;
                          };
                          
                          const tuHighLimitAccounts = getHighLimitAccountCount(1);
                          const exHighLimitAccounts = getHighLimitAccountCount(2);
                          const eqHighLimitAccounts = getHighLimitAccountCount(3);
                          const highestHighLimitAccounts = Math.max(tuHighLimitAccounts, exHighLimitAccounts, eqHighLimitAccounts);
                          
                          // Calculate grade based on number of high-limit accounts (more is better)
                          if (highestHighLimitAccounts >= 10) return '10/10';
                          if (highestHighLimitAccounts >= 8) return '9/10';
                          if (highestHighLimitAccounts >= 7) return '8/10';
                          if (highestHighLimitAccounts >= 6) return '7/10';
                          if (highestHighLimitAccounts >= 5) return '6/10';
                          if (highestHighLimitAccounts >= 4) return '5/10';
                          if (highestHighLimitAccounts >= 3) return '4/10';
                          if (highestHighLimitAccounts >= 2) return '3/10';
                          if (highestHighLimitAccounts >= 1) return '2/10';
                          return '0/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[3]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[2]?.openRevolvingUnder30 || false
                    )}`}>
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const scales = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
                            // Updated color scheme: above 10-5 green, 0-5 yellow
                            const colors = ['bg-green-50', 'bg-green-50', 'bg-green-50', 'bg-green-50', 'bg-green-50', 'bg-green-50', 'bg-yellow-50', 'bg-yellow-50', 'bg-yellow-50', 'bg-yellow-50', 'bg-yellow-50'];
                            const textColors = ['text-green-600', 'text-green-600', 'text-green-600', 'text-green-600', 'text-green-600', 'text-green-600', 'text-yellow-600', 'text-yellow-600', 'text-yellow-600', 'text-yellow-600', 'text-yellow-600'];
                            
                            // Function to map high-limit account count to scale (10-scale format)
                            const mapHighLimitCountToScale = (count) => {
                              if (count >= 10) return 10;
                              if (count < 5) return null; // Show in "Below 5" row
                              return count;
                            };

                            // Get high-limit account counts for each bureau from API data (accounts with credit limit >= $5,000 and AccountStatus = 'Open')
                            const getHighLimitAccountCount = (bureauId) => {
                              console.log('🔍 High-Limit Debug: Starting function for bureau', bureauId);
                              console.log('🔍 High-Limit Debug: apiData structure:', apiData);
                              console.log('🔍 High-Limit Debug: apiData.Accounts:', apiData?.Accounts);
                              
                              if (!apiData?.Accounts) {
                                console.log('❌ High-Limit Debug: No accounts data found');
                                return 0;
                              }
                              
                              const allAccounts = apiData.Accounts;
                              console.log(`✅ High-Limit Debug: Total accounts found: ${allAccounts.length}`);
                              console.log('🔍 High-Limit Debug: First few accounts:', allAccounts.slice(0, 3));
                              
                              const filteredAccounts = allAccounts.filter(account => {
                                const matchesBureau = account.BureauId === bureauId;
                                const isOpen = account.AccountStatus === 'Open';
                                const creditLimit = parseFloat(account.CreditLimit);
                                const hasHighLimit = creditLimit >= 5000;
                                
                                console.log(`🔍 Account ${account.AccountNumber || 'N/A'}: Bureau=${account.BureauId}, Status=${account.AccountStatus}, CreditLimit=${account.CreditLimit}, Parsed=${creditLimit}, Matches=${matchesBureau && isOpen && hasHighLimit}`);
                                
                                return matchesBureau && isOpen && hasHighLimit;
                              });
                              
                              console.log(`✅ High-Limit Debug: Bureau ${bureauId} - Found ${filteredAccounts.length} high-limit accounts`);
                              return filteredAccounts.length;
                            };

                            const tuHighLimitAccounts = getHighLimitAccountCount(1); // TransUnion
                            const exHighLimitAccounts = getHighLimitAccountCount(2); // Experian  
                            const eqHighLimitAccounts = getHighLimitAccountCount(3); // Equifax

                            const tuScale = mapHighLimitCountToScale(tuHighLimitAccounts);
                            const exScale = mapHighLimitCountToScale(exHighLimitAccounts);
                            const eqScale = mapHighLimitCountToScale(eqHighLimitAccounts);

                            const rows = scales.map((scale, index) => (
                              <tr key={scale} className={`${index < scales.length - 1 ? 'border-b' : ''} ${colors[index]}`}>
                                <td className={`py-1 px-1 ${textColors[index]}`}>{scale}</td>
                                <td className="text-center py-1 px-1 font-medium">
                                  {tuScale === scale ? tuHighLimitAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1 font-medium">
                                  {exScale === scale ? exHighLimitAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1 font-medium">
                                  {eqScale === scale ? eqHighLimitAccounts : ''}
                                </td>
                              </tr>
                            ));
                            
                            // Add "Below 5" row for accounts with counts below 5
                            const hasLowCounts = tuScale === null || exScale === null || eqScale === null;
                            
                            if (hasLowCounts) {
                              rows.push(
                                <tr key="below-5" className="border-t bg-gray-50">
                                  <td className="py-1 px-1 text-gray-600">Below 5</td>
                                  <td className="text-center py-1 px-1 font-medium">
                                    {tuScale === null ? tuHighLimitAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-medium">
                                    {exScale === null ? exHighLimitAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-medium">
                                    {eqScale === null ? eqHighLimitAccounts : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            // Add indicator row for counts above the highest scale
                            const hasHighCounts = tuHighLimitAccounts > scales[0] || 
                                                 exHighLimitAccounts > scales[0] || 
                                                 eqHighLimitAccounts > scales[0];
                            
                            if (hasHighCounts) {
                              rows.unshift(
                                <tr key="above-scale" className="border-b bg-emerald-50">
                                  <td className="py-1 px-1 text-emerald-600">Above {scales[0]}</td>
                                  <td className="text-center py-1 px-1 font-medium">
                                    {tuHighLimitAccounts > scales[0] ? tuHighLimitAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-medium">
                                    {exHighLimitAccounts > scales[0] ? exHighLimitAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1 font-medium">
                                    {eqHighLimitAccounts > scales[0] ? eqHighLimitAccounts : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* New Accounts Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      New Accounts
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          // Get the lowest number of new accounts from the three bureaus (fewer is better)
                          const getNewAccountCount = (bureauId) => {
                            if (!apiData?.reportData?.reportData?.Accounts) return 0;
                            
                            const currentDate = new Date();
                            const twoYearsAgo = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
                            
                            return apiData.Accounts.filter(account => {
                              if (account.BureauId !== bureauId) return false;
                              
                              const openDate = new Date(account.DateOpened);
                              return openDate >= twoYearsAgo;
                            }).length;
                          };
                          
                          const tuNewAccounts = getNewAccountCount(1);
                          const exNewAccounts = getNewAccountCount(2);
                          const eqNewAccounts = getNewAccountCount(3);
                          const lowestNewAccounts = Math.min(tuNewAccounts, exNewAccounts, eqNewAccounts);
                          
                          // Calculate grade based on number of new accounts (fewer is better)
                          if (lowestNewAccounts === 0) return '10/10';
                          if (lowestNewAccounts === 1) return '8/10';
                          if (lowestNewAccounts === 2) return '6/10';
                          if (lowestNewAccounts === 3) return '4/10';
                          if (lowestNewAccounts === 4) return '2/10';
                          if (lowestNewAccounts >= 5) return '0/10';
                          return '1/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[3]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[2]?.openRevolvingUnder30 || false
                    )}`}>
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const scales = [0, 1, 2, 3, 4];
                            
                            // Function to get color based on inquiry count
                            const getColorForInquiry = (scale) => {
                              if (scale === 0) return 'bg-green-50'; // 0 inquiries green
                              return 'bg-yellow-50'; // Rest yellow
                            };
                            
                            const getTextColorForInquiry = (scale) => {
                              if (scale === 0) return 'text-green-600'; // 0 inquiries green
                              return 'text-yellow-600'; // Rest yellow
                            };
                            
                            const colors = scales.map(scale => getColorForInquiry(scale));
                            const textColors = scales.map(scale => getTextColorForInquiry(scale));
                            
                            const mapNewAccountCountToScale = (count) => {
                              return Math.min(count, 4);
                            };
                            
                            const getNewAccountCount = (bureauId) => {
                              if (!apiData?.reportData?.reportData?.Accounts) return 0;
                              
                              const currentDate = new Date();
                              const twoYearsAgo = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
                              
                              return apiData.Accounts.filter(account => {
                                if (account.BureauId !== bureauId) return false;
                                
                                const openDate = new Date(account.DateOpened);
                                return openDate >= twoYearsAgo;
                              }).length;
                            };
                            
                            const tuNewAccounts = getNewAccountCount(1);
                            const exNewAccounts = getNewAccountCount(3);
                            const eqNewAccounts = getNewAccountCount(2);
                            
                            const rows = scales.map((scale, index) => (
                              <tr key={scale} className={`border-b ${colors[index]}`}>
                                <td className={`py-1 px-1 ${textColors[index]}`}>{scale}</td>
                                <td className="text-center py-1 px-1">
                                  {mapNewAccountCountToScale(tuNewAccounts) === scale ? tuNewAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapNewAccountCountToScale(exNewAccounts) === scale ? exNewAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapNewAccountCountToScale(eqNewAccounts) === scale ? eqNewAccounts : ''}
                                </td>
                              </tr>
                            ));
                            
                            // Add indicator row for counts above the highest scale
                            const hasHighCounts = tuNewAccounts > scales[scales.length - 1] || 
                                                 exNewAccounts > scales[scales.length - 1] || 
                                                 eqNewAccounts > scales[scales.length - 1];
                            
                            if (hasHighCounts) {
                              rows.push(
                                <tr key="above-scale" className="border-b bg-red-100">
                                  <td className="py-1 px-1 text-red-700">Above {scales[scales.length - 1]}</td>
                                  <td className="text-center py-1 px-1">
                                    {tuNewAccounts > scales[scales.length - 1] ? tuNewAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {exNewAccounts > scales[scales.length - 1] ? exNewAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {eqNewAccounts > scales[scales.length - 1] ? eqNewAccounts : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            return rows;
                          })()}
                         </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Over 50% Usage Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      Over 50% Usage
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          // Grade based on lowest count of high-usage accounts across bureaus (lower is better)
                          const getHighUsageAccountCount = (bureauId: number) => {
                            if (!(apiData as any)?.Accounts) return 0;
                            try {
                              return (apiData as any).Accounts.filter((account: any) => {
                                if (Number(account?.BureauId) !== Number(bureauId)) return false;
                                const status = String(account?.AccountStatus || '').toLowerCase();
                                if (!(status === 'open' || status === 'current')) return false;
                                const balance = parseFloat(account?.Balance) || 0;
                                const limit = parseFloat(account?.CreditLimit) || 0;
                                if (limit <= 0) return false;
                                const util = (balance / limit) * 100;
                                return util > 50;
                              }).length;
                            } catch {
                              return 0;
                            }
                          };
                          const tu = getHighUsageAccountCount(1);
                          const ex = getHighUsageAccountCount(3);
                          const eq = getHighUsageAccountCount(2);
                          const lowest = Math.min(tu, ex, eq);
                          if (lowest === 0) return '10/10';
                          if (lowest === 1) return '8/10';
                          if (lowest === 2) return '6/10';
                          if (lowest === 3) return '4/10';
                          if (lowest === 4) return '2/10';
                          return '0/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[3]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[2]?.openRevolvingUnder30 || false
                    )}`}>
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const scales = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                            const colors = ['bg-green-50', 'bg-blue-50', 'bg-yellow-50', 'bg-orange-50', 'bg-red-50', 'bg-yellow-50', 'bg-orange-50', 'bg-orange-50', 'bg-red-50', 'bg-red-50', 'bg-red-50'];
                            const textColors = ['text-green-600', 'text-blue-600', 'text-yellow-600', 'text-orange-600', 'text-red-600', 'text-yellow-600', 'text-orange-600', 'text-orange-600', 'text-red-600', 'text-red-600', 'text-red-600'];
                            
                            const mapHighUsageCountToScale = (count) => {
                              return Math.min(count, 10);
                            };
                            
                            const getHighUsageAccountCount = (bureauId) => {
                              if (!apiData?.Accounts) return 0;
                              
                              return apiData.Accounts.filter(account => {
                                if (account.BureauId !== bureauId) return false;
                                if (!account.AccountStatus || (account.AccountStatus !== 'Open' && account.AccountStatus !== 'Current')) return false;
                                
                                const balance = parseFloat(account.Balance) || 0;
                                const creditLimit = parseFloat(account.CreditLimit) || 0;
                                
                                if (creditLimit > 0) {
                                  const utilization = (balance / creditLimit) * 100;
                                  return utilization > 50;
                                }
                                
                                return false;
                              }).length;
                            };
                            
                            const tuHighUsageAccounts = getHighUsageAccountCount(1);
                            const exHighUsageAccounts = getHighUsageAccountCount(3);
                            const eqHighUsageAccounts = getHighUsageAccountCount(2);
                            
                            const rows = scales.map((scale, index) => (
                              <tr key={scale} className={`${index === scales.length - 1 ? '' : 'border-b'} ${colors[index]}`}>
                                <td className={`py-1 px-1 ${textColors[index]}`}>{scale}</td>
                                <td className="text-center py-1 px-1">
                                  {mapHighUsageCountToScale(tuHighUsageAccounts) === scale ? tuHighUsageAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapHighUsageCountToScale(exHighUsageAccounts) === scale ? exHighUsageAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapHighUsageCountToScale(eqHighUsageAccounts) === scale ? eqHighUsageAccounts : ''}
                                </td>
                              </tr>
                            ));
                            
                            // Add indicator row for counts above the highest scale
                            const hasHighCounts = tuHighUsageAccounts > scales[0] || 
                                                 exHighUsageAccounts > scales[0] || 
                                                 eqHighUsageAccounts > scales[0];
                            
                            if (hasHighCounts) {
                              rows.unshift(
                                <tr key="above-scale" className="border-b bg-red-100">
                                  <td className="py-1 px-1 text-red-700">Above {scales[0]}</td>
                                  <td className="text-center py-1 px-1">
                                    {tuHighUsageAccounts > scales[0] ? tuHighUsageAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {exHighUsageAccounts > scales[0] ? exHighUsageAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {eqHighUsageAccounts > scales[0] ? eqHighUsageAccounts : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Second Row - 5 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                
                {/* Installment Accounts Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      Installment Accounts
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          // Grade based on highest count of installment accounts (more is better)
                          const getInstallmentAccountCount = (bureauId: number) => {
                            if (!(apiData as any)?.Accounts) return 0;
                            try {
                              return (apiData as any).Accounts.filter((account: any) => {
                                if (Number(account?.BureauId) !== Number(bureauId)) return false;
                                const status = String(account?.AccountStatus || '').toLowerCase();
                                if (!(status === 'open' || status === 'current')) return false;
                                const type = String(account?.AccountType || '').toLowerCase();
                                const isInstallment = type.includes('installment') || type.includes('auto') || type.includes('mortgage') || type.includes('student') || !account?.CreditLimit;
                                return isInstallment;
                              }).length;
                            } catch {
                              return 0;
                            }
                          };
                          const tu = getInstallmentAccountCount(1);
                          const ex = getInstallmentAccountCount(3);
                          const eq = getInstallmentAccountCount(2);
                          const highest = Math.max(tu, ex, eq);
                          if (highest >= 2) return '10/10';
                          if (highest >= 1) return '6/10';
                          return '0/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[3]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[2]?.openRevolvingUnder30 || false
                    )}`}>
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const scales = [2, 1, 0];
                            const colors = ['bg-green-50', 'bg-green-50', 'bg-yellow-50'];
                            const textColors = ['text-green-600', 'text-green-600', 'text-yellow-600'];
                            
                            const mapInstallmentCountToScale = (count) => {
                              return Math.min(count, 2);
                            };
                            
                            const getInstallmentAccountCount = (bureauId) => {
                              if (!apiData?.Accounts) return 0;
                              
                              return apiData.Accounts.filter(account => {
                                if (account.BureauId !== bureauId) return false;
                                if (!account.AccountStatus || (account.AccountStatus !== 'Open' && account.AccountStatus !== 'Current')) return false;
                                
                                // Check if it's an installment account (not revolving)
                                const accountType = account.AccountType?.toLowerCase() || '';
                                return accountType.includes('installment') || 
                                       accountType.includes('auto') || 
                                       accountType.includes('mortgage') || 
                                       accountType.includes('student') ||
                                       (account.CreditLimit === null || account.CreditLimit === 0);
                              }).length;
                            };
                            
                            const tuInstallmentAccounts = getInstallmentAccountCount(1);
                            const exInstallmentAccounts = getInstallmentAccountCount(3);
                            const eqInstallmentAccounts = getInstallmentAccountCount(2);
                            
                            const rows = scales.map((scale, index) => (
                              <tr key={scale} className={`${index === scales.length - 1 ? '' : 'border-b'} ${colors[index]}`}>
                                <td className={`py-1 px-1 ${textColors[index]}`}>{scale}</td>
                                <td className="text-center py-1 px-1">
                                  {mapInstallmentCountToScale(tuInstallmentAccounts) === scale ? tuInstallmentAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapInstallmentCountToScale(exInstallmentAccounts) === scale ? exInstallmentAccounts : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapInstallmentCountToScale(eqInstallmentAccounts) === scale ? eqInstallmentAccounts : ''}
                                </td>
                              </tr>
                            ));
                            
                            // Add indicator row for counts above the highest scale
                            const hasHighCounts = tuInstallmentAccounts > scales[0] || 
                                                 exInstallmentAccounts > scales[0] || 
                                                 eqInstallmentAccounts > scales[0];
                            
                            if (hasHighCounts) {
                              rows.unshift(
                                <tr key="above-scale" className="border-b bg-green-100">
                                  <td className="py-1 px-1 text-green-700">Above {scales[0]}</td>
                                  <td className="text-center py-1 px-1">
                                    {tuInstallmentAccounts > scales[0] ? tuInstallmentAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {exInstallmentAccounts > scales[0] ? exInstallmentAccounts : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {eqInstallmentAccounts > scales[0] ? eqInstallmentAccounts : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            return rows;
                          })()}
                          </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Age Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      Age
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          // Get the highest average account age from the three bureaus (older is better)
                          const getAverageAccountAge = (bureauId) => {
                            if (!apiData?.Accounts) return 0;
                            
                            const accounts = apiData.Accounts.filter(account => {
                              return account.BureauId === bureauId && account.DateOpened;
                            });
                            
                            if (accounts.length === 0) return 0;
                            
                            const currentDate = new Date();
                            const totalAgeInMonths = accounts.reduce((sum, account) => {
                              const openDate = new Date(account.DateOpened);
                              const ageInMonths = (currentDate.getFullYear() - openDate.getFullYear()) * 12 + 
                                                 (currentDate.getMonth() - openDate.getMonth());
                              return sum + Math.max(0, ageInMonths);
                            }, 0);
                            
                            const averageAgeInMonths = totalAgeInMonths / accounts.length;
                            return Math.floor(averageAgeInMonths / 12);
                          };
                          
                          const tuAverageAge = getAverageAccountAge(1);
                          const exAverageAge = getAverageAccountAge(3);
                          const eqAverageAge = getAverageAccountAge(2);
                          const highestAge = Math.max(tuAverageAge, exAverageAge, eqAverageAge);
                          
                          // Calculate grade based on average account age (older is better)
                          if (highestAge >= 12) return '10/10';
                          if (highestAge >= 10) return '9/10';
                          if (highestAge >= 8) return '8/10';
                          if (highestAge >= 6) return '7/10';
                          if (highestAge >= 5) return '6/10';
                          if (highestAge >= 4) return '5/10';
                          if (highestAge >= 3) return '4/10';
                          if (highestAge >= 2) return '3/10';
                          if (highestAge >= 1) return '2/10';
                          return '0/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.minFiveOpenRevolving || false,
                      reportData?.qualificationCriteria?.[3]?.minFiveOpenRevolving || false,
                      reportData?.qualificationCriteria?.[2]?.minFiveOpenRevolving || false
                    )}`}>
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const scales = ['12 yrs', '11 yrs', '10 yrs', '9 yrs', '8 yrs', '7 yrs', '6 yrs', '5 yrs', '4 yrs', '3 yrs', '2 yr'];
                            
                            // Function to get color based on age scale
                            const getColorForAge = (scale) => {
                              const ageValue = parseInt(scale);
                              if (ageValue >= 7) return 'bg-green-50'; // 7-12 years green
                              if (ageValue >= 2) return 'bg-yellow-50'; // 2-6 years yellow
                              return 'bg-red-50'; // Below 2 years red
                            };
                            
                            const getTextColorForAge = (scale) => {
                              const ageValue = parseInt(scale);
                              if (ageValue >= 7) return 'text-green-600'; // 7-12 years green
                              if (ageValue >= 2) return 'text-yellow-600'; // 2-6 years yellow
                              return 'text-red-600'; // Below 2 years red
                            };
                            
                            const colors = scales.map(scale => getColorForAge(scale));
                            const textColors = scales.map(scale => getTextColorForAge(scale));
                            
                            const mapAgeToScale = (ageInYears) => {
                              if (ageInYears >= 12) return '12 yrs';
                              if (ageInYears >= 11) return '11 yrs';
                              if (ageInYears >= 10) return '10 yrs';
                              if (ageInYears >= 9) return '9 yrs';
                              if (ageInYears >= 8) return '8 yrs';
                              if (ageInYears >= 7) return '7 yrs';
                              if (ageInYears >= 6) return '6 yrs';
                              if (ageInYears >= 5) return '5 yrs';
                              if (ageInYears >= 4) return '4 yrs';
                              if (ageInYears >= 3) return '3 yrs';
                              return '2 yr';
                            };
                            
                            const getAverageAccountAge = (bureauId) => {
                              if (!apiData?.Accounts) return 0;
                              
                              const accounts = apiData.Accounts.filter(account => {
                                return account.BureauId === bureauId && account.DateOpened;
                              });
                              
                              if (accounts.length === 0) return 0;
                              
                              const currentDate = new Date();
                              const totalAgeInMonths = accounts.reduce((sum, account) => {
                                const openDate = new Date(account.DateOpened);
                                const ageInMonths = (currentDate.getFullYear() - openDate.getFullYear()) * 12 + 
                                                   (currentDate.getMonth() - openDate.getMonth());
                                return sum + Math.max(0, ageInMonths);
                              }, 0);
                              
                              const averageAgeInMonths = totalAgeInMonths / accounts.length;
                              return Math.floor(averageAgeInMonths / 12);
                            };
                            
                            const tuAverageAge = getAverageAccountAge(1);
                            const exAverageAge = getAverageAccountAge(3);
                            const eqAverageAge = getAverageAccountAge(2);
                            
                            const rows = scales.map((scale, index) => (
                              <tr key={scale} className={`${index === scales.length - 1 ? '' : 'border-b'} ${colors[index]}`}>
                                <td className={`py-1 px-1 ${textColors[index]}`}>{scale}</td>
                                <td className="text-center py-1 px-1">
                                  {mapAgeToScale(tuAverageAge) === scale ? `${tuAverageAge} yrs` : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapAgeToScale(exAverageAge) === scale ? `${exAverageAge} yrs` : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapAgeToScale(eqAverageAge) === scale ? `${eqAverageAge} yrs` : ''}
                                </td>
                              </tr>
                            ));
                            
                            // Add indicator row for ages above the highest scale (12+ years)
                            const hasHighAges = tuAverageAge > 12 || exAverageAge > 12 || eqAverageAge > 12;
                            
                            if (hasHighAges) {
                              rows.unshift(
                                <tr key="above-scale" className="border-b bg-green-100">
                                  <td className="py-1 px-1 text-green-700">Above 12 yrs</td>
                                  <td className="text-center py-1 px-1">
                                    {tuAverageAge > 12 ? `${tuAverageAge} yrs` : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {exAverageAge > 12 ? `${exAverageAge} yrs` : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {eqAverageAge > 12 ? `${eqAverageAge} yrs` : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Inquiries Card (All-Time) */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      Inquiries
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          // Grade based on lowest inquiry count across bureaus (lower is better)
                          const getTotalInquiryCount = (bureauId: number) => {
                            const list = (apiData as any)?.reportData?.reportData?.Inquiries ?? (apiData as any)?.Inquiries ?? [];
                            try {
                              return list.filter((inq: any) => Number(inq?.BureauId) === Number(bureauId)).length;
                            } catch {
                              return 0;
                            }
                          };
                          const tu = getTotalInquiryCount(1);
                          const ex = getTotalInquiryCount(3);
                          const eq = getTotalInquiryCount(2);
                          const lowest = Math.min(tu, ex, eq);
                          if (lowest === 0) return '10/10';
                          if (lowest === 1) return '8/10';
                          if (lowest === 2) return '6/10';
                          if (lowest === 3) return '4/10';
                          if (lowest === 4) return '2/10';
                          return '0/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const scales = [0, 1, 2, 3, 4];
                            const colors = ['bg-green-50', 'bg-blue-50', 'bg-yellow-50', 'bg-orange-50', 'bg-red-50'];
                            const textColors = ['text-green-600', 'text-blue-600', 'text-yellow-600', 'text-orange-600', 'text-red-600'];
                            
                            const mapInquiryCountToScale = (count) => {
                              return Math.min(count, 4);
                            };
                            
                            const getTotalInquiryCount = (bureauId) => {
                              const list = apiData?.reportData?.reportData?.Inquiries ?? apiData?.Inquiries ?? [];
                              try {
                                return list.filter((inquiry: any) => Number(inquiry?.BureauId) === Number(bureauId)).length;
                              } catch {
                                return 0;
                              }
                            };
                            
                            const tuInquiries = getTotalInquiryCount(1);
                            const exInquiries = getTotalInquiryCount(3);
                            const eqInquiries = getTotalInquiryCount(2);
                            
                            const rows = scales.map((scale, index) => (
                              <tr key={scale} className={`${index === scales.length - 1 ? '' : 'border-b'} ${colors[index]}`}>
                                <td className={`py-1 px-1 ${textColors[index]}`}>{scale}</td>
                                <td className="text-center py-1 px-1">
                                  {mapInquiryCountToScale(tuInquiries) === scale ? tuInquiries : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapInquiryCountToScale(exInquiries) === scale ? exInquiries : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {mapInquiryCountToScale(eqInquiries) === scale ? eqInquiries : ''}
                                </td>
                              </tr>
                            ));
                            
                            // Add indicator row for counts above the highest scale
                            const hasHighCounts = tuInquiries > scales[scales.length - 1] || 
                                                 exInquiries > scales[scales.length - 1] || 
                                                 eqInquiries > scales[scales.length - 1];
                            
                            if (hasHighCounts) {
                              rows.push(
                                <tr key="above-scale" className="border-b bg-red-100">
                                  <td className="py-1 px-1 text-red-700">Above {scales[scales.length - 1]}</td>
                                  <td className="text-center py-1 px-1">
                                    {tuInquiries > scales[scales.length - 1] ? tuInquiries : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {exInquiries > scales[scales.length - 1] ? exInquiries : ''}
                                  </td>
                                  <td className="text-center py-1 px-1">
                                    {eqInquiries > scales[scales.length - 1] ? eqInquiries : ''}
                                  </td>
                                </tr>
                              );
                            }
                            
                            return rows;
                          })()}
                          </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Bankruptcy Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      Bankruptcy
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          const hasBankruptcy = (bureauId: number) => {
                            const pr = (apiData as any)?.PublicRecords ?? [];
                            try {
                              return pr.some((record: any) => {
                                if (Number(record?.BureauId) !== Number(bureauId)) return false;
                                const type = String(record?.RecordType || '').toLowerCase();
                                return type.includes('bankruptcy') || type.includes('chapter');
                              });
                            } catch {
                              return false;
                            }
                          };
                          const anyBankruptcy = hasBankruptcy(1) || hasBankruptcy(3) || hasBankruptcy(2);
                          return anyBankruptcy ? '0/10' : '10/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const scales = ['Yes', 'No'];
                            const colors = ['bg-red-50', 'bg-green-50'];
                            const textColors = ['text-red-600', 'text-green-600'];
                            
                            const getBankruptcyStatus = (bureauId) => {
                              if (!apiData?.PublicRecords) return 'No';
                              
                              const hasBankruptcy = apiData.PublicRecords?.some(record => {
                                if (record.BureauId !== bureauId) return false;
                                
                                const recordType = record.RecordType?.toLowerCase() || '';
                                return recordType.includes('bankruptcy') || recordType.includes('chapter');
                              });
                              
                              return hasBankruptcy ? 'Yes' : 'No';
                            };
                            
                            const tuBankruptcy = getBankruptcyStatus(1);
                            const exBankruptcy = getBankruptcyStatus(3);
                            const eqBankruptcy = getBankruptcyStatus(2);
                            
                            return scales.map((scale, index) => (
                              <tr key={scale} className={`${index === scales.length - 1 ? '' : 'border-b'} ${colors[index]}`}>
                                <td className={`py-1 px-1 ${textColors[index]}`}>{scale}</td>
                                <td className="text-center py-1 px-1">
                                  {tuBankruptcy === scale ? scale : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {exBankruptcy === scale ? scale : ''}
                                </td>
                                <td className="text-center py-1 px-1">
                                  {eqBankruptcy === scale ? scale : ''}
                                </td>
                              </tr>
                            ));
                          })()}
                          </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Negative Marks Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      Negative Marks
                      <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 rounded-full">
                        {(() => {
                          const hasNegativeMarks = (bureauId: number) => {
                            const accounts = (apiData as any)?.Accounts ?? [];
                            const records = (apiData as any)?.PublicRecords ?? [];
                            try {
                              const hasNegAccount = accounts.some((account: any) => {
                                if (Number(account?.BureauId) !== Number(bureauId)) return false;
                                const status = String(account?.PaymentStatus || '').toLowerCase();
                                const pastDue = parseFloat(account?.PastDue) || 0;
                                return (
                                  pastDue > 0 ||
                                  /late|charge|collection|delinq|derog|past\s*due|in collections|charge off/i.test(status) ||
                                  (status && !/current|paid/i.test(status))
                                );
                              });
                              const hasPR = records.some((record: any) => Number(record?.BureauId) === Number(bureauId));
                              return hasNegAccount || hasPR;
                            } catch {
                              return false;
                            }
                          };
                          const countNeg = [hasNegativeMarks(1), hasNegativeMarks(3), hasNegativeMarks(2)].filter(Boolean).length;
                          if (countNeg === 0) return '10/10';
                          if (countNeg === 1) return '6/10';
                          if (countNeg === 2) return '3/10';
                          return '0/10';
                        })()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 px-1 font-medium">Scale</th>
                            <th className="text-center py-1 px-1 font-medium">TU</th>
                            <th className="text-center py-1 px-1 font-medium">EX</th>
                            <th className="text-center py-1 px-1 font-medium">EQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const hasNegativeMarks = (bureauId: number) => {
                              const accounts = (apiData as any)?.Accounts ?? [];
                              const records = (apiData as any)?.PublicRecords ?? [];
                              try {
                                const hasNegAccount = accounts.some((account: any) => {
                                  if (Number(account?.BureauId) !== Number(bureauId)) return false;
                                  const status = String(account?.PaymentStatus || '').toLowerCase();
                                  const pastDue = parseFloat(account?.PastDue) || 0;
                                  return (
                                    pastDue > 0 ||
                                    /late|charge|collection|delinq|derog|past\s*due|in collections|charge off/i.test(status) ||
                                    (status && !/current|paid/i.test(status))
                                  );
                                });
                                const hasPR = records.some((record: any) => Number(record?.BureauId) === Number(bureauId));
                                return hasNegAccount || hasPR;
                              } catch {
                                return false;
                              }
                            };
                            const tu = hasNegativeMarks(1) ? 'Yes' : 'No';
                            const ex = hasNegativeMarks(3) ? 'Yes' : 'No';
                            const eq = hasNegativeMarks(2) ? 'Yes' : 'No';
                            const scales = ['Yes', 'No'];
                            const colors = ['bg-red-50', 'bg-green-50'];
                            const textColors = ['text-red-600', 'text-green-600'];
                            return scales.map((scale, index) => (
                              <tr key={scale} className={`${index === scales.length - 1 ? '' : 'border-b'} ${colors[index]}`}>
                                <td className={`py-1 px-1 ${textColors[index]}`}>{scale}</td>
                                <td className="text-center py-1 px-1">{tu === scale ? scale : ''}</td>
                                <td className="text-center py-1 px-1">{ex === scale ? scale : ''}</td>
                                <td className="text-center py-1 px-1">{eq === scale ? scale : ''}</td>
                              </tr>
                            ));
                          })()}
                         </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </CardContent>
          </Card>



          {/* Do You Qualify */}
          <Card className={`${qualifyView === 'cards' ? 'hidden' : ''} border-0 shadow-xl bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/50`}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-2xl font-bold text-gray-800">Do You Qualify</CardTitle>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle className="h-3 w-3" /> Good to go
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    <AlertTriangle className="h-3 w-3" /> Proceed with caution
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                    <XCircle className="h-3 w-3" /> Not eligible
                  </span>
                </div>
              </div>
              <CardDescription className="mt-2">
                {(() => {
                  const criteriaFlags = {
                    score: [
                      getCriteriaFlag(1, "score700Plus") || getCriteriaFlag(1, "score730Plus"),
                      getCriteriaFlag(3, "score700Plus") || getCriteriaFlag(3, "score730Plus"),
                      getCriteriaFlag(2, "score700Plus") || getCriteriaFlag(2, "score730Plus"),
                    ],
                    openUtil: [
                      getCriteriaFlag(1, "openRevolvingUnder30"),
                      getCriteriaFlag(3, "openRevolvingUnder30"),
                      getCriteriaFlag(2, "openRevolvingUnder30"),
                    ],
                    allUtil: [
                      getCriteriaFlag(1, "allRevolvingUnder30"),
                      getCriteriaFlag(3, "allRevolvingUnder30"),
                      getCriteriaFlag(2, "allRevolvingUnder30"),
                    ],
                    openCount: [
                      getCriteriaFlag(1, "minFiveOpenRevolving"),
                      getCriteriaFlag(3, "minFiveOpenRevolving"),
                      getCriteriaFlag(2, "minFiveOpenRevolving"),
                    ],
                    unsecuredRecent: [
                      getCriteriaFlag(1, "maxFourUnsecuredIn12Months"),
                      getCriteriaFlag(3, "maxFourUnsecuredIn12Months"),
                      getCriteriaFlag(2, "maxFourUnsecuredIn12Months"),
                    ],
                    inquiries: [
                      getCriteriaFlag(1, "noInquiries"),
                      getCriteriaFlag(3, "noInquiries"),
                      getCriteriaFlag(2, "noInquiries"),
                    ],
                    bankruptcies: [
                      getCriteriaFlag(1, "noBankruptcies"),
                      getCriteriaFlag(3, "noBankruptcies"),
                      getCriteriaFlag(2, "noBankruptcies"),
                    ],
                    collections: [
                      getCriteriaFlag(1, "noCollections") || getCriteriaFlag(1, "noCollectionsLiensJudgements"),
                      getCriteriaFlag(3, "noCollections") || getCriteriaFlag(3, "noCollectionsLiensJudgements"),
                      getCriteriaFlag(2, "noCollections") || getCriteriaFlag(2, "noCollectionsLiensJudgements"),
                    ],
                    chargeOffs: [
                      getCriteriaFlag(1, "noChargeOffs"),
                      getCriteriaFlag(3, "noChargeOffs"),
                      getCriteriaFlag(2, "noChargeOffs"),
                    ],
                    latePays: [
                      getCriteriaFlag(1, "noLatePayments"),
                      getCriteriaFlag(3, "noLatePayments"),
                      getCriteriaFlag(2, "noLatePayments"),
                    ],
                  } as const;

                  const criteriaMetCount = Object.values(criteriaFlags).reduce((acc, flags) => acc + (flags.every(Boolean) ? 1 : 0), 0);
                  const criteriaTotal = Object.values(criteriaFlags).length;
                  const ratio = criteriaTotal > 0 ? criteriaMetCount / criteriaTotal : 0;
                  const status = isFundingEligible ? "green" : ratio >= 0.5 ? "yellow" : "red";
                  const label =
                    status === "green" ? "Good to go" :
                    status === "yellow" ? "Proceed with caution" : "Not eligible";
                  const Icon = status === "green" ? CheckCircle : status === "yellow" ? AlertTriangle : XCircle;
                  const colorClasses =
                    status === "green" ? "bg-green-100 text-green-700 border-green-200" :
                    status === "yellow" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-red-100 text-red-700 border-red-200";

                  return (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border ${colorClasses}`}>
                        <Icon className="h-4 w-4" />
                        <span>Your Status: {label}</span>
                      </span>
                      {!isFundingEligible && (
                        <span className="text-xs text-muted-foreground">
                          Meets {criteriaMetCount} of {criteriaTotal} core criteria
                        </span>
                      )}
                    </div>
                  );
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center py-2 px-4 font-semibold">TU</th>
                      <th className="text-center py-2 px-4 font-semibold">EX</th>
                      <th className="text-center py-2 px-4 font-semibold">EQ</th>
                      <th className="text-left py-2 px-4 font-semibold">Criteria</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {(() => {
                      // Function to get row background color based on qualification status
                      const getRowBgColor = (tuStatus: boolean, exStatus: boolean, eqStatus: boolean) => {
                        const passedCount = [tuStatus, exStatus, eqStatus].filter(Boolean).length;
                        if (passedCount === 3) return 'bg-green-50 hover:bg-green-100';
                        if (passedCount === 2) return 'bg-yellow-50 hover:bg-yellow-100';
                        if (passedCount === 1) return 'bg-orange-50 hover:bg-orange-100';
                        return 'bg-red-50 hover:bg-red-100';
                      };

                      // Robustly fetch inquiries from either reportData or apiData (support multiple shapes)
                      const inquiriesList: any[] = (() => {
                        const rd = (reportData as any)?.inquiries;
                        if (Array.isArray(rd) && rd.length) return rd;
                        const candidates = [
                          (apiData as any)?.Inquiries,
                          (apiData as any)?.reportData?.Inquiries,
                          (apiData as any)?.reportData?.reportData?.Inquiries
                        ];
                        for (const arr of candidates) {
                          if (Array.isArray(arr) && arr.length) return arr;
                        }
                        return [];
                      })();

                      // Normalize bureau for varying shapes and identifiers
                      const normalizeBureau = (inq: any): 'tu' | 'ex' | 'eq' | null => {
                        const id = Number(inq?.BureauId ?? inq?.bureauId ?? inq?.bureau_id);
                        // Prefer textual mapping when available due to inconsistent ID↔bureau mappings across code paths
                        const rawText = (inq?.bureau || inq?.Bureau || inq?.bureauName || inq?.BureauName || '').toString().toLowerCase();
                        if (rawText) {
                          if (/^tu$|trans\s*union|^tru$/.test(rawText)) return 'tu';
                          if (/^ex$|exper/.test(rawText)) return 'ex';
                          if (/^eq$|equifax|eqf/.test(rawText)) return 'eq';
                        }
                        // Fall back to ID mapping used elsewhere in this file: 1=TU, 2=EQ, 3=EX
                        if (id === 1) return 'tu';
                        if (id === 2) return 'eq';
                        if (id === 3) return 'ex';
                        return null;
                      };

                      // Extract inquiry date in a tolerant way
                      const getInquiryDateStr = (inq: any): string | undefined => {
                        return (
                          inq?.dateOfInquiry ??
                          inq?.DateInquiry ??
                          inq?.date ??
                          inq?.InquiryDate ??
                          inq?.Date
                        );
                      };

                      const parseInquiryDate = (s: string): Date => {
                        // Try native parse first
                        let d = new Date(s);
                        if (!isNaN(d.getTime())) return d;
                        // YYYYMMDD
                        const ymd = s.match(/^([0-9]{4})([0-9]{2})([0-9]{2})$/);
                        if (ymd) {
                          d = new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}`);
                          if (!isNaN(d.getTime())) return d;
                        }
                        // MM/DD/YYYY
                        const mdy = s.match(/^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/);
                        if (mdy) {
                          const mm = mdy[1].padStart(2, '0');
                          const dd = mdy[2].padStart(2, '0');
                          d = new Date(`${mdy[3]}-${mm}-${dd}`);
                          if (!isNaN(d.getTime())) return d;
                        }
                        return new Date(NaN);
                      };

                      const isHardInquiry = (inq: any): boolean => {
                        const t = (inq?.InquiryType ?? inq?.inquiryType ?? inq?.type ?? '').toString().toLowerCase();
                        // API uses 'I' for hard; transformed data uses 'Hard' string
                        return t === 'i' || /hard/.test(t);
                      };

                      // Count total inquiries for a given bureau (no time window)
                      const recentInquiryCount = (bureau: 'tu' | 'ex' | 'eq'): number => {
                        return inquiriesList.filter((inq) => {
                          const b = normalizeBureau(inq);
                          if (b !== bureau) return false;
                          return true;
                        }).length;
                      };

                      return (
                        <>
                    <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.score700Plus || false,
                      reportData?.qualificationCriteria?.[3]?.score700Plus || false,
                      reportData?.qualificationCriteria?.[2]?.score700Plus || false
                    )}`}>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[1]?.score700Plus ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[3]?.score700Plus ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[2]?.score700Plus ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="py-2 px-4">
                        {(() => {
                          const tu700 = Boolean(reportData?.qualificationCriteria?.[1]?.score700Plus);
                          const ex700 = Boolean(reportData?.qualificationCriteria?.[3]?.score700Plus);
                          const eq700 = Boolean(reportData?.qualificationCriteria?.[2]?.score700Plus);

                          const tu730 = Boolean(reportData?.qualificationCriteria?.[1]?.score730Plus);
                          const ex730 = Boolean(reportData?.qualificationCriteria?.[3]?.score730Plus);
                          const eq730 = Boolean(reportData?.qualificationCriteria?.[2]?.score730Plus);

                          const all730 = tu730 && ex730 && eq730;
                          const all700 = tu700 && ex700 && eq700;

                          if (all730) return 'Your score is 730+ — apply for personal and business both';
                          if (all700) return 'Your score is 700+ — can apply for personal funding only';
                          return 'Your score is under 700 — 700+ credit score with all three consumer credit bureaus';
                        })()}
                      </td>
                    </tr>
                    <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[3]?.openRevolvingUnder30 || false,
                      reportData?.qualificationCriteria?.[2]?.openRevolvingUnder30 || false
                    )}`}>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[1]?.openRevolvingUnder30 ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[3]?.openRevolvingUnder30 ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[2]?.openRevolvingUnder30 ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="py-2 px-4">Under 30% utilization on open revolving accounts</td>
                    </tr>
                    <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.minFiveOpenRevolving || false,
                      reportData?.qualificationCriteria?.[3]?.minFiveOpenRevolving || false,
                      reportData?.qualificationCriteria?.[2]?.minFiveOpenRevolving || false
                    )}`}>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[1]?.minFiveOpenRevolving ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[3]?.minFiveOpenRevolving ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[2]?.minFiveOpenRevolving ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="py-2 px-4">minimum five open primary credit cards with two years of good payment history.</td>
                    </tr>
                    <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.creditCard3YearsOld5KLimit || false,
                      reportData?.qualificationCriteria?.[3]?.creditCard3YearsOld5KLimit || false,
                      reportData?.qualificationCriteria?.[2]?.creditCard3YearsOld5KLimit || false
                    )}`}>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[1]?.creditCard3YearsOld5KLimit ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[3]?.creditCard3YearsOld5KLimit ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[2]?.creditCard3YearsOld5KLimit ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="py-2 px-4">Three primary credit cards with at least three years of age and $5,000+ limits.</td>
                    </tr>
                    <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.maxFourUnsecuredIn12Months || false,
                      reportData?.qualificationCriteria?.[3]?.maxFourUnsecuredIn12Months || false,
                      reportData?.qualificationCriteria?.[2]?.maxFourUnsecuredIn12Months || false
                    )}`}>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[1]?.maxFourUnsecuredIn12Months ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[3]?.maxFourUnsecuredIn12Months ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[2]?.maxFourUnsecuredIn12Months ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="py-2 px-4">No more than 4 unsecured accounts open in the past 12 months</td>
                    </tr>
                    <tr className={`border-b transition-colors ${(() => {
                      const tuCount = recentInquiryCount('tu');
                      const exCount = recentInquiryCount('ex');
                      const eqCount = recentInquiryCount('eq');
                      return getRowBgColor(tuCount < 4, exCount < 4, eqCount < 4);
                    })()}`}>
                      <td className="text-center py-2 px-4">
                        {(() => {
                          const count = recentInquiryCount('tu');
                          return count < 4 
                            ? <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> 
                            : <span className="font-bold">{count}</span>;
                        })()}
                      </td>
                      <td className="text-center py-2 px-4">
                        {(() => {
                          const count = recentInquiryCount('ex');
                          return count < 4 
                            ? <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> 
                            : <span className="font-bold">{count}</span>;
                        })()}
                      </td>
                      <td className="text-center py-2 px-4">
                        {(() => {
                          const count = recentInquiryCount('eq');
                          return count < 4 
                            ? <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> 
                            : <span className="font-bold">{count}</span>;
                        })()}
                      </td>
                      <td className="py-2 px-4">Under 4 inquiries (fundable on that bureau's cards)</td>
                    </tr>
                    <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.noCollections || false,
                      reportData?.qualificationCriteria?.[3]?.noCollections || false,
                      reportData?.qualificationCriteria?.[2]?.noCollections || false
                    )}`}>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[1]?.noCollections ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[3]?.noCollections ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[2]?.noCollections ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="py-2 px-4">Collections</td>
                    </tr>
                    <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.noChargeOffs || false,
                      reportData?.qualificationCriteria?.[3]?.noChargeOffs || false,
                      reportData?.qualificationCriteria?.[2]?.noChargeOffs || false
                    )}`}>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[1]?.noChargeOffs ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[3]?.noChargeOffs ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[2]?.noChargeOffs ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="py-2 px-4">Charge offs</td>
                    </tr>
                    <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.noLatePayments || false,
                      reportData?.qualificationCriteria?.[3]?.noLatePayments || false,
                      reportData?.qualificationCriteria?.[2]?.noLatePayments || false
                    )}`}>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[1]?.noLatePayments ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[3]?.noLatePayments ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[2]?.noLatePayments ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="py-2 px-4">Late payments (all time)</td>
                    </tr>
                    <tr className={`border-b transition-colors ${getRowBgColor(
                      reportData?.qualificationCriteria?.[1]?.noBankruptcies || false,
                      reportData?.qualificationCriteria?.[3]?.noBankruptcies || false,
                      reportData?.qualificationCriteria?.[2]?.noBankruptcies || false
                    )}`}>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[1]?.noBankruptcies ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[3]?.noBankruptcies ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="text-center py-2 px-4">
                        {reportData?.qualificationCriteria?.[2]?.noBankruptcies ? 
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" /> : 
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        }
                      </td>
                      <td className="py-2 px-4">Bankruptcy</td>
                    </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
          </CardContent>
          </Card>

          {(() => {
            // Underwriting eligibility helpers based on calculated qualification criteria
            const getCriteria = (bureau: number, key: string) => {
              return Boolean((reportData as any)?.qualificationCriteria?.[bureau]?.[key]);
            };

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

            // Eligibility: fundable if AT LEAST ONE bureau satisfies ALL criteria
            const flagGroups = Object.values(criteriaFlags);
            const perBureauEligible = [0, 1, 2].map((i) => flagGroups.every((group) => group[i]));
            const isFundingEligibleLocal = perBureauEligible.some(Boolean);
            // Prefer local eligibility if it passes, otherwise use server-provided flag if true
            const effectiveEligible = Boolean(isFundingEligible) || isFundingEligibleLocal;
            // Retain the original count summary for non-eligible case (all-bureau groups)
            const criteriaMetCount = Object.values(criteriaFlags).reduce((acc, flags) => acc + (flags.every(Boolean) ? 1 : 0), 0);
            const criteriaTotal = Object.values(criteriaFlags).length;

            return (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800">Next Steps</CardTitle>
                  <CardDescription>
                    {effectiveEligible
                      ? "You meet the underwriting criteria. Proceed to funding."
                      : `You meet ${criteriaMetCount} of ${criteriaTotal} criteria. Improve remaining items to qualify.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {effectiveEligible ? (
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle2 className="h-5 w-5" />
                        Qualified for funding
                      </div>
                      <Button onClick={() => setActiveTab('fundingApplications')} className="bg-green-600 hover:bg-green-700">
                        Go to Funding
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-700 font-medium">
                        <AlertCircle className="h-5 w-5" />
                        Not quite eligible yet
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(CREDIT_REPAIR_URL, '_blank')}>
                          Go to Credit Repair
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Debt Utilization Table */}
          <Card id="uw-debt-utilization" className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Debt Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-left font-semibold text-gray-700 py-3 px-4"></TableHead>
                      <TableHead className="text-center font-semibold text-blue-600 py-3 px-4">TU</TableHead>
                      <TableHead className="text-center font-semibold text-green-600 py-3 px-4">EX</TableHead>
                      <TableHead className="text-center font-semibold text-purple-600 py-3 px-4">EQ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const debtData = getDebtUtilizationData();
                      return (
                        <>
                          {/* Total Balance Utilization (Open Revolving) */}
                          <TableRow className="border-b bg-purple-50/30">
                            <TableCell className="font-medium text-gray-700 py-3 px-4">Total Balance Utilization (Open Revolving):</TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-blue-600">
                              ${debtData[1]?.openRevolvingBalance?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-green-600">
                              ${debtData[3]?.openRevolvingBalance?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-purple-600">
                              ${debtData[2]?.openRevolvingBalance?.toLocaleString() || '0'}
                            </TableCell>
                          </TableRow>

                          {/* Total Credit Limit (Open Revolving) */}
                          <TableRow className="border-b">
                            <TableCell className="font-medium text-gray-700 py-3 px-4">Total Credit Limit (Open Revolving):</TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-blue-600">
                              ${debtData[1]?.openRevolvingLimit?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-green-600">
                              ${debtData[3]?.openRevolvingLimit?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-purple-600">
                              ${debtData[2]?.openRevolvingLimit?.toLocaleString() || '0'}
                            </TableCell>
                          </TableRow>

                          {/* Percent Utilization (Open Revolving) */}
                          <TableRow className="border-b bg-blue-50/30">
                            <TableCell className="font-medium text-gray-700 py-3 px-4">Percent Utilization (Open Revolving):</TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-blue-600">
                              {debtData[1]?.openRevolvingLimit > 0 ? 
                                `${((debtData[1]?.openRevolvingBalance / debtData[1]?.openRevolvingLimit) * 100).toFixed(1)}%` : 
                                '0.0%'
                              }
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-green-600">
                              {debtData[3]?.openRevolvingLimit > 0 ? 
                                `${((debtData[3]?.openRevolvingBalance / debtData[3]?.openRevolvingLimit) * 100).toFixed(1)}%` : 
                                '0.0%'
                              }
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-purple-600">
                              {debtData[2]?.openRevolvingLimit > 0 ? 
                                `${((debtData[2]?.openRevolvingBalance / debtData[2]?.openRevolvingLimit) * 100).toFixed(1)}%` : 
                                '0.0%'
                              }
                            </TableCell>
                          </TableRow>

                          {/* Total Balance Utilization (All Revolving) */}
                          <TableRow className="border-b">
                            <TableCell className="font-medium text-gray-700 py-3 px-4">Total Balance Utilization (All Revolving):</TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-blue-600">
                              ${debtData[1]?.allRevolvingBalance?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-green-600">
                              ${debtData[3]?.allRevolvingBalance?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-purple-600">
                              ${debtData[2]?.allRevolvingBalance?.toLocaleString() || '0'}
                            </TableCell>
                          </TableRow>

                          {/* Total Credit Limit (All Revolving) */}
                          <TableRow className="border-b bg-green-50/30">
                            <TableCell className="font-medium text-gray-700 py-3 px-4">Total Credit Limit (All Revolving):</TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-blue-600">
                              ${debtData[1]?.allRevolvingLimit?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-green-600">
                              ${debtData[3]?.allRevolvingLimit?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-purple-600">
                              ${debtData[2]?.allRevolvingLimit?.toLocaleString() || '0'}
                            </TableCell>
                          </TableRow>

                          {/* Percent Utilization (All Revolving) */}
                          <TableRow className="border-b">
                            <TableCell className="font-medium text-gray-700 py-3 px-4">Percent Utilization (All Revolving):</TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-blue-600">
                              {debtData[1]?.allRevolvingLimit > 0 ? 
                                `${((debtData[1]?.allRevolvingBalance / debtData[1]?.allRevolvingLimit) * 100).toFixed(1)}%` : 
                                '0.0%'
                              }
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-green-600">
                              {debtData[3]?.allRevolvingLimit > 0 ? 
                                `${((debtData[3]?.allRevolvingBalance / debtData[3]?.allRevolvingLimit) * 100).toFixed(1)}%` : 
                                '0.0%'
                              }
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-purple-600">
                              {debtData[2]?.allRevolvingLimit > 0 ? 
                                `${((debtData[2]?.allRevolvingBalance / debtData[2]?.allRevolvingLimit) * 100).toFixed(1)}%` : 
                                '0.0%'
                              }
                            </TableCell>
                          </TableRow>

                          {/* Real Estate Debt */}
                          <TableRow className="border-b bg-yellow-50/30">
                            <TableCell className="font-medium text-gray-700 py-3 px-4">Real Estate Debt:</TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-blue-600">
                              ${debtData[1]?.realEstateDebt?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-green-600">
                              ${debtData[3]?.realEstateDebt?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-purple-600">
                              ${debtData[2]?.realEstateDebt?.toLocaleString() || '0'}
                            </TableCell>
                          </TableRow>

                          {/* Installment Debt */}
                          <TableRow className="border-b">
                            <TableCell className="font-medium text-gray-700 py-3 px-4">Installment Debt:</TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-blue-600">
                              ${debtData[1]?.installmentDebt?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-green-600">
                              ${debtData[3]?.installmentDebt?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-center py-3 px-4 font-semibold text-purple-600">
                              ${debtData[2]?.installmentDebt?.toLocaleString() || '0'}
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Accounts impeding your eligibility */}
          <Card id="uw-accounts-impeding" className={`border-0 shadow-xl bg-gradient-to-br ${
            eligibilityBureau === 'tu' ? 'from-white via-purple-50/30 to-violet-100/50' :
            eligibilityBureau === 'ex' ? 'from-white via-green-50/30 to-emerald-100/50' :
            eligibilityBureau === 'eq' ? 'from-white via-red-50/30 to-rose-100/50' :
            'from-white via-red-50/30 to-pink-50/50'
          } scroll-mt-24`}>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Negetive Accounts Impacting Your Qualification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <ToggleGroup
                  type="single"
                  value={eligibilityBureau}
                  onValueChange={(val) => setEligibilityBureau((val as any) || 'all')}
                  className="mr-4"
                >
                  <ToggleGroupItem value="all" className="px-3 py-1 text-sm">
                    <div className="flex items-center gap-1">
                      <img src="/TransUnion_logo.svg.png" alt="TU" className="h-4 w-auto" />
                      <img src="/Experian_logo.svg.png" alt="EX" className="h-4 w-auto" />
                      <img src="/Equifax_Logo.svg.png" alt="EQ" className="h-4 w-auto" />
                    </div>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="tu" className="px-3 py-1 text-sm data-[state=on]:bg-purple-600 data-[state=on]:text-white">
                    <img src="/TransUnion_logo.svg.png" alt="TransUnion" className="h-5 w-auto" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="ex" className="px-3 py-1 text-sm data-[state=on]:bg-green-600 data-[state=on]:text-white">
                    <img src="/Experian_logo.svg.png" alt="Experian" className="h-5 w-auto" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="eq" className="px-3 py-1 text-sm data-[state=on]:bg-red-600 data-[state=on]:text-white">
                    <img src="/Equifax_Logo.svg.png" alt="Equifax" className="h-5 w-auto" />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Input placeholder="Search:" className="max-w-sm" />
              </div>

              {eligibilityBureau !== 'all' && (
                <div className="flex justify-center mb-4">
                  <div
                    className={`p-3 bg-white rounded-xl shadow-md border ${
                      eligibilityBureau === 'tu'
                        ? 'border-purple-100/50'
                        : eligibilityBureau === 'ex'
                        ? 'border-green-100/50'
                        : 'border-red-100/50'
                    }`}
                  >
                    {eligibilityBureau === 'tu' && (
                      <img src="/TransUnion_logo.svg.png" alt="TransUnion" className="h-8 w-auto" />
                    )}
                    {eligibilityBureau === 'ex' && (
                      <img src="/Experian_logo.svg.png" alt="Experian" className="h-8 w-auto" />
                    )}
                    {eligibilityBureau === 'eq' && (
                      <img src="/Equifax_Logo.svg.png" alt="Equifax" className="h-8 w-auto" />
                    )}
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Worst Payment Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiData?.Accounts?.filter(account => {
                      // Bureau filter: match selected tab (ALL, TU, EX, EQ)
                      const matchesBureau =
                        eligibilityBureau === 'all' ||
                        (eligibilityBureau === 'tu' && account.BureauId === 1) ||
                        (eligibilityBureau === 'ex' && account.BureauId === 2) ||
                        (eligibilityBureau === 'eq' && account.BureauId === 3);
                      if (!matchesBureau) return false;

                      // Strict derogatory filter: include only accounts with clearly negative indicators
                      const status = (account.PaymentStatus || '').toLowerCase();
                      const worst = (account.WorstPayStatus || '').toLowerCase();
                      const typeDesc = (account.AccountTypeDescription || '').toLowerCase();
                      const creditor = (account.CreditorName || '').toLowerCase();
                      const accountStatus = (account.AccountStatus || '').toLowerCase();
                      const remark = (account.Remark || '').toLowerCase();

                      const textBlobs = [status, worst, typeDesc, creditor, accountStatus, remark];
                      const derogKeywords = [
                        'charge off', 'collection', 'late', 'past due', 'delinquent', 'default',
                        'overdue', 'repossession', 'foreclosure', 'judgment', 'garnishment',
                        'settlement', 'negative', 'derogatory'
                      ];

                      const hasDerogKeyword = textBlobs.some(t => derogKeywords.some(k => t.includes(k)));
                      const hasNumericLate = /(\b120\b|\b90\b|\b60\b|\b30\b)/.test(status) || /(\b120\b|\b90\b|\b60\b|\b30\b)/.test(worst);

                      const isChargeOff = accountStatus.includes('charge off') || status.includes('charge off');
                      const isCollection = typeDesc.includes('collection') || creditor.includes('collection');

                      const amountPastDue = parseFloat((account as any).AmountPastDue || '0');
                      const isPastDue = amountPastDue > 0;

                      return hasDerogKeyword || hasNumericLate || isChargeOff || isCollection || isPastDue;
                    }).map((account, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="text-center">
                          {account.BureauId === 1 ? (
                            <img src="/TransUnion_logo.svg.png" alt="TransUnion" className="h-5 w-auto mx-auto" />
                          ) : account.BureauId === 2 ? (
                            <img src="/Experian_logo.svg.png" alt="Experian" className="h-5 w-auto mx-auto" />
                          ) : account.BureauId === 3 ? (
                            <img src="/Equifax_Logo.svg.png" alt="Equifax" className="h-5 w-auto mx-auto" />
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>{account.AccountTypeDescription || account.AccountType || 'N/A'}</TableCell>
                        <TableCell>{account.CreditorName || 'N/A'}</TableCell>
                        <TableCell>{account.AccountNumber ? `**${account.AccountNumber.slice(-4)}` : 'N/A'}</TableCell>
                        <TableCell>{account.PaymentStatus || 'N/A'}</TableCell>
                        <TableCell>
                          {(() => {
                            // Robust detection for Collection/Chargeoff across multiple fields and formats
                            const candidates = [
                              account.WorstPayStatus,
                              account.PaymentStatus,
                              account.AccountStatus,
                              account.AccountTypeDescription || account.AccountType,
                              account.Remark,
                            ].map(v => (v || '').toString().toLowerCase());

                            const normalized = candidates.map(s => s.replace(/[\s\-\/]/g, ''));

                            const isCollectionOrChargeOff =
                              normalized.some(s => s.includes('collectionchargeoff') || s.includes('chargeoff')) ||
                              candidates.some(s => s.includes('collection')) ||
                              candidates.some(s => s.includes('charge off') || s.includes('charge-off'));

                            if (isCollectionOrChargeOff) return 'Collection/Chargeoff';

                            const s = (account.WorstPayStatus || account.PaymentStatus || '').toString().toLowerCase();
                            if (/\b120\b/.test(s)) return '120 Days Late';
                            if (/\b90\b/.test(s)) return '90 Days Late';
                            if (/\b60\b/.test(s)) return '60 Days Late';
                            if (/\b30\b/.test(s)) return '30 Days Late';
                            if (s.includes('past due')) return 'Past Due';
                            if (s.includes('delinquent')) return 'Delinquent';
                            if (s.includes('default')) return 'Default';
                            if (s.includes('late')) return 'Late';
                            return 'N/A';
                          })()}
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No accounts impeding eligibility found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Inquiries impeding your eligibility */}
          <Card id="uw-inquiries-impeding" className="border-0 shadow-xl bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/50 scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Inquiries lowering your chances of approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input placeholder="Search:" className="max-w-sm" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Creditor</TableHead>
                      <TableHead>Date of Inquiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const normalizeBureau = (inq: any) => {
                        const raw = inq?.bureau ?? inq?.Bureau ?? inq?.BureauName ?? inq?.bureauName ?? inq?.BureauId;
                        if (typeof raw === 'number' && !Number.isNaN(raw)) {
                          // Prefer mapping consistent with this page’s data shape: 1=TU, 2=EX, 3=EQ
                          if (raw === 1) return 'tu';
                          if (raw === 2) return 'ex';
                          if (raw === 3) return 'eq';
                          return 'unknown';
                        }
                        const s = String(raw || '').toLowerCase();
                        if (/\btu\b|trans[-\s]?union/.test(s)) return 'tu';
                        if (/\bex\b|experian|xpn/.test(s)) return 'ex';
                        if (/\beq\b|equifax|eqf/.test(s)) return 'eq';
                        const c = String(inq?.creditorName || inq?.company || inq?.CreditorName || '').toLowerCase();
                        if (/experian|xpn/.test(c)) return 'ex';
                        if (/trans\s*union/.test(c)) return 'tu';
                        if (/equifax|eqf/.test(c)) return 'eq';
                        return 'unknown';
                      };
                      const orderIndex = (inq: any) => {
                        const n = normalizeBureau(inq);
                        if (n === 'tu') return 0;
                        if (n === 'ex') return 1;
                        if (n === 'eq') return 2;
                        return 3;
                      };

                      const arr = (reportData?.inquiries || []);
                      if (arr.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              No inquiries found
                            </TableCell>
                          </TableRow>
                        );
                      }
                      const sorted = arr.slice().sort((a: any, b: any) => orderIndex(a) - orderIndex(b));
                      return sorted.map((inquiry: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {(() => {
                              const raw = inquiry?.bureau ?? inquiry?.Bureau ?? inquiry?.BureauName ?? inquiry?.bureauName ?? inquiry?.BureauId;
                              let src = '';
                              let alt = '';

                              if (typeof raw === 'number' && !Number.isNaN(raw)) {
                                if (raw === 1) { src = '/TransUnion_logo.svg.png'; alt = 'TransUnion'; }
                                else if (raw === 2) { src = '/Experian_logo.svg.png'; alt = 'Experian'; }
                                else if (raw === 3) { src = '/Equifax_Logo.svg.png'; alt = 'Equifax'; }
                              } else {
                                const s = String(raw || '').toLowerCase();
                                if (/\btu\b|trans[-\s]?union/.test(s)) { src = '/TransUnion_logo.svg.png'; alt = 'TransUnion'; }
                                else if (/\bex\b|experian|xpn/.test(s)) { src = '/Experian_logo.svg.png'; alt = 'Experian'; }
                                else if (/\beq\b|equifax|eqf/.test(s)) { src = '/Equifax_Logo.svg.png'; alt = 'Equifax'; }
                                else {
                                  const c = String(inquiry?.creditorName || inquiry?.company || inquiry?.CreditorName || '').toLowerCase();
                                  if (/experian|xpn/.test(c)) { src = '/Experian_logo.svg.png'; alt = 'Experian'; }
                                  else if (/trans\s*union/.test(c)) { src = '/TransUnion_logo.svg.png'; alt = 'TransUnion'; }
                                  else if (/equifax|eqf/.test(c)) { src = '/Equifax_Logo.svg.png'; alt = 'Equifax'; }
                                }
                              }

                              return src ? (
                                <img src={src} alt={alt || 'Bureau'} className="h-6 w-auto" />
                              ) : (
                                <span className="text-gray-700">{inquiry?.bureau || 'Unknown'}</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>{inquiry.creditorName}</TableCell>
                          <TableCell>
                            {(() => {
                              const d = inquiry?.dateOfInquiry || inquiry?.date || inquiry?.DateInquiry;
                              return d ? new Date(d).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                              }) : 'N/A';
                            })()}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pay Down */}
          <Card id="uw-paydown" className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/50 scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Pay Down</CardTitle>
              <CardDescription>Payments needed to reach target utilization levels</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Include additional target utilization columns after 20%
                const targets = [30, 25, 20, 15, 10, 5, 0];
                const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
                const formatPercent = (n: number) => `${Math.round(n)}%`;

                // Helpers to compute account age
                const parseDate = (dateLike: any): Date | null => {
                  if (!dateLike) return null;
                  const d = new Date(String(dateLike));
                  return Number.isNaN(d.getTime()) ? null : d;
                };

                const getAccountAge = (dateLike: any): { years: number; months: number; totalMonths: number } => {
                  const opened = parseDate(dateLike);
                  if (!opened) return { years: 0, months: 0, totalMonths: 0 };
                  const now = new Date();
                  let months = (now.getFullYear() - opened.getFullYear()) * 12 + (now.getMonth() - opened.getMonth());
                  // Adjust month diff if current day is earlier than opened day
                  if (now.getDate() < opened.getDate()) months -= 1;
                  months = Math.max(0, months);
                  return { years: Math.floor(months / 12), months: months % 12, totalMonths: months };
                };

                const formatAge = (dateLike: any): string => {
                  const { years, months, totalMonths } = getAccountAge(dateLike);
                  if (totalMonths <= 0) return 'N/A';
                  const y = years ? `${years} ${years === 1 ? 'year' : 'years'}` : '';
                  const m = months ? `${months} ${months === 1 ? 'month' : 'months'}` : '';
                  return [y, m].filter(Boolean).join(', ');
                };

                const apiAccounts = (apiData as any)?.reportData?.reportData?.Accounts;
                const sampleAccounts = (reportData as any)?.accounts;

                let accounts: Array<{ creditor: string; accountNumber?: string; limit: number; balance: number; opened?: any }> = [];

                if (Array.isArray(apiAccounts) && apiAccounts.length > 0) {
                  accounts = apiAccounts
                    .filter((acc: any) =>
                      (acc.CreditType === 'Revolving Account' || acc.AccountTypeDescription === 'Revolving Account') &&
                      ((parseFloat(acc.CreditLimit) || parseFloat(acc.HighBalance) || 0) > 0)
                    )
                    .map((acc: any) => ({
                      creditor: acc.CreditorName || acc.Creditor || '—',
                      accountNumber: acc.AccountNumber || acc.MaskAccountNumber,
                      limit: parseFloat(acc.CreditLimit) || parseFloat(acc.HighBalance) || 0,
                      balance: parseFloat(acc.CurrentBalance) || 0,
                      opened: acc.DateOpened || acc.DateReported || acc.OpenDate || acc.dateOpened
                    }));
                } else if (Array.isArray(sampleAccounts) && sampleAccounts.length > 0) {
                  accounts = sampleAccounts
                    .filter((acc: any) => {
                      const isRevolving = acc.accountType === 'Revolving' || acc.type === 'Credit Card' || acc.type === 'Line of Credit';
                      const limit = acc.creditLimit ?? acc.limit;
                      return isRevolving && (Number(limit) || 0) > 0;
                    })
                    .map((acc: any) => ({
                      creditor: acc.creditorName || acc.creditor || '—',
                      accountNumber: acc.accountNumber,
                      limit: Number(acc.creditLimit ?? acc.limit ?? 0),
                      balance: Number(acc.balance ?? 0),
                      opened: acc.opened || acc.dateOpened
                    }));
                }

                if (!accounts.length) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      No revolving accounts found to compute paydown.
                    </div>
                  );
                }

                // Apply sorting:
                // 1) Primary: Highest utilization %
                // 2) Secondary: Highest balance (for equal utilization)
                // 3) Tertiary: Account age (for accounts with zero utilization)
                const sortedAccounts = accounts.slice().sort((a, b) => {
                  const utilA = a.limit > 0 ? (a.balance / a.limit) * 100 : 0;
                  const utilB = b.limit > 0 ? (b.balance / b.limit) * 100 : 0;
                  if (utilA !== utilB) return utilB - utilA; // Desc by utilization
                  if (utilA > 0 || utilB > 0) {
                    // Secondary: balance desc when utilization is equal and > 0
                    return b.balance - a.balance;
                  }
                  // Tertiary: account age desc (older first) when utilization is 0
                  const ageA = getAccountAge(a.opened).totalMonths;
                  const ageB = getAccountAge(b.opened).totalMonths;
                  return ageB - ageA;
                });

                return (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Limit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead className="text-right">Utilization</TableHead>
                          <TableHead className="text-right">Account Age</TableHead>
                          {targets.map((t) => (
                            <TableHead key={t} className="text-right">To {t}%</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedAccounts.map((acc, idx) => {
                          const util = acc.limit > 0 ? (acc.balance / acc.limit) * 100 : 0;
                          const rowAccent =
                            util >= 80 ? 'hover:bg-red-50/40' :
                            util >= 60 ? 'hover:bg-orange-50/40' :
                            util >= 40 ? 'hover:bg-yellow-50/40' :
                            util > 0  ? 'hover:bg-green-50/40' : 'hover:bg-gray-50/40';

                          const utilStyles =
                            util >= 80 ? 'bg-red-50 text-red-700' :
                            util >= 60 ? 'bg-orange-50 text-orange-700' :
                            util >= 40 ? 'bg-yellow-50 text-yellow-700' :
                            util > 0  ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600';

                          return (
                            <TableRow
                              key={idx}
                              className={`cursor-pointer transition-colors ${rowAccent}`}
                              onClick={() => {
                                setSelectedPaydownAccount(acc);
                                // Pick an initial target based on current utilization (default to 30%)
                                const initialUtil = acc.limit > 0 ? (acc.balance / acc.limit) * 100 : 0;
                                const suggestedTarget = initialUtil >= 30 ? 30 : 10;
                                setSelectedTarget(suggestedTarget);
                                setPaydownDialogOpen(true);
                              }}
                            >
                              <TableCell>
                                <div className="font-medium text-gray-800">{acc.creditor}</div>
                                <div className="text-xs text-muted-foreground">{acc.accountNumber || ''}</div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-blue-700">{formatCurrency(acc.limit)}</TableCell>
                              <TableCell className="text-right font-semibold text-purple-700">{formatCurrency(acc.balance)}</TableCell>
                              <TableCell className={`text-right font-semibold rounded-md px-2 ${utilStyles}`}>{formatPercent(util)}</TableCell>
                              <TableCell className="text-right text-slate-700">{formatAge(acc.opened)}</TableCell>
                              {targets.map((t) => {
                                const targetBal = Math.round(acc.limit * (t / 100));
                                const payment = Math.max(0, Math.round(acc.balance - targetBal));
                                const paymentRatio = acc.balance > 0 ? payment / acc.balance : 0;
                                const paymentStyles =
                                  payment === 0 ? 'bg-green-50 text-green-700' :
                                  paymentRatio <= 0.10 ? 'bg-lime-50 text-lime-700' :
                                  paymentRatio <= 0.25 ? 'bg-yellow-50 text-yellow-700' :
                                  paymentRatio <= 0.50 ? 'bg-orange-50 text-orange-700' :
                                  'bg-red-50 text-red-700';
                                return (
                                  <TableCell key={t} className={`text-right rounded-md px-2 ${paymentStyles}`}>
                                    {formatCurrency(payment)}
                                    <div className="text-[11px] opacity-80">→ target {formatCurrency(targetBal)}</div>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          {/* Pay Down Plan Modal */}
          <Dialog
            open={paydownDialogOpen}
            onOpenChange={(open) => {
              setPaydownDialogOpen(open);
              if (!open) setSelectedPaydownAccount(null);
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Paydown Plan — {selectedPaydownAccount?.creditor || 'Account'}
                </DialogTitle>
                <DialogDescription>
                  Detailed, step-by-step plan to reach your target utilization.
                </DialogDescription>
              </DialogHeader>
              {selectedPaydownAccount ? (
                <div className="space-y-6">
                  {(() => {
                    const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
                    const formatPercent = (n: number) => `${Math.round(n)}%`;
                    const limit = Number(selectedPaydownAccount.limit || 0);
                    const balance = Number(selectedPaydownAccount.balance || 0);
                    const util = limit > 0 ? (balance / limit) * 100 : 0;
                    const targetBal = Math.round(limit * (selectedTarget / 100));
                    const payment = Math.max(0, Math.round(balance - targetBal));
                    const weekly = Math.round(payment / 52);
                    const monthly = Math.round(payment / 12);
                    const yearly = payment;
                    return (
                      <>
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Limit</div>
                            <div className="font-semibold text-blue-700">{formatCurrency(limit)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Balance</div>
                            <div className="font-semibold text-purple-700">{formatCurrency(balance)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Current Utilization</div>
                            <div className="font-semibold">{formatPercent(util)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Account</div>
                            <div className="font-semibold text-gray-800">{selectedPaydownAccount.creditor}</div>
                            <div className="text-xs text-muted-foreground">{selectedPaydownAccount.accountNumber || ''}</div>
                          </div>
                        </div>

                        {/* Target selector */}
                        <div className="space-y-2">
                          <Label>Target Utilization</Label>
                          <Select value={String(selectedTarget)} onValueChange={(v) => setSelectedTarget(Number(v))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose target utilization" />
                            </SelectTrigger>
                            <SelectContent>
                              {paydownTargets.map((t) => (
                                <SelectItem key={t} value={String(t)}>Target {t}%</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-muted-foreground">
                            To reach {selectedTarget}% you need to pay down {formatCurrency(payment)} (target balance {formatCurrency(targetBal)}).
                          </div>
                        </div>

                        {/* Payment targets */}
                        <div className="space-y-3">
                          <div className="font-medium">Payment Targets</div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-md bg-slate-50 border p-3">
                              <div className="text-xs text-muted-foreground">Weekly (52 weeks)</div>
                              <div className="font-semibold text-emerald-700">{formatCurrency(weekly)}</div>
                            </div>
                            <div className="rounded-md bg-slate-50 border p-3">
                              <div className="text-xs text-muted-foreground">Monthly (12 months)</div>
                              <div className="font-semibold text-indigo-700">{formatCurrency(monthly)}</div>
                            </div>
                            <div className="rounded-md bg-slate-50 border p-3">
                              <div className="text-xs text-muted-foreground">Yearly (total)</div>
                              <div className="font-semibold text-rose-700">{formatCurrency(yearly)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Step-by-step plan */}
                        <div className="space-y-2">
                          <div className="font-medium">Step-by-Step Plan</div>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            <li>Choose your target utilization ({selectedTarget}%).</li>
                            <li>Set your schedule: weekly or monthly payments.</li>
                            <li>Pay {formatCurrency(weekly)} per week or {formatCurrency(monthly)} per month until {formatCurrency(payment)} is completed.</li>
                            <li>Keep new charges low to maintain target utilization.</li>
                          </ol>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" onClick={() => setPaydownDialogOpen(false)}>Close</Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Select an account row to view the plan.</div>
              )}
            </DialogContent>
          </Dialog>
        
      {/* Funding Application Modal */}
      <Dialog open={showFundingModal} onOpenChange={setShowFundingModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {fundingType === 'personal' ? 'Personal' : 'Business'} Funding Application
            </DialogTitle>
          </DialogHeader>

          {!fundingOption ? (
            // Enhanced Funding Option Selection
            <div className="space-y-8 py-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <DollarSign className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Choose Your Funding Path
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                  Select the option that best fits your needs and let us help you secure the funding you deserve
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <Card 
                  className="cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 hover:border-blue-500 hover:scale-105 group relative overflow-hidden bg-gradient-to-br from-white to-blue-50"
                  onClick={() => {
                    navigate(`/funding/apply/${fundingType}`);
                    setShowFundingModal(false);
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-8 text-center relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-blue-700 transition-colors duration-300">Done For You</h4>
                    <p className="text-gray-600 text-base mb-6 leading-relaxed">
                      Our funding experts handle everything for you. Complete application assistance, document preparation, and personalized guidance throughout the entire process.
                    </p>
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-sm text-green-600 justify-center">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Expert application assistance</span>
                      </div>
                      <div className="flex items-center text-sm text-green-600 justify-center">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Document preparation help</span>
                      </div>
                      <div className="flex items-center text-sm text-green-600 justify-center">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Personalized guidance</span>
                      </div>
                      <div className="flex items-center text-sm text-green-600 justify-center">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Higher approval rates</span>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg">
                      <Star className="h-5 w-5 mr-2" />
                      Choose Premium Service
                    </Button>
                    <div className="mt-4 text-xs text-blue-600 font-medium">
                      ⭐ Most Popular Choice
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 hover:border-green-500 hover:scale-105 group relative overflow-hidden bg-gradient-to-br from-white to-green-50"
                  onClick={() => {
                    navigate(`/funding/diy/${fundingType}`, { state: { clientId: clientId ? Number(clientId) : undefined } });
                    setShowFundingModal(false);
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-8 text-center relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                      <FileText className="h-12 w-12 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-green-700 transition-colors duration-300">DIY Funding</h4>
                    <p className="text-gray-600 text-base mb-6 leading-relaxed">
                      Take control of your funding journey. Complete the application yourself with our comprehensive step-by-step guidance and resources.
                    </p>
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-sm text-green-600 justify-center">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Step-by-step guidance</span>
                      </div>
                      <div className="flex items-center text-sm text-green-600 justify-center">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Resource library access</span>
                      </div>
                      <div className="flex items-center text-sm text-green-600 justify-center">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Self-paced completion</span>
                      </div>
                      <div className="flex items-center text-sm text-green-600 justify-center">
                        <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>Complete control</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white font-semibold py-4 rounded-xl transition-all duration-300 text-lg hover:shadow-lg"
                      onClick={() => {
                        navigate(`/funding/diy/${fundingType}`, { state: { clientId: clientId ? Number(clientId) : undefined } });
                        setShowFundingModal(false);
                      }}
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      Choose Self-Service
                    </Button>
                    <div className="mt-4 text-xs text-green-600 font-medium">
                      💪 For Independent Users
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : fundingOption === 'diy' ? (
            // DIY Cards Display - Show appropriate component based on funding type
            fundingType === 'business' ? (
              <BusinessCardsDisplay onClose={() => setFundingOption(null)} />
            ) : (
              <PersonalCardsDisplay onClose={() => setFundingOption(null)} />
            )
          ) : (
            // Enhanced 4-Step Form (only show for Done For You option)
            fundingOption === 'done-for-you' && (
              <div className="space-y-8 py-6">
                {/* Enhanced Step Navigation with Progress Bar */}
                <div className="relative mb-12">
                  <div className="flex items-center justify-between mb-8">
                    {[
                      { step: 1, title: 'Business Info', icon: Building2, color: 'blue', description: 'Company details' },
                      { step: 2, title: 'Personal Info', icon: User, color: 'indigo', description: 'Guarantor details' },
                      { step: 3, title: 'Employment', icon: Building, color: 'purple', description: 'Work information' },
                      { step: 4, title: 'Financial', icon: DollarSign, color: 'green', description: 'Banking & credit' }
                    ].map((item, index) => {
                      const isActive = currentStep === item.step;
                      const isCompleted = currentStep > item.step;
                      const IconComponent = item.icon;
                      
                      return (
                        <div key={item.step} className="flex items-center relative">
                          <div className="flex flex-col items-center">
                            <div 
                              className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 shadow-lg ${
                                isCompleted 
                                  ? `bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 text-white ring-4 ring-${item.color}-200` 
                                  : isActive
                                  ? `bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 text-white ring-4 ring-${item.color}-300 animate-pulse`
                                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="h-10 w-10" />
                              ) : (
                                <IconComponent className="h-10 w-10" />
                              )}
                            </div>
                            <div className="mt-4 text-center">
                              <div className={`text-base font-bold transition-colors duration-300 ${
                                isActive || isCompleted ? `text-${item.color}-600` : 'text-gray-500'
                              }`}>
                                Step {item.step}
                              </div>
                              <div className={`text-sm font-semibold transition-colors duration-300 ${
                                isActive || isCompleted ? `text-${item.color}-600` : 'text-gray-400'
                              }`}>
                                {item.title}
                              </div>
                              <div className={`text-xs transition-colors duration-300 ${
                                isActive || isCompleted ? `text-${item.color}-500` : 'text-gray-400'
                              }`}>
                                {item.description}
                              </div>
                            </div>
                          </div>
                          {index < 3 && (
                            <div className="flex-1 mx-6 relative">
                              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ease-out ${
                                    currentStep > item.step 
                                      ? 'bg-gradient-to-r from-blue-500 to-green-500 w-full' 
                                      : 'bg-gray-200 w-0'
                                  }`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Overall Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-8 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                  </div>
                  
                  {/* Step Counter */}
                  <div className="text-center">
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
                      <div className="text-sm font-semibold text-gray-700">
                        Step {currentStep} of 4 • {Math.round((currentStep / 4) * 100)}% Complete
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Step 1: Business Information */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Business Information
                      </h3>
                      <p className="text-gray-600">Tell us about your business and funding needs</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="titlePosition" className="text-sm font-semibold text-gray-700 flex items-center">
                          <User className="h-4 w-4 mr-2 text-blue-500" />
                          Title / Position *
                        </Label>
                        <Input
                          id="titlePosition"
                          value={formData.titlePosition}
                          onChange={(e) => setFormData({...formData, titlePosition: e.target.value})}
                          placeholder="e.g., CEO, Owner, Manager"
                          className={`h-12 border-2 rounded-lg transition-all duration-300 hover:border-gray-300 ${
                            formErrors.titlePosition 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-200 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.titlePosition && (
                          <div className="flex items-center text-red-600 text-sm mt-1 animate-fadeIn">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.titlePosition}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fundingAmount" className="text-sm font-semibold text-gray-700 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                          Amount of Funding Requested *
                        </Label>
                        <Input
                          id="fundingAmount"
                          type="number"
                          value={formData.fundingAmount}
                          onChange={(e) => setFormData({...formData, fundingAmount: e.target.value})}
                          placeholder="$50,000"
                          className={`h-12 border-2 rounded-lg transition-all duration-300 hover:border-gray-300 ${
                            formErrors.fundingAmount 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-200 focus:border-green-500'
                          }`}
                        />
                        {formErrors.fundingAmount && (
                          <div className="flex items-center text-red-600 text-sm mt-1 animate-fadeIn">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.fundingAmount}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="intendedUse" className="text-sm font-semibold text-gray-700 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-purple-500" />
                        Intended Use of Funds *
                      </Label>
                      <Textarea
                        id="intendedUse"
                        value={formData.intendedUse}
                        onChange={(e) => setFormData({...formData, intendedUse: e.target.value})}
                        placeholder="Describe how you plan to use the funds (e.g., equipment purchase, inventory, expansion)"
                        className={`min-h-[100px] border-2 rounded-lg transition-all duration-300 hover:border-gray-300 resize-none ${
                          formErrors.intendedUse 
                            ? 'border-red-500 focus:border-red-500 bg-red-50' 
                            : 'border-gray-200 focus:border-purple-500'
                        }`}
                      />
                      {formErrors.intendedUse && (
                        <div className="flex items-center text-red-600 text-sm mt-1 animate-fadeIn">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.intendedUse}
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="businessName" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Building className="h-4 w-4 mr-2 text-indigo-500" />
                          Business Name *
                        </Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                          placeholder="Your Business Name LLC"
                          className={`h-12 border-2 rounded-lg transition-all duration-300 hover:border-gray-300 ${
                            formErrors.businessName 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-200 focus:border-indigo-500'
                          }`}
                        />
                        {formErrors.businessName && (
                          <div className="flex items-center text-red-600 text-sm mt-1 animate-fadeIn">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.businessName}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessPhone" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-blue-500" />
                          Business Phone *
                        </Label>
                        <Input
                          id="businessPhone"
                          value={formData.businessPhone}
                          onChange={(e) => setFormData({...formData, businessPhone: e.target.value})}
                          placeholder="(555) 123-4567"
                          className={`h-12 border-2 rounded-lg transition-all duration-300 hover:border-gray-300 ${
                            formErrors.businessPhone 
                              ? 'border-red-500 focus:border-red-500 bg-red-50' 
                              : 'border-gray-200 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.businessPhone && (
                          <div className="flex items-center text-red-600 text-sm mt-1 animate-fadeIn">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {formErrors.businessPhone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessEmail" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-red-500" />
                        Business Email *
                      </Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={formData.businessEmail}
                        onChange={(e) => setFormData({...formData, businessEmail: e.target.value})}
                        placeholder="business@company.com"
                        className={`h-12 border-2 rounded-lg transition-all duration-300 hover:border-gray-300 ${
                          formErrors.businessEmail 
                            ? 'border-red-500 focus:border-red-500 bg-red-50' 
                            : 'border-gray-200 focus:border-red-500'
                        }`}
                      />
                      {formErrors.businessEmail && (
                        <div className="flex items-center text-red-600 text-sm mt-1 animate-fadeIn">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.businessEmail}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessAddress" className="text-sm font-semibold text-gray-700 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                        Business Address *
                      </Label>
                      <Input
                        id="businessAddress"
                        value={formData.businessAddress}
                        onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                        placeholder="123 Business Street"
                        className={`h-12 border-2 rounded-lg transition-all duration-300 hover:border-gray-300 ${
                          formErrors.businessAddress 
                            ? 'border-red-500 focus:border-red-500 bg-red-50' 
                            : 'border-gray-200 focus:border-orange-500'
                        }`}
                      />
                      {formErrors.businessAddress && (
                        <div className="flex items-center text-red-600 text-sm mt-1 animate-fadeIn">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.businessAddress}
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-semibold text-gray-700 flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-teal-500" />
                          City *
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          placeholder="New York"
                          className="h-12 border-2 border-gray-200 focus:border-teal-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-semibold text-gray-700 flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                          State *
                        </Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({...formData, state: e.target.value})}
                          placeholder="NY"
                          className="h-12 border-2 border-gray-200 focus:border-cyan-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Hash className="h-4 w-4 mr-2 text-pink-500" />
                          ZIP *
                        </Label>
                        <Input
                          id="zip"
                          value={formData.zip}
                          onChange={(e) => setFormData({...formData, zip: e.target.value})}
                          placeholder="10001"
                          className="h-12 border-2 border-gray-200 focus:border-pink-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="dateCommenced" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-violet-500" />
                          Date Business Commenced *
                        </Label>
                        <Input
                          id="dateCommenced"
                          type="date"
                          value={formData.dateCommenced}
                          onChange={(e) => setFormData({...formData, dateCommenced: e.target.value})}
                          className="h-12 border-2 border-gray-200 focus:border-violet-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessWebsite" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-emerald-500" />
                          Business Website
                        </Label>
                        <Input
                          id="businessWebsite"
                          value={formData.businessWebsite}
                          onChange={(e) => setFormData({...formData, businessWebsite: e.target.value})}
                          placeholder="https://www.yourwebsite.com"
                          className="h-12 border-2 border-gray-200 focus:border-emerald-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="businessIndustry" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-amber-500" />
                          Business Industry *
                        </Label>
                        <Input
                          id="businessIndustry"
                          value={formData.businessIndustry}
                          onChange={(e) => setFormData({...formData, businessIndustry: e.target.value})}
                          placeholder="e.g., Technology, Retail, Healthcare"
                          className="h-12 border-2 border-gray-200 focus:border-amber-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entityType" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-rose-500" />
                          Entity Type *
                        </Label>
                        <Select value={formData.entityType} onValueChange={(value) => setFormData({...formData, entityType: value})}>
                          <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-rose-500 rounded-lg transition-all duration-300 hover:border-gray-300">
                            <SelectValue placeholder="Select entity type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LLC">LLC</SelectItem>
                            <SelectItem value="Corporation">Corporation</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                            <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="incorporationState" className="text-sm font-semibold text-gray-700 flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-lime-500" />
                          Incorporation State *
                        </Label>
                        <Input
                          id="incorporationState"
                          value={formData.incorporationState}
                          onChange={(e) => setFormData({...formData, incorporationState: e.target.value})}
                          placeholder="Delaware"
                          className="h-12 border-2 border-gray-200 focus:border-lime-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numberOfEmployees" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-sky-500" />
                          Number of Employees *
                        </Label>
                        <Input
                          id="numberOfEmployees"
                          type="number"
                          value={formData.numberOfEmployees}
                          onChange={(e) => setFormData({...formData, numberOfEmployees: e.target.value})}
                          placeholder="5"
                          className="h-12 border-2 border-gray-200 focus:border-sky-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ein" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Hash className="h-4 w-4 mr-2 text-slate-500" />
                        EIN # *
                      </Label>
                      <Input
                        id="ein"
                        value={formData.ein}
                        onChange={(e) => setFormData({...formData, ein: e.target.value})}
                        placeholder="12-3456789"
                        className="h-12 border-2 border-gray-200 focus:border-slate-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="monthlyGrossSales" className="text-sm font-semibold text-gray-700 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                          Current Gross Monthly Sales *
                        </Label>
                        <Input
                          id="monthlyGrossSales"
                          type="number"
                          value={formData.monthlyGrossSales}
                          onChange={(e) => setFormData({...formData, monthlyGrossSales: e.target.value})}
                          placeholder="$25,000"
                          className="h-12 border-2 border-gray-200 focus:border-green-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="projectedAnnualRevenue" className="text-sm font-semibold text-gray-700 flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                          Projected Gross Annual Revenue *
                        </Label>
                        <Input
                          id="projectedAnnualRevenue"
                          type="number"
                          value={formData.projectedAnnualRevenue}
                          onChange={(e) => setFormData({...formData, projectedAnnualRevenue: e.target.value})}
                          placeholder="$300,000"
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg transition-all duration-300 hover:border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Personal Guarantor Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Personal Guarantor Information</h3>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          value={formData.middleName}
                          onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                          placeholder="Enter middle name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="birthCity">Birth City *</Label>
                        <Input
                          id="birthCity"
                          value={formData.birthCity}
                          onChange={(e) => setFormData({...formData, birthCity: e.target.value})}
                          placeholder="Enter birth city"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ssn">SSN *</Label>
                        <Input
                          id="ssn"
                          value={formData.ssn}
                          onChange={(e) => setFormData({...formData, ssn: e.target.value})}
                          placeholder="Enter SSN"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mothersMaidenName">Mother's Maiden Name *</Label>
                        <Input
                          id="mothersMaidenName"
                          value={formData.mothersMaidenName}
                          onChange={(e) => setFormData({...formData, mothersMaidenName: e.target.value})}
                          placeholder="Enter mother's maiden name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="homeAddress">Home Address *</Label>
                      <Input
                        id="homeAddress"
                        value={formData.homeAddress}
                        onChange={(e) => setFormData({...formData, homeAddress: e.target.value})}
                        placeholder="Enter home address"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="personalCity">City *</Label>
                        <Input
                          id="personalCity"
                          value={formData.personalCity}
                          onChange={(e) => setFormData({...formData, personalCity: e.target.value})}
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="personalState">State *</Label>
                        <Input
                          id="personalState"
                          value={formData.personalState}
                          onChange={(e) => setFormData({...formData, personalState: e.target.value})}
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <Label htmlFor="personalZip">ZIP *</Label>
                        <Input
                          id="personalZip"
                          value={formData.personalZip}
                          onChange={(e) => setFormData({...formData, personalZip: e.target.value})}
                          placeholder="Enter ZIP code"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="homePhone">Home Phone</Label>
                        <Input
                          id="homePhone"
                          value={formData.homePhone}
                          onChange={(e) => setFormData({...formData, homePhone: e.target.value})}
                          placeholder="Enter home phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mobilePhone">Mobile Phone *</Label>
                        <Input
                          id="mobilePhone"
                          value={formData.mobilePhone}
                          onChange={(e) => setFormData({...formData, mobilePhone: e.target.value})}
                          placeholder="Enter mobile phone"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Housing Status *</Label>
                      <RadioGroup 
                        value={formData.housingStatus} 
                        onValueChange={(value) => setFormData({...formData, housingStatus: value})}
                        className="flex gap-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rent" id="rent" />
                          <Label htmlFor="rent">Rent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="own" id="own" />
                          <Label htmlFor="own">Own</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other">Other</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="monthlyHousingPayment">Monthly Housing Payment *</Label>
                        <Input
                          id="monthlyHousingPayment"
                          type="number"
                          value={formData.monthlyHousingPayment}
                          onChange={(e) => setFormData({...formData, monthlyHousingPayment: e.target.value})}
                          placeholder="Enter monthly payment"
                        />
                      </div>
                      <div>
                        <Label htmlFor="yearsAtAddress">Years at Current Address *</Label>
                        <Input
                          id="yearsAtAddress"
                          type="number"
                          value={formData.yearsAtAddress}
                          onChange={(e) => setFormData({...formData, yearsAtAddress: e.target.value})}
                          placeholder="Enter years at address"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="driversLicense">Driver's License # *</Label>
                        <Input
                          id="driversLicense"
                          value={formData.driversLicense}
                          onChange={(e) => setFormData({...formData, driversLicense: e.target.value})}
                          placeholder="Enter driver's license number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="issuingState">Issuing State *</Label>
                        <Input
                          id="issuingState"
                          value={formData.issuingState}
                          onChange={(e) => setFormData({...formData, issuingState: e.target.value})}
                          placeholder="Enter issuing state"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="issueDate">Issue Date *</Label>
                        <Input
                          id="issueDate"
                          type="date"
                          value={formData.issueDate}
                          onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expirationDate">Expiration Date *</Label>
                        <Input
                          id="expirationDate"
                          type="date"
                          value={formData.expirationDate}
                          onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Employment Information */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentEmployer">Current Employer *</Label>
                        <Input
                          id="currentEmployer"
                          value={formData.currentEmployer}
                          onChange={(e) => setFormData({...formData, currentEmployer: e.target.value})}
                          placeholder="Enter current employer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position">Position *</Label>
                        <Input
                          id="position"
                          value={formData.position}
                          onChange={(e) => setFormData({...formData, position: e.target.value})}
                          placeholder="Enter position"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="yearsAtEmployer">Years at Current Employer *</Label>
                        <Input
                          id="yearsAtEmployer"
                          type="number"
                          value={formData.yearsAtEmployer}
                          onChange={(e) => setFormData({...formData, yearsAtEmployer: e.target.value})}
                          placeholder="Enter years at employer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="employerPhone">Employer Phone *</Label>
                        <Input
                          id="employerPhone"
                          value={formData.employerPhone}
                          onChange={(e) => setFormData({...formData, employerPhone: e.target.value})}
                          placeholder="Enter employer phone"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="employerAddress">Employer Address *</Label>
                      <Input
                        id="employerAddress"
                        value={formData.employerAddress}
                        onChange={(e) => setFormData({...formData, employerAddress: e.target.value})}
                        placeholder="Enter employer address"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Financial Information */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
                    
                    {/* Banking & Credit Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">Banking & Credit Information</h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="personalBankName">Personal Bank Name *</Label>
                          <Input
                            id="personalBankName"
                            value={formData.personalBankName}
                            onChange={(e) => setFormData({...formData, personalBankName: e.target.value})}
                            placeholder="Enter personal bank name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="personalBankBalance">Personal Bank Avg. Balance *</Label>
                          <Input
                            id="personalBankBalance"
                            type="number"
                            value={formData.personalBankBalance}
                            onChange={(e) => setFormData({...formData, personalBankBalance: e.target.value})}
                            placeholder="Enter average balance"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessBankName">Business Bank Name *</Label>
                          <Input
                            id="businessBankName"
                            value={formData.businessBankName}
                            onChange={(e) => setFormData({...formData, businessBankName: e.target.value})}
                            placeholder="Enter business bank name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessBankBalance">Business Bank Avg. Balance *</Label>
                          <Input
                            id="businessBankBalance"
                            type="number"
                            value={formData.businessBankBalance}
                            onChange={(e) => setFormData({...formData, businessBankBalance: e.target.value})}
                            placeholder="Enter average balance"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Snapshot */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">Financial Snapshot</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Are you a U.S. Citizen? *</Label>
                          <RadioGroup 
                            value={formData.usCitizen} 
                            onValueChange={(value) => setFormData({...formData, usCitizen: value})}
                            className="flex gap-6 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="citizen-yes" />
                              <Label htmlFor="citizen-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="citizen-no" />
                              <Label htmlFor="citizen-no">No</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label>Savings Account? *</Label>
                          <RadioGroup 
                            value={formData.savingsAccount} 
                            onValueChange={(value) => setFormData({...formData, savingsAccount: value})}
                            className="flex gap-6 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="savings-yes" />
                              <Label htmlFor="savings-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="savings-no" />
                              <Label htmlFor="savings-no">No</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label>Investment Accounts? *</Label>
                          <RadioGroup 
                            value={formData.investmentAccounts} 
                            onValueChange={(value) => setFormData({...formData, investmentAccounts: value})}
                            className="flex gap-6 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="investment-yes" />
                              <Label htmlFor="investment-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="investment-no" />
                              <Label htmlFor="investment-no">No</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label>Military Affiliation (you or family)? *</Label>
                          <RadioGroup 
                            value={formData.militaryAffiliation} 
                            onValueChange={(value) => setFormData({...formData, militaryAffiliation: value})}
                            className="flex gap-6 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="military-yes" />
                              <Label htmlFor="military-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="military-no" />
                              <Label htmlFor="military-no">No</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label>Do you have other income? *</Label>
                          <RadioGroup 
                            value={formData.otherIncome} 
                            onValueChange={(value) => setFormData({...formData, otherIncome: value})}
                            className="flex gap-6 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="income-yes" />
                              <Label htmlFor="income-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="income-no" />
                              <Label htmlFor="income-no">No</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label>Do you have other assets? *</Label>
                          <RadioGroup 
                            value={formData.otherAssets} 
                            onValueChange={(value) => setFormData({...formData, otherAssets: value})}
                            className="flex gap-6 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="assets-yes" />
                              <Label htmlFor="assets-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="assets-no" />
                              <Label htmlFor="assets-no">No</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>

                    {/* Banks to Ignore */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">Banks to Ignore (Optional)</h4>
                      <div>
                        <Label htmlFor="banksToIgnore">Banks to Ignore (Type bank name and press Enter to add)</Label>
                        <Input
                          id="banksToIgnore"
                          placeholder="Enter bank name and press Enter to add..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = e.currentTarget.value.trim();
                              if (value && !formData.banksToIgnore.includes(value)) {
                                setFormData({
                                  ...formData, 
                                  banksToIgnore: [...formData.banksToIgnore, value]
                                });
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        {formData.banksToIgnore.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.banksToIgnore.map((bank, index) => (
                              <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                {bank}
                                <button
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      banksToIgnore: formData.banksToIgnore.filter((_, i) => i !== index)
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          Specify any banks you want to exclude from funding consideration. This is optional.
                        </p>
                      </div>
                    </div>

                    {/* Document Upload Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">Required Documents</h4>
                      <p className="text-sm text-gray-600">Please upload the following documents in PDF format (max 10MB each):</p>
                      
                      {/* Driver License Upload */}
                      <div className="space-y-2">
                        <Label htmlFor="driverLicense">Driver License *</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            id="driverLicense"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.type !== 'application/pdf') {
                                  alert('Please upload a PDF file');
                                  return;
                                }
                                if (file.size > 10 * 1024 * 1024) {
                                  alert('File size must be less than 10MB');
                                  return;
                                }
                                setFormData({...formData, driverLicenseFile: file});
                              }
                            }}
                            className="hidden"
                          />
                          <label htmlFor="driverLicense" className="cursor-pointer">
                            <div className="flex flex-col items-center">
                              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="text-sm text-gray-600">
                                {formData.driverLicenseFile ? formData.driverLicenseFile.name : 'Click to upload Driver License (PDF)'}
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* EIN Confirmation Letter Upload */}
                      <div className="space-y-2">
                        <Label htmlFor="einConfirmation">EIN Confirmation Letter *</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            id="einConfirmation"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.type !== 'application/pdf') {
                                  alert('Please upload a PDF file');
                                  return;
                                }
                                if (file.size > 10 * 1024 * 1024) {
                                  alert('File size must be less than 10MB');
                                  return;
                                }
                                setFormData({...formData, einConfirmationFile: file});
                              }
                            }}
                            className="hidden"
                          />
                          <label htmlFor="einConfirmation" className="cursor-pointer">
                            <div className="flex flex-col items-center">
                              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="text-sm text-gray-600">
                                {formData.einConfirmationFile ? formData.einConfirmationFile.name : 'Click to upload EIN Confirmation Letter (PDF)'}
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Articles from State Upload */}
                      <div className="space-y-2">
                        <Label htmlFor="articlesFromState">Articles from State *</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            id="articlesFromState"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.type !== 'application/pdf') {
                                  alert('Please upload a PDF file');
                                  return;
                                }
                                if (file.size > 10 * 1024 * 1024) {
                                  alert('File size must be less than 10MB');
                                  return;
                                }
                                setFormData({...formData, articlesFromStateFile: file});
                              }
                            }}
                            className="hidden"
                          />
                          <label htmlFor="articlesFromState" className="cursor-pointer">
                            <div className="flex flex-col items-center">
                              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="text-sm text-gray-600">
                                {formData.articlesFromStateFile ? formData.articlesFromStateFile.name : 'Click to upload Articles from State (PDF)'}
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    className="group relative overflow-hidden px-6 py-3 border-2 border-gray-300 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-white hover:bg-blue-50"
                    onClick={() => handleStepNavigation('back')}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                      <span className="font-medium">
                        {currentStep === 1 ? 'Back to Options' : 'Previous'}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                  
                  {/* Step indicator in center */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Step {currentStep} of 4</span>
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Button 
                    className={`group relative overflow-hidden px-6 py-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                      currentStep === 4 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                    } ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (currentStep === 4) {
                        handleFormSubmission();
                      } else {
                        handleStepNavigation('forward');
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center gap-2">
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-medium">Processing...</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">
                            {currentStep === 4 ? 'Submit Application' : 'Next'}
                          </span>
                          {currentStep === 4 ? (
                            <CheckCircle2 className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                          ) : (
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                          )}
                        </>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Ripple effect */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 bg-white/30 transform scale-0 group-active:scale-100 transition-transform duration-200 rounded-full"></div>
                    </div>
                  </Button>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>


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
