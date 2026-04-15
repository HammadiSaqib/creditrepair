import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { clientsApi, creditReportScraperApi, clientDocumentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import EditClientForm from "@/components/EditClientForm";
import { DocumentUploadBox } from "@/components/ui/DocumentUploadBox";
import { US_STATE_OPTIONS, isUsStateOption } from "@shared/usStates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CalendarDays,
  Edit,
  FileText,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  DollarSign,
  Activity,
  CreditCard,
  User,
  History,
  Code,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Loader2,
  ScrollText,
  Shield,
  ShieldCheck,
  Upload,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Building,
  Pencil,
  Check,
  AlertTriangle,
  StickyNote,
  Globe,
  Hash,
  Heart,
  Lock,
  Briefcase
} from "lucide-react";

interface ClientData {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  ssn_last_four: string;
  date_of_birth: string;
  employment_status: string;
  annual_income: number;
  joinDate: string;
  status: "Active" | "Inactive" | "Pending" | "Suspended";
  credit_score: number;
  previous_credit_score: number;
  creditScores: {
    experian: number;
    equifax: number;
    transunion: number;
  };
  previousScores: {
    experian: number;
    equifax: number;
    transunion: number;
  };
  fundingEligibility: "fundable" | "not fundable";
  fundingProgress: number;
  disputesActive: number;
  disputesTotal: number;
  totalPaid: number;
  nextPayment?: string;
  notes: string;
  platform?: string;
  platform_email?: string;
  platform_password?: string;
  chaserInfo?: any;
  chatHistory?: Array<{
    id: string;
    message: string;
    sender: "client" | "admin";
    timestamp: string;
  }>;
  creditReportHistory?: Array<{
    date: string;
    score: number;
    bureau: string;
    changes: string[];
  }>;
  latestJsonData?: any;
}

function OtherDocUploadButton({ onUpload }: { onUpload: (files: File[]) => Promise<void> }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: File[]) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const validFiles = files.filter(f => validTypes.includes(f.type));
    if (validFiles.length === 0) return;
    setUploading(true);
    try {
      await onUpload(validFiles);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.gif,.pdf"
        multiple
        onChange={async (e) => {
          if (!e.target.files || e.target.files.length === 0) return;
          await processFiles(Array.from(e.target.files));
        }}
      />
      <div
        className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget as Node)) return; setIsDragging(false); }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFiles(Array.from(e.dataTransfer.files));
          }
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-sm text-slate-500 font-medium">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Drag files here or click to upload</p>
            <p className="text-xs text-slate-400">JPG, PNG, PDF — select multiple files</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [scoreHistoryLoading, setScoreHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [jsonSearchTerm, setJsonSearchTerm] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const jsonContainerRef = useRef<HTMLPreElement>(null);
  const [fundingDialogOpen, setFundingDialogOpen] = useState(false);
  const [selectedFundingType, setSelectedFundingType] = useState<"personal" | "business" | "both" | "">("");
  const [selectedFundingMethod, setSelectedFundingMethod] = useState<"diy" | "dfy" | "">("");
  const [generatedLetters, setGeneratedLetters] = useState<any[]>([]);
  const [lettersLoading, setLettersLoading] = useState(false);
  const [clientDocuments, setClientDocuments] = useState<any>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [viewingLetter, setViewingLetter] = useState<any>(null);
  const [startWithType, setStartWithType] = useState<"personal" | "business">("personal");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [letterHistory, setLetterHistory] = useState<any[]>([]);
  const [letterHistoryLoading, setLetterHistoryLoading] = useState(false);
  const [otherDocs, setOtherDocs] = useState<any[]>([]);
  const [otherDocPreview, setOtherDocPreview] = useState<any>(null);
  const [equifaxLiveSession, setEquifaxLiveSession] = useState<any>(null);
  const [equifaxLiveBusy, setEquifaxLiveBusy] = useState(false);
  const [equifaxPreviewBusy, setEquifaxPreviewBusy] = useState(false);
  const [equifaxLiveError, setEquifaxLiveError] = useState<string | null>(null);
  const [equifaxSavedScreenshot, setEquifaxSavedScreenshot] = useState<any>(null);
  const [securityFreezePinSaveState, setSecurityFreezePinSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const securityFreezePinSaveTimeoutRef = useRef<number | null>(null);
  const securityFreezePinStatusTimeoutRef = useRef<number | null>(null);
  const stateOptions = !formData.state || isUsStateOption(formData.state)
    ? [...US_STATE_OPTIONS]
    : [formData.state, ...US_STATE_OPTIONS];

  useEffect(() => {
    const state = location.state as { openEdit?: boolean } | null;
    if (state?.openEdit) {
      setShowEditForm(true);
    }
  }, [location.state]);

  const isManuallyAddedClient = useMemo(() => {
    if (!client) return false;
    const notesText = String(client.notes || "").toLowerCase();
    return (
      notesText.includes("created manually") ||
      notesText.includes("added manually") ||
      notesText.includes("manually added") ||
      (!client.platform && !client.platform_email && !client.platform_password) ||
      String(client.platform || "").toLowerCase() === "other"
    );
  }, [client]);

  const jsonString = useMemo(() => {
    try {
      return client?.latestJsonData ? JSON.stringify(client.latestJsonData, null, 2) : "";
    } catch {
      return "";
    }
  }, [client?.latestJsonData]);

  const { highlightedNodes, matchCount } = useMemo(() => {
    if (!jsonString) {
      return { highlightedNodes: jsonString, matchCount: 0 };
    }
    if (!jsonSearchTerm) {
      return { highlightedNodes: jsonString, matchCount: 0 };
    }
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = escapeRegExp(jsonSearchTerm);
    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = jsonString.split(regex);
    const nodes = parts.map((part, idx) => {
      if (idx % 2 === 1) {
        const matchIdx = (idx - 1) / 2; // sequence of matches within parts
        const isActive = matchIdx === currentMatchIndex;
        return (
          <mark
            key={idx}
            className={`json-match ${isActive ? "bg-yellow-300 outline outline-2 outline-yellow-500" : "bg-yellow-200"} text-black`}
            data-index={matchIdx}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
    const count = (jsonString.match(regex) || []).length;
    return { highlightedNodes: nodes, matchCount: count };
  }, [jsonString, jsonSearchTerm, currentMatchIndex]);

  const scrollToMatch = (index: number) => {
    const container = jsonContainerRef.current;
    if (!container) return;
    const marks = container.querySelectorAll<HTMLElement>('mark.json-match');
    if (!marks.length) return;
    const target = marks[Math.max(0, Math.min(index, marks.length - 1))];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    // Reset to first match when search term changes
    setCurrentMatchIndex(0);
  }, [jsonSearchTerm]);

  useEffect(() => {
    if (matchCount > 0) {
      scrollToMatch(currentMatchIndex);
    }
  }, [currentMatchIndex, matchCount]);

  const handleScrapeNewReport = async () => {
    if (!client) return;

    // Check if client has stored credentials
    if (!client.platform || !client.platform_email || !client.platform_password) {
      toast({
        title: "Missing Credentials",
        description: "Client credentials are not configured. Please update client profile with platform credentials.",
        variant: "destructive",
      });
      return;
    }

    setScrapingLoading(true);
    try {
      const platformLower = String(client.platform || '').toLowerCase();
      const requiresSsn = platformLower === 'identityiq' || platformLower === 'myscoreiq';
      const ssn = client.ssn_last_four || '';
      if (requiresSsn && (!ssn || String(ssn).length !== 4)) {
        toast({
          title: 'SSN Last 4 Required',
          description: 'Please set SSN Last 4 on the client profile for IdentityIQ/MyScoreIQ.',
          variant: 'destructive',
        });
        setScrapingLoading(false);
        return;
      }

      const response = await creditReportScraperApi.scrapeReport({
        platform: client.platform,
        credentials: {
          username: client.platform_email,
          password: client.platform_password,
        },
        options: {
          ...(requiresSsn ? { ssnLast4: ssn } : {}),
        },
        clientId: client.id,
      });

      toast({
        title: "Report Scraping Started",
        description: "Credit report scraping has been initiated successfully.",
      });

      // Refresh client data after successful scraping
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error scraping report:", error);
      toast({
        title: "Scraping Failed",
        description: "Failed to start credit report scraping. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScrapingLoading(false);
    }
  };

  const handleViewReports = () => {
    if (!clientId) return;
    if (isManuallyAddedClient) {
      toast({
        title: "No Reports Available",
        description: "This client was added manually and does not have a credit report JSON.",
      });
      return;
    }
    navigate(`/credit-report/${clientId}`);
  };

  const handleApplyFunding = () => {
    if (!client) return;
    setFundingDialogOpen(true);
  };
  const handleFundingContinue = () => {
    if (!clientId || !selectedFundingType || !selectedFundingMethod) return;
    const typeToUse = selectedFundingType === "both" ? startWithType : selectedFundingType;
    const base = selectedFundingMethod === "diy" ? "/funding/diy" : "/funding/apply";
    setFundingDialogOpen(false);
    navigate(`${base}/${typeToUse}?clientId=${clientId}`);
  };
  const handleEditClient = () => {
    setShowEditForm(true);
  };

  const fetchClientData = async () => {
      if (!clientId) return;
      
      try {
        setLoading(true);
        console.log('Starting to fetch client data for clientId:', clientId);
        
        // Fetch client data
        console.log('Fetching client data...');
        const clientResponse = await clientsApi.getClient(clientId);
        console.log('Client response:', clientResponse);
        
        if (clientResponse.error) {
          console.error('Client response error:', clientResponse.error);
          toast({
            title: "Error",
            description: "Failed to load client data",
            variant: "destructive",
          });
          return;
        }

        // Fetch latest credit report data
        console.log('Fetching credit report data...');
        let reportData = null;
        try {
          const reportResponse = await creditReportScraperApi.getClientReport(clientId);
          console.log('Report response:', reportResponse);
          if (reportResponse && reportResponse.data) {
            reportData = reportResponse.data;
          }
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 404) {
            console.log('No credit report found for this client. Continuing without JSON data.');
          } else {
            console.error('Error fetching credit report data:', err);
          }
        }

        // Fetch credit report history from database
        console.log('Fetching credit report history...');
        let historyResponse;
        try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased timeout to 20 seconds
          
          historyResponse = await Promise.race([
            creditReportScraperApi.getReportHistory(parseInt(clientId)),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 20000)
            )
          ]);
          
          clearTimeout(timeoutId);
          console.log('✅ Credit report history response received:', historyResponse);
        } catch (error) {
          console.error('❌ Error fetching credit report history:', error);
          historyResponse = null;
        }
        
        let creditReportHistory = [];
        let latestJsonData = null;
        
        console.log('Credit report history response:', historyResponse);
        
        if (historyResponse && historyResponse.data && historyResponse.data.success && historyResponse.data.data) {
          if (Array.isArray(historyResponse.data.data)) {
            // Transform history data for display
            creditReportHistory = historyResponse.data.data.map((report: any) => ({
              id: report.id,
              date: new Date(report.created_at).toISOString().split("T")[0],
              platform: report.platform,
              status: report.status,
              reportPath: report.report_path,
              reportName: report.report_path ? report.report_path.split(/[\\\/]/).pop() : 'Unknown Report',
              clientName: report.first_name && report.last_name ? `${report.first_name} ${report.last_name}` : 'Unknown',
              reportData: report.reportData || null
            }));
          }
        }
        
        // Fetch the actual credit report data with JSON content
         try {
            console.log('🔍 DEBUG: Fetching client report data...');
            const clientReportResponse = await creditReportScraperApi.getClientReport(clientId);
            console.log('🔍 DEBUG: Client report response:', clientReportResponse);
            
            if (clientReportResponse && clientReportResponse.data && clientReportResponse.data.success) {
              latestJsonData = clientReportResponse.data.data.reportData;
              console.log('🔍 DEBUG: Successfully loaded latestJsonData:', latestJsonData ? Object.keys(latestJsonData) : 'null');
              
              if (latestJsonData && latestJsonData.reportData) {
                console.log('🔍 DEBUG: Found reportData.Score:', latestJsonData.reportData.Score);
              }
            } else {
              console.log('🔍 DEBUG: No client report data found');
            }
          } catch (clientReportError) {
            console.error('🔍 DEBUG: Error fetching client report:', clientReportError);
          }

        console.log('Transforming client data...');
        
        // Transform the data
        const clientData = clientResponse.data;
        
        // Extract credit scores from JSON data - Use dynamic values
        let extractedScores = {
          experian: 0,
          equifax: 0,
          transunion: 0,
        };
        
        let extractedPreviousScores = {
          experian: 0,
          equifax: 0,
          transunion: 0,
        };
        
        // If we have JSON data, extract real scores
        console.log('🔍 DEBUG: Checking latestJsonData:', latestJsonData);
        console.log('🔍 DEBUG: latestJsonData keys:', latestJsonData ? Object.keys(latestJsonData) : 'null');
        
        // Check multiple possible data structures for scores
        let scoreArray = null;
        
        if (latestJsonData) {
          // Check for reportData.Score structure (from the terminal output we can see this is the correct path)
          if (latestJsonData.reportData && latestJsonData.reportData.Score) {
            scoreArray = latestJsonData.reportData.Score;
            console.log('🔍 DEBUG: Found scores in reportData.Score:', scoreArray);
          }
          // Check for direct Score array
          else if (latestJsonData.Score) {
            scoreArray = latestJsonData.Score;
            console.log('🔍 DEBUG: Found scores in direct Score array:', scoreArray);
          }
          // Check if latestJsonData itself is the score array
          else if (Array.isArray(latestJsonData) && latestJsonData[0] && latestJsonData[0].BureauId) {
            scoreArray = latestJsonData;
            console.log('🔍 DEBUG: latestJsonData is the score array:', scoreArray);
          }
          
          if (scoreArray && Array.isArray(scoreArray)) {
            console.log('🔍 DEBUG: Processing score array:', scoreArray);
            
            scoreArray.forEach((scoreData: any) => {
              console.log('🔍 DEBUG: Processing score data:', scoreData);
              const bureauId = scoreData.BureauId;
              const score = parseInt(scoreData.Score) || 0;
              
              console.log(`🔍 DEBUG: Bureau ${bureauId}, Score: ${score}`);
              
              // Map BureauId to credit bureau (1=TransUnion, 2=Experian, 3=Equifax)
              if (bureauId === 1) {
                extractedScores.transunion = score;
                console.log('🔍 DEBUG: Set TransUnion score to:', score);
              } else if (bureauId === 2) {
                extractedScores.experian = score;
                console.log('🔍 DEBUG: Set Experian score to:', score);
              } else if (bureauId === 3) {
                extractedScores.equifax = score;
                console.log('🔍 DEBUG: Set Equifax score to:', score);
              }
            });
            
            console.log('🔍 DEBUG: Final extracted scores:', extractedScores);
          } else {
            console.log('🔍 DEBUG: No valid score array found');
            // Fallback: some scrapers provide a unified scores object
            try {
              const unified = latestJsonData.scores || latestJsonData.reportData?.scores;
              if (unified && typeof unified === 'object') {
                extractedScores.experian = parseInt(unified.experian) || extractedScores.experian;
                extractedScores.equifax = parseInt(unified.equifax) || extractedScores.equifax;
                extractedScores.transunion = parseInt(unified.transunion) || extractedScores.transunion;
                console.log('🔍 DEBUG: Extracted scores from unified object:', extractedScores);
              }
            } catch (e) {
              console.log('🔍 DEBUG: Unified scores fallback failed:', e);
            }
          }
        } else {
          console.log('🔍 DEBUG: No latestJsonData available');
        }

        // Final fallback: use latest history row bureau columns if JSON did not yield scores
        if (
          extractedScores.experian === 0 &&
          extractedScores.equifax === 0 &&
          extractedScores.transunion === 0 &&
          historyResponse &&
          historyResponse.data &&
          Array.isArray(historyResponse.data.data) &&
          historyResponse.data.data.length > 0
        ) {
          try {
            const latest = historyResponse.data.data[0];
            extractedScores.experian = parseInt(latest.experian_score) || 0;
            extractedScores.equifax = parseInt(latest.equifax_score) || 0;
            extractedScores.transunion = parseInt(latest.transunion_score) || 0;
            console.log('🔍 DEBUG: Scores from history fallback:', extractedScores);
          } catch (e) {
            console.log('🔍 DEBUG: History scores fallback failed:', e);
          }
        }
        const transformedClient: ClientData = {
          id: clientData.id.toString(),
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          name: `${clientData.first_name} ${clientData.last_name}`,
          email: clientData.email,
          phone: clientData.phone || "",
          address: clientData.address || "No address provided",
          ssn_last_four: clientData.ssn_last_four || "",
          date_of_birth: clientData.date_of_birth || "",
          employment_status: clientData.employment_status || "",
          annual_income: clientData.annual_income || 0,
          credit_score: clientData.credit_score || 0,
          previous_credit_score: clientData.previous_credit_score || 0,
          joinDate: new Date(clientData.created_at).toISOString().split("T")[0],
          status: clientData.status === "active" ? "Active" :
                  clientData.status === "inactive" ? "Inactive" :
                  clientData.status === "completed" ? "Completed" : "Pending",
          creditScores: extractedScores,
          previousScores: extractedPreviousScores,
          fundingEligibility:
            clientData.fundable_status === "fundable"
              ? "fundable"
              : clientData.fundable_status === "not_fundable"
              ? "not fundable"
              : (reportData?.funding_eligible ? "fundable" : "not fundable"),
          fundingProgress: reportData?.funding_progress || 0,
          disputesActive: clientData.disputes_active || 0,
          disputesTotal: clientData.disputes_total || 0,
          totalPaid: clientData.total_paid || 0,
          nextPayment: clientData.next_payment,
          notes: clientData.notes || "",
          platform: clientData.platform,
          platform_email: clientData.platform_email,
          platform_password: clientData.platform_password,
          chaserInfo: reportData?.chaser_info || {},
          chatHistory: clientData.chat_history || [],
          creditReportHistory: creditReportHistory,
          latestJsonData: latestJsonData || reportData?.raw_data || null,
          dl_or_id_card: clientData.dl_or_id_card || null,
          ssc: clientData.ssc || null,
          poa: clientData.poa || null,
        };

        setClient(transformedClient);
        // Populate formData for inline editing
        setFormData({
          first_name: clientData.first_name || '',
          middle_name: clientData.middle_name || '',
          last_name: clientData.last_name || '',
          email: clientData.email || '',
          phone: clientData.phone || '',
          status: clientData.status || 'active',
          date_of_birth: clientData.date_of_birth || clientData.dob || '',
          street_number_and_name: clientData.street_number_and_name || clientData.address || clientData.address_line1 || '',
          city: clientData.city || '',
          state: clientData.state || '',
          zip_code: clientData.zip_code || clientData.postal_code || '',
          country: clientData.country || 'United States',
          employment_status: clientData.employment_status || '',
          annual_income: clientData.annual_income || '',
          ssn_last_four: clientData.ssn_last_four || '',
          ssn_last_six: clientData.ssn_last_six || '',
          platform: clientData.platform || '',
          platform_email: clientData.platform_email || '',
          platform_password: clientData.platform_password || '',
          notes: clientData.notes || '',
          security_freeze_pin: clientData.security_freeze_pin || '',
        });
      } catch (error) {
        console.error("Error fetching client data:", error);
        toast({
          title: "Error",
          description: "Failed to load client data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    fetchClientData();
  };

  // --- Profile form helpers ---
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = async () => {
    if (!clientId) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await clientsApi.updateClient(clientId, formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      toast({ title: "Changes saved successfully" });
      fetchClientData();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const persistSecurityFreezePin = async (rawValue: string, showFailureToast = false) => {
    if (!clientId) return;
    setSecurityFreezePinSaveState('saving');
    try {
      await clientsApi.updateClient(clientId, { security_freeze_pin: rawValue });
      setSecurityFreezePinSaveState('saved');
      if (securityFreezePinStatusTimeoutRef.current) clearTimeout(securityFreezePinStatusTimeoutRef.current);
      securityFreezePinStatusTimeoutRef.current = window.setTimeout(() => setSecurityFreezePinSaveState('idle'), 3000);
    } catch {
      setSecurityFreezePinSaveState('error');
      if (showFailureToast) toast({ title: "Failed to save security freeze PIN", variant: "destructive" });
    }
  };

  const handleSecurityFreezePinChange = (value: string) => {
    updateField('security_freeze_pin', value);
    if (securityFreezePinSaveTimeoutRef.current) clearTimeout(securityFreezePinSaveTimeoutRef.current);
    securityFreezePinSaveTimeoutRef.current = window.setTimeout(() => persistSecurityFreezePin(value), 700);
  };

  const handleSecurityFreezePinBlur = () => {
    if (securityFreezePinSaveTimeoutRef.current) clearTimeout(securityFreezePinSaveTimeoutRef.current);
    persistSecurityFreezePin(formData.security_freeze_pin || '');
  };

  const safeJsonParse = (val: any): string[] => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string') {
      try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed.map(String) : []; }
      catch { return []; }
    }
    return [];
  };

  // --- Equifax Settlement helpers ---
  const hasEquifaxSettlementData = /^\d{6}$/.test(String(formData.ssn_last_six || ''));
  const equifaxLiveStatus = equifaxLiveSession?.status || 'idle';
  const hasActiveEquifaxLiveSession = !['idle', 'error'].includes(equifaxLiveStatus);
  const activeEquifaxPreviewUrl = hasActiveEquifaxLiveSession
    ? equifaxLiveSession?.screenshotDataUrl || null
    : null;
  const equifaxDisplayImageUrl = activeEquifaxPreviewUrl || equifaxSavedScreenshot?.imageUrl || null;

  const securityFreezePinStatusText = securityFreezePinSaveState === 'saving' ? 'Saving…'
    : securityFreezePinSaveState === 'saved' ? 'Saved ✓'
    : securityFreezePinSaveState === 'error' ? 'Save failed'
    : 'Auto-saves on change';
  const securityFreezePinStatusClassName = securityFreezePinSaveState === 'saving' ? 'text-blue-500'
    : securityFreezePinSaveState === 'saved' ? 'text-emerald-600'
    : securityFreezePinSaveState === 'error' ? 'text-red-500'
    : 'text-slate-400';

  const getEquifaxMissingDataMessage = () => {
    return 'Save the client last name and Equifax settlement SSN last 6 digits before starting the live preview.';
  };

  const refreshEquifaxLiveSession = async (quiet = false) => {
    if (!clientId || !client) return;

    try {
      const response = await clientsApi.getEquifaxSettlementLivePreview(clientId);
      if (response?.data?.success) {
        setEquifaxLiveSession(response.data.data || null);
        if (!quiet) {
          setEquifaxLiveError(null);
        }
      }
    } catch (error: any) {
      if (!quiet) {
        const description =
          error?.response?.data?.error ||
          error?.message ||
          'Failed to refresh the Equifax live preview';
        setEquifaxLiveError(description);
        toast({
          title: 'Equifax Live Preview Error',
          description,
          variant: 'destructive',
        });
      }
    }
  };

  const fetchEquifaxSavedScreenshot = async (quiet = false) => {
    if (!clientId || !client) return;

    try {
      const response = await clientsApi.getEquifaxSettlementSavedScreenshot(clientId);
      if (response?.data?.success) {
        setEquifaxSavedScreenshot(response.data.data || null);
      }
    } catch (error: any) {
      if (!quiet) {
        const description =
          error?.response?.data?.error ||
          error?.message ||
          'Failed to load the saved Equifax screenshot';
        setEquifaxLiveError(description);
        toast({
          title: 'Saved Screenshot Error',
          description,
          variant: 'destructive',
        });
      }
    }
  };

  const startEquifaxLiveBrowser = async () => {
    if (!clientId || !client) return;

    const hasLastName = Boolean(String(client.last_name || '').trim());
    const hasSsnLastSix = /^\d{6}$/.test(String(formData.ssn_last_six || ''));
    if (!hasLastName || !hasSsnLastSix) {
      const description = getEquifaxMissingDataMessage();
      setEquifaxLiveError(description);
      toast({
        title: 'Missing Client Data',
        description,
        variant: 'destructive',
      });
      return;
    }

    setEquifaxLiveBusy(true);
    setEquifaxLiveError(null);

    try {
      const response = await clientsApi.startEquifaxSettlementLiveBrowser(clientId);
      if (!response?.data?.success || !response.data.data) {
        throw new Error('Failed to open the live Equifax preview');
      }

      setEquifaxLiveSession(response.data.data);
      await refreshEquifaxLiveSession(true);
      toast({
        title: 'Live Equifax Preview Opened',
        description:
          'The system filled both inputs and loaded the live Equifax preview below. If reCAPTCHA appears, click inside the preview to solve it.',
      });
    } catch (error: any) {
      const description =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to open the live Equifax preview';
      setEquifaxLiveError(description);
      toast({
        title: 'Equifax Live Preview Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setEquifaxLiveBusy(false);
    }
  };

  const saveEquifaxScreenshot = async () => {
    if (!clientId || !equifaxLiveSession?.screenshotDataUrl) return;

    setEquifaxPreviewBusy(true);
    setEquifaxLiveError(null);
    try {
      const response = await clientsApi.saveEquifaxSettlementScreenshot(clientId);
      if (response?.data?.success) {
        setEquifaxSavedScreenshot(response.data.data || null);
        toast({
          title: 'Screenshot Saved',
          description: 'The Equifax screenshot was saved and updated for this client.',
        });
      }
    } catch (error: any) {
      const description =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save the Equifax screenshot';
      setEquifaxLiveError(description);
      toast({
        title: 'Save Screenshot Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setEquifaxPreviewBusy(false);
    }
  };

  const handleEquifaxPreviewClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!clientId || !equifaxLiveSession?.screenshotDataUrl || equifaxPreviewBusy) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const xRatio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const yRatio = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));

    setEquifaxPreviewBusy(true);
    try {
      const response = await clientsApi.clickEquifaxSettlementLivePreview(clientId, {
        xRatio,
        yRatio,
      });
      if (response?.data?.success) {
        setEquifaxLiveSession(response.data.data || null);
        setEquifaxLiveError(null);
      }
    } catch (error: any) {
      const description =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to interact with the live Equifax preview';
      setEquifaxLiveError(description);
      toast({
        title: 'Preview Interaction Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setEquifaxPreviewBusy(false);
    }
  };

  // Equifax: load/refresh on tab change
  useEffect(() => {
    if (activeTab !== 'equifax' || !clientId) return;
    refreshEquifaxLiveSession(true);
  }, [activeTab, clientId]);

  // Equifax: fetch saved screenshots
  useEffect(() => {
    if (activeTab !== 'equifax' || !clientId) return;
    fetchEquifaxSavedScreenshot(true);
  }, [activeTab, clientId]);

  // Equifax: polling for live session updates - 3 second interval
  useEffect(() => {
    if (activeTab !== 'equifax' || !clientId) return;

    const currentStatus = equifaxLiveSession?.status;
    if (!currentStatus || ['idle', 'error', 'result_ready'].includes(currentStatus)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      refreshEquifaxLiveSession(true);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [activeTab, clientId, equifaxLiveSession?.status]);

  // Fetch letter history
  useEffect(() => {
    if (activeTab === "letters" && clientId && !letterHistory.length && !letterHistoryLoading) {
      const fetchLetterHistory = async () => {
        setLetterHistoryLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`/api/disputes/letter-history/${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setLetterHistory(Array.isArray(data) ? data : data.data || []);
          }
        } catch (err) {
          console.error("Error fetching letter history:", err);
        } finally {
          setLetterHistoryLoading(false);
        }
      };
      fetchLetterHistory();
    }
  }, [activeTab, clientId]);

  const fetchScoreHistory = async () => {
    if (!clientId) return;
    
    try {
      setScoreHistoryLoading(true);
      console.log('Fetching score history for clientId:', clientId);
      
      const response = await creditReportScraperApi.getReportHistory(parseInt(clientId));
      console.log('Score history response:', response);
      
      if (response && response.data && response.data.success && response.data.data) {
        const historyData = response.data.data;
        
        // Transform the data to extract scores from database columns
        const scoreHistoryData = historyData.map((report: any) => {
          let scores = { 
            experian: parseInt(report.experian_score) || 0, 
            equifax: parseInt(report.equifax_score) || 0, 
            transunion: parseInt(report.transunion_score) || 0 
          };
          
          return {
            id: report.id,
            date: new Date(report.created_at).toISOString().split("T")[0],
            platform: report.platform,
            status: report.status,
            scores: scores,
            reportData: report.reportData
          };
        }).filter(report => report.scores.experian > 0 || report.scores.equifax > 0 || report.scores.transunion > 0);
        
        setScoreHistory(scoreHistoryData);
        console.log('Processed score history:', scoreHistoryData);
      }
    } catch (error) {
      console.error('Error fetching score history:', error);
      toast({
        title: "Error",
        description: "Failed to load score history",
        variant: "destructive",
      });
    } finally {
      setScoreHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [clientId, toast]);

  // Fetch other documents on mount
  useEffect(() => {
    if (clientId) {
      fetchOtherDocs();
    }
  }, [clientId]);

  useEffect(() => {
    if (activeTab === "scores" && clientId && !scoreHistory.length && !scoreHistoryLoading) {
      fetchScoreHistory();
    }
  }, [activeTab, clientId]);

  // Fetch generated letter history
  useEffect(() => {
    if (activeTab === "letters" && clientId && !generatedLetters.length && !lettersLoading) {
      const fetchLetters = async () => {
        setLettersLoading(true);
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`/api/credit-repair/generated-letters?client_id=${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setGeneratedLetters(data.data || []);
          }
        } catch (error) {
          console.error("Error fetching generated letters:", error);
        } finally {
          setLettersLoading(false);
        }
      };
      fetchLetters();
    }
  }, [activeTab, clientId]);

  // Fetch client documents
  useEffect(() => {
    if (activeTab === "documents" && clientId && !clientDocuments && !documentsLoading) {
      const fetchDocuments = async () => {
        setDocumentsLoading(true);
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`/api/client-documents/${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setClientDocuments(data.data || {});
          }
        } catch (error) {
          console.error("Error fetching client documents:", error);
        } finally {
          setDocumentsLoading(false);
        }
      };
      fetchDocuments();
    }
  }, [activeTab, clientId]);

  const handleDocumentUpload = async (type: string, file: File) => {
    if (!clientId) return;
    setUploadingDoc(type);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const response = await fetch(`/api/client-documents/${clientId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      // Refresh client data so the new document URL appears
      fetchClientData();
    } catch (error) {
      // Re-throw so DocumentUploadBox shows the error toast
      throw error;
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDocumentDelete = async (type: string) => {
    if (!clientId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/client-documents/${clientId}/document/${type}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast({ title: "Document deleted successfully" });
        setClientDocuments(null); // Reset to trigger refetch
      }
    } catch (error) {
      toast({ title: "Error deleting document", variant: "destructive" });
    }
  };

  // --- Other Documents helpers ---
  const fetchOtherDocs = async () => {
    if (!clientId) return;
    try {
      const res = await clientDocumentsApi.getDocuments(clientId);
      if (res?.data?.success) {
        setOtherDocs(res.data.data?.other_documents || []);
      }
    } catch (error) {
      console.error("Error fetching other docs:", error);
    }
  };

  const handleAdditionalUpload = async (files: File[]) => {
    if (!clientId) return;
    try {
      await clientDocumentsApi.uploadMultipleAdditionalDocuments(clientId, 'other', files);
      fetchOtherDocs();
    } catch (error) {
      toast({ title: "Error uploading documents", variant: "destructive" });
    }
  };

  const handleAdditionalDelete = async (docId: number) => {
    if (!clientId) return;
    try {
      await clientDocumentsApi.deleteAdditionalDocument(clientId, docId);
      setOtherDocs(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      toast({ title: "Error deleting document", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "border-green-500/30 text-green-600 bg-green-50";
      case "Inactive":
        return "border-gray-500/30 text-gray-600 bg-gray-50";
      case "Pending":
        return "border-yellow-500/30 text-yellow-600 bg-yellow-50";
      case "Suspended":
        return "border-red-500/30 text-red-600 bg-red-50";
      default:
        return "border-gray-500/30 text-gray-600 bg-gray-50";
    }
  };

  const getProgressIcon = (progress: string) => {
    switch (progress) {
      case "Improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "Declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Client not found</h2>
          <p className="text-gray-600 mt-2">The requested client could not be found.</p>
          <Button onClick={() => navigate("/clients")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const progressPercent = Math.min(
    Math.max(
      ((client.creditScores.experian - client.previousScores.experian) / (850 - client.previousScores.experian)) * 100,
      0
    ),
    100
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/clients")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="gradient-primary text-white">
                  {client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold gradient-text-primary">
                  {client.name}
                </h1>
                <p className="text-muted-foreground">
                  Client since {new Date(client.joinDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        <div className="flex items-center flex-wrap gap-2">
          <Badge variant="outline" className={getStatusColor(client.status)}>
            {client.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleEditClient}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
          {!client.latestJsonData && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleApplyFunding}
            >
              Apply for Funding
            </Button>
          )}
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleScrapeNewReport}
            disabled={scrapingLoading}
          >
            {scrapingLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {scrapingLoading ? "Fetching..." : "Fetch New Report"}
          </Button>
        </div>
        </div>

        {/* Quick Stats - Credit Bureau Scores and Funding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Experian Credit Score */}
          <Card className="gradient-light border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Experian</p>
                  <p className="text-2xl font-bold gradient-text-primary">
                    {client.creditScores.experian}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Previous: {client.previousScores.experian}
                  </p>
                </div>
                <img src="/Experian_logo.svg.png" alt="Experian" className="h-8 w-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Equifax Credit Score */}
          <Card className="gradient-light border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Equifax</p>
                  <p className="text-2xl font-bold gradient-text-primary">
                    {client.creditScores.equifax}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Previous: {client.previousScores.equifax}
                  </p>
                </div>
                <img src="/Equifax_Logo.svg.png" alt="Equifax" className="h-8 w-auto" />
              </div>
            </CardContent>
          </Card>

          {/* TransUnion Credit Score */}
          <Card className="gradient-light border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">TransUnion</p>
                  <p className="text-2xl font-bold gradient-text-primary">
                    {client.creditScores.transunion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Previous: {client.previousScores.transunion}
                  </p>
                </div>
                <img src="/TransUnion_logo.svg.png" alt="TransUnion" className="h-8 w-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Funding Eligibility */}
          <Card className="gradient-light border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Funding Status</p>
                  <p className={`text-2xl font-bold ${client.fundingEligibility === 'fundable' ? 'text-green-600' : 'text-red-600'}`}>
                    {client.fundingEligibility === 'fundable' ? 'Fundable' : 'Not Fundable'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Progress: {client.fundingProgress}%
                  </p>
                </div>
                {client.fundingEligibility === 'fundable' ? 
                  <CheckCircle className="h-8 w-8 text-green-500" /> : 
                  <AlertCircle className="h-8 w-8 text-red-500" />
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-2 min-w-[700px] sm:min-w-0">
              <TabsTrigger value="info" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profile & Documents</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>Credit Reports</span>
              </TabsTrigger>
              <TabsTrigger value="scores" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Score History</span>
              </TabsTrigger>
              <TabsTrigger value="letters" className="flex items-center space-x-2">
                <ScrollText className="h-4 w-4" />
                <span>Generated Letters</span>
              </TabsTrigger>
              <TabsTrigger value="equifax" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Equifax Settlement</span>
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>Raw Data</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Client Info Tab - Profile & Documents */}
          <TabsContent value="info" className="mt-0 space-y-6">
                {/* Client Welcome Card */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 flex items-center gap-5 border border-blue-100">
                  <div className="flex-shrink-0">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold">
                        {client.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-800 truncate">{client.name || 'Client'}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <CalendarDays className="h-3.5 w-3.5" /> Member since {client.joinDate ? new Date(client.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <Badge
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${formData.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                    >
                      {formData.status === 'active' ? '● Active' : '○ Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 flex items-center gap-2.5">
                    <User className="h-4 w-4 text-white" />
                    <h3 className="text-sm font-semibold text-white tracking-wide">Personal Information</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <User className="h-3 w-3" /> First Name
                      </label>
                      <input type="text" value={formData.first_name || ''} onChange={(e) => updateField('first_name', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <User className="h-3 w-3" /> Middle Name
                      </label>
                      <input type="text" value={formData.middle_name || ''} onChange={(e) => updateField('middle_name', e.target.value)} placeholder="Optional" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors placeholder:text-slate-300" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <User className="h-3 w-3" /> Last Name
                      </label>
                      <input type="text" value={formData.last_name || ''} onChange={(e) => updateField('last_name', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Mail className="h-3 w-3" /> Email Address
                      </label>
                      <input type="email" value={formData.email || ''} onChange={(e) => updateField('email', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Phone className="h-3 w-3" /> Phone
                      </label>
                      <input type="tel" value={formData.phone || ''} onChange={(e) => updateField('phone', e.target.value)} placeholder="No phone added" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors placeholder:text-slate-300" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Heart className="h-3 w-3" /> Status
                      </label>
                      <select value={formData.status || 'active'} onChange={(e) => updateField('status', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <CalendarDays className="h-3 w-3" /> Date of Birth
                      </label>
                      <input type="date" value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : ''} onChange={(e) => updateField('date_of_birth', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <CalendarDays className="h-3 w-3" /> Joined
                      </label>
                      <input type="text" value={client.joinDate ? new Date(client.joinDate).toLocaleDateString() : ''} readOnly className="w-full border border-slate-100 rounded-xl px-3.5 py-2.5 text-slate-400 bg-slate-50 cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                {/* Residential Information */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-white" />
                    <h3 className="text-sm font-semibold text-white tracking-wide">Residential Information</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <MapPin className="h-3 w-3" /> Street Number and Name
                      </label>
                      <input type="text" value={formData.street_number_and_name || ''} onChange={(e) => updateField('street_number_and_name', e.target.value)} placeholder="Enter street number and name..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors placeholder:text-slate-300" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Building className="h-3 w-3" /> City
                      </label>
                      <input type="text" value={formData.city || ''} onChange={(e) => updateField('city', e.target.value)} placeholder="Enter city..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors placeholder:text-slate-300" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <MapPin className="h-3 w-3" /> State
                      </label>
                      <select value={formData.state || ''} onChange={(e) => updateField('state', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors">
                        <option value="">Select state</option>
                        {stateOptions.map((stateName) => (
                          <option key={stateName} value={stateName}>{stateName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Hash className="h-3 w-3" /> Zip
                      </label>
                      <input type="text" value={formData.zip_code || ''} onChange={(e) => updateField('zip_code', e.target.value)} placeholder="75001" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors placeholder:text-slate-300" />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Globe className="h-3 w-3" /> Country
                      </label>
                      <input type="text" value={formData.country || ''} onChange={(e) => updateField('country', e.target.value)} placeholder="United States" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors placeholder:text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex items-center gap-2.5">
                    <Briefcase className="h-4 w-4 text-white" />
                    <h3 className="text-sm font-semibold text-white tracking-wide">Work Information</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Briefcase className="h-3 w-3" /> Employment
                      </label>
                      <input type="text" value={formData.employment_status || ''} onChange={(e) => updateField('employment_status', e.target.value)} placeholder="e.g. Full-time, Freelancer..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors placeholder:text-slate-300" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <DollarSign className="h-3 w-3" /> Annual Income
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                        <input type="number" value={formData.annual_income || ''} onChange={(e) => updateField('annual_income', e.target.value)} className="w-full border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <ShieldCheck className="h-3 w-3" /> Social Security Number
                      </label>
                      <input type="text" value={formData.ssn_last_four || ''} onChange={(e) => updateField('ssn_last_four', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Last 4 Digits" maxLength={4} className="w-full border border-orange-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-orange-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-colors placeholder:text-slate-400 tracking-widest" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <ShieldCheck className="h-3 w-3" /> Equifax Settlement SSN
                      </label>
                      <input type="text" value={formData.ssn_last_six || ''} onChange={(e) => updateField('ssn_last_six', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Last 6 Digits" maxLength={6} className="w-full border border-orange-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-orange-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-colors placeholder:text-slate-400 tracking-widest" />
                      <p className="mt-1.5 text-xs text-orange-500">Required for the Equifax Data Breach Settlement tab.</p>
                    </div>
                  </div>
                </div>

                {/* Platform Information */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-3 flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-white" />
                    <h3 className="text-sm font-semibold text-white tracking-wide">Platform Information</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                          <Globe className="h-3 w-3" /> Platform
                        </label>
                        <input type="text" value={formData.platform || ''} onChange={(e) => updateField('platform', e.target.value)} placeholder="e.g. IdentityIQ" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-colors placeholder:text-slate-300" />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                          <Mail className="h-3 w-3" /> Platform Email
                        </label>
                        <input type="email" value={formData.platform_email || ''} onChange={(e) => updateField('platform_email', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <Lock className="h-3 w-3" /> Platform Password
                      </label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} value={formData.platform_password || ''} onChange={(e) => updateField('platform_password', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-colors" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        <StickyNote className="h-3 w-3" /> Notes
                      </label>
                      <textarea value={formData.notes || ''} onChange={(e) => updateField('notes', e.target.value)} rows={3} placeholder="Any notes about this client..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-colors resize-none placeholder:text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-white" />
                    <h3 className="text-sm font-semibold text-white tracking-wide">Identity Documents</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-slate-400 mb-5 text-xs">Upload required identity documents below.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <DocumentUploadBox
                        title="Government ID"
                        description={"Passport (Recommended)\nState ID Card\nDriver's License"}
                        documentType="dl_or_id_card"
                        currentFileUrl={(client as any).dl_or_id_card}
                        clientId={parseInt(client.id)}
                        onUpload={(f) => handleDocumentUpload('dl_or_id_card', f)}
                        onDelete={() => handleDocumentDelete('dl_or_id_card')}
                      />
                      <DocumentUploadBox
                        title="Social Security Number"
                        description={"Social Security Card (Recommended)\nW-2\nFirst Page of Tax Return"}
                        documentType="ssc"
                        currentFileUrl={(client as any).ssc}
                        clientId={parseInt(client.id)}
                        onUpload={(f) => handleDocumentUpload('ssc', f)}
                        onDelete={() => handleDocumentDelete('ssc')}
                      />
                      <DocumentUploadBox
                        title="Proof of Address"
                        description={"Bank Statement (Recommended)\nUtility Bill\nPhone Bill\nAny Recent Address Proof"}
                        documentType="poa"
                        currentFileUrl={(client as any).poa}
                        clientId={parseInt(client.id)}
                        onUpload={(f) => handleDocumentUpload('poa', f)}
                        onDelete={() => handleDocumentDelete('poa')}
                      />
                    </div>

                    {/* Other Documents */}
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Plus className="h-4 w-4 text-indigo-500" /> Other Documents
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        Any documents added here will also be included with generated dispute letters.
                      </p>
                      {otherDocs.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {otherDocs.map((doc: any) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-700 truncate">
                                  {doc.original_name || 'Document'}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setOtherDocPreview(doc)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-white"
                                  onClick={() => handleAdditionalDelete(doc.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <OtherDocUploadButton onUpload={handleAdditionalUpload} />
                    </div>
                  </div>
                </div>

                {/* Other Document Preview Dialog */}
                <Dialog open={Boolean(otherDocPreview)} onOpenChange={(open) => { if (!open) setOtherDocPreview(null); }}>
                  <DialogContent className="h-[90vh] w-[95vw] max-w-6xl overflow-hidden border-0 bg-slate-950 p-0 shadow-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:bg-white/10 [&>button]:text-white [&>button]:opacity-100 [&>button]:ring-0 [&>button]:hover:bg-white/20 [&>button]:focus:ring-0">
                    <DialogHeader className="border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 text-left">
                      <DialogTitle className="truncate pr-12 text-base font-semibold text-white">
                        {otherDocPreview?.original_name || 'Document Preview'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex h-[calc(90vh-78px)] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_42%),linear-gradient(180deg,_#0f172a,_#020617)] p-4">
                      {otherDocPreview?.file_url && /\.pdf$/i.test(otherDocPreview.file_url) ? (
                        <iframe
                          src={`${otherDocPreview.file_url}#toolbar=0`}
                          title={otherDocPreview.original_name || 'PDF'}
                          className="h-full w-full rounded-2xl border border-white/10 bg-white shadow-2xl"
                        />
                      ) : otherDocPreview?.file_url && /\.(jpe?g|png|gif)$/i.test(otherDocPreview.file_url) ? (
                        <img
                          src={otherDocPreview.file_url}
                          alt={otherDocPreview.original_name || 'Image'}
                          className="max-h-full max-w-full rounded-2xl border border-white/10 bg-white/5 object-contain p-3 shadow-2xl"
                        />
                      ) : (
                        <div className="flex max-w-md flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-8 py-12 text-center shadow-2xl backdrop-blur">
                          <FileText className="h-10 w-10 text-white mb-4" />
                          <p className="text-lg font-semibold text-white">Preview unavailable</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className={`h-12 px-10 text-base font-semibold rounded-xl shadow-lg transition-all duration-500 ${
                      saveSuccess
                        ? 'bg-emerald-500 hover:bg-emerald-500 text-white scale-105 shadow-emerald-200'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200'
                    }`}
                  >
                    {saveSuccess ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                          <Check className="h-4 w-4" />
                        </span>
                        Submitted!
                      </span>
                    ) : saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="h-5 w-5" /> Submit Changes
                      </span>
                    )}
                  </Button>
                </div>
          </TabsContent>

          {/* Credit Report History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="gradient-light border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Credit Report History</CardTitle>
                <Button
                  onClick={() => {
                    console.log('Fetch New Report button clicked!');
                    handleScrapeNewReport();
                  }}
                  disabled={scrapingLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 border-2 border-red-800"
                  style={{ minWidth: '150px', minHeight: '40px' }}
                >
                  {scrapingLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    "🔄 FETCH NEW REPORT"
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client.creditReportHistory && client.creditReportHistory.length > 0 ? (
                    client.creditReportHistory.map((report, index) => (
                      <div key={report.id || index} className="border-l-2 border-blue-200 pl-4 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full -ml-6 border-2 border-white"></div>
                            <span className="font-medium capitalize">{report.platform}</span>
                            <Badge variant="outline" className="text-xs">
                              {report.status}
                            </Badge>
                            {report.reportData && (
                              <Badge variant="secondary" className="text-xs">
                                Has Data
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(report.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            • Client: {report.clientName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            • Report: {report.reportName}
                          </div>
                          {report.reportData && (
                            <div className="text-sm text-blue-600">
                              • JSON data available - view in JSON tab
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No credit report history found for this client.</p>
                      <p className="text-sm">Reports will appear here once they are generated.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Score History Tab */}
          <TabsContent value="scores" className="space-y-6">
            <Card className="gradient-light border-0">
              <CardHeader>
                <CardTitle className="text-lg">Credit Score History</CardTitle>
              </CardHeader>
              <CardContent>
                {scoreHistoryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading score history...</p>
                  </div>
                ) : scoreHistory.length > 0 ? (
                  <div className="space-y-4">
                    {/* Score Chart Visualization */}
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-6 rounded-lg border border-border/40 dark:border-slate-700">
                      <h3 className="text-lg font-semibold mb-4">Score Trends</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-red-50 dark:bg-white/10 rounded-lg">
                          <div className="text-2xl font-bold text-red-600 dark:text-white">
                            {scoreHistory[0]?.scores.experian || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Experian (Latest)</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-white/10 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-white">
                            {scoreHistory[0]?.scores.equifax || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Equifax (Latest)</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-white/10 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-white">
                            {scoreHistory[0]?.scores.transunion || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">TransUnion (Latest)</div>
                        </div>
                      </div>
                    </div>

                    {/* Score History Table */}
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg border border-border/40 dark:border-slate-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-slate-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                                Platform
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                                Report Pull Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                                Experian
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                                Equifax
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                                TransUnion
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {scoreHistory.map((report, index) => (
                              <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-white/10">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
                                  {new Date(report.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
                                  <Badge variant="outline" className="capitalize dark:border-slate-600 dark:text-slate-200">
                                    {report.platform}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
                                  {new Date(report.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <span className={`${report.scores.experian > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {report.scores.experian > 0 ? report.scores.experian : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <span className={`${report.scores.equifax > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {report.scores.equifax > 0 ? report.scores.equifax : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <span className={`${report.scores.transunion > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                    {report.scores.transunion > 0 ? report.scores.transunion : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant={report.status === 'completed' ? 'default' : 'secondary'}
                                    className="capitalize"
                                  >
                                    {report.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No score history found for this client.</p>
                    <p className="text-sm">Score history will appear here once credit reports are generated.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* JSON Tab */}
          <TabsContent value="json" className="space-y-6">
            <Card className="gradient-light border-0">
              <CardHeader>
                <CardTitle className="text-lg">Latest Credit Report Data (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                {client.latestJsonData ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={jsonSearchTerm}
                        onChange={(e) => setJsonSearchTerm(e.target.value)}
                        placeholder="Find text..."
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                        onKeyDown={(e) => {
                          if (matchCount === 0) return;
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setCurrentMatchIndex((prev) => (prev + 1) % matchCount);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setCurrentMatchIndex((prev) => (prev - 1 + matchCount) % matchCount);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={matchCount === 0}
                        onClick={() => {
                          if (matchCount === 0) return;
                          setCurrentMatchIndex((prev) => (prev - 1 + matchCount) % matchCount);
                        }}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={matchCount === 0}
                        onClick={() => {
                          if (matchCount === 0) return;
                          setCurrentMatchIndex((prev) => (prev + 1) % matchCount);
                        }}
                      >
                        Next
                      </Button>
                      {jsonSearchTerm && (
                        <Button variant="outline" size="sm" onClick={() => setJsonSearchTerm("")}>Clear</Button>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {matchCount > 0 ? `${currentMatchIndex + 1}/${matchCount}` : '0/0'} matches
                      </span>
                    </div>
                    <pre ref={jsonContainerRef} className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm w-full h-[70vh] md:h-[80vh] lg:h-[85vh]">
                      {highlightedNodes}
                    </pre>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No JSON data available for this client.</p>
                    <p className="text-sm">Credit report data will appear here once available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generated Letter History Tab */}
          <TabsContent value="letters" className="mt-0">
                <h3 className="text-3xl font-bold text-slate-800 mb-8">
                  Generated Dispute Letter History
                </h3>
                {letterHistoryLoading ? (
                  <Loader2 className="animate-spin h-10 w-10 mx-auto mt-20 text-blue-500" />
                ) : letterHistory.length > 0 ? (
                  <div className="rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-left bg-white">
                      <thead className="bg-slate-50 text-slate-500 text-sm tracking-widest uppercase">
                        <tr>
                          <th className="p-5">ID</th>
                          <th className="p-5">Generated By</th>
                          <th className="p-5">Bureau(s)</th>
                          <th className="p-5">Negative Item Types</th>
                          <th className="p-5">Dispute Round</th>
                          <th className="p-5">Source</th>
                          <th className="p-5">Templates</th>
                          <th className="p-5">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {letterHistory.map((row: any) => {
                          const bureaus = safeJsonParse(row.bureaus);
                          const negItems = safeJsonParse(
                            row.negative_item_types
                          );
                          const tUsed = safeJsonParse(row.templates_used);
                          return (
                            <tr
                              key={row.id}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="p-5 font-mono text-sm text-slate-500">
                                {row.id}
                              </td>
                              <td className="p-5">
                                <div className="font-semibold text-slate-800">
                                  {row.user_first_name || row.user_last_name
                                    ? `${row.user_first_name || ''} ${row.user_last_name || ''}`.trim()
                                    : row.user_email ||
                                      `User #${row.user_id}`}
                                </div>
                                {row.user_email && (
                                  <div className="text-xs text-slate-400">
                                    {row.user_email}
                                  </div>
                                )}
                              </td>
                              <td className="p-5">
                                <div className="flex flex-wrap gap-1">
                                  {bureaus.map((b: string, i: number) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {b}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="p-5 text-sm text-slate-700">
                                {negItems.join(', ') || '\u2014'}
                              </td>
                              <td className="p-5">
                                <Badge variant="secondary">
                                  Round {row.dispute_round || 1}
                                </Badge>
                              </td>
                              <td className="p-5">
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {row.template_source || '\u2014'}
                                </Badge>
                              </td>
                              <td className="p-5 text-sm">
                                {tUsed.length} used /{' '}
                                {row.template_count || 0} total
                              </td>
                              <td className="p-5 text-sm text-slate-600">
                                {row.created_at
                                  ? new Date(
                                      row.created_at
                                    ).toLocaleString()
                                  : '\u2014'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl">
                    <p className="text-2xl font-semibold text-slate-600">
                      No dispute letters generated yet for this client.
                    </p>
                  </div>
                )}
          </TabsContent>

          {/* Equifax Data Breach Settlement Tab */}
          <TabsContent value="equifax" className="mt-0 space-y-6">
                <div className="flex flex-wrap items-start justify-end gap-3">
                  <div className="w-full sm:w-[240px]">
                    <input
                      type="text"
                      value={formData.security_freeze_pin || ''}
                      onChange={(e) => handleSecurityFreezePinChange(e.target.value)}
                      onBlur={handleSecurityFreezePinBlur}
                      placeholder="Security Freeze PIN"
                      autoComplete="off"
                      className="h-11 w-full rounded-xl border border-orange-200 bg-white px-3.5 text-slate-800 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                    />
                    <p className={`mt-1 text-xs ${securityFreezePinStatusClassName}`}>
                      {securityFreezePinStatusText}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open('https://www.innovis.com/securityFreeze/register', '_blank', 'noopener,noreferrer')}
                    className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
                  >
                      Security Freeze
                  </button>
                  <Button
                    onClick={startEquifaxLiveBrowser}
                    disabled={equifaxLiveBusy || !client.last_name || !hasEquifaxSettlementData}
                    className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {equifaxLiveBusy ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Refresh
                      </span>
                    ) : (
                      'Refresh'
                    )}
                  </Button>
                  <Button
                    onClick={saveEquifaxScreenshot}
                    disabled={equifaxLiveBusy || equifaxPreviewBusy || !activeEquifaxPreviewUrl}
                    className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {equifaxPreviewBusy ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Save Screenshot
                      </span>
                    ) : (
                      'Save Screenshot'
                    )}
                  </Button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden min-h-[420px]">
                  {!client.last_name || !hasEquifaxSettlementData ? (
                    <div className="h-full min-h-[420px] flex items-center justify-center text-center px-6 text-slate-500">
                      Add the client last name and SSN last 6 digits first, then click Refresh.
                    </div>
                  ) : equifaxDisplayImageUrl ? (
                    activeEquifaxPreviewUrl ? (
                      <button
                        type="button"
                        onClick={handleEquifaxPreviewClick}
                        disabled={equifaxPreviewBusy}
                        className="block w-full bg-slate-950 cursor-default disabled:cursor-wait"
                      >
                        <img
                          src={equifaxDisplayImageUrl}
                          alt="Equifax live preview"
                          className="block w-full h-auto"
                        />
                      </button>
                    ) : (
                      <img
                        src={equifaxDisplayImageUrl}
                        alt="Saved Equifax screenshot"
                        className="block w-full h-auto"
                      />
                    )
                  ) : (
                    <div className="h-full min-h-[420px] flex items-center justify-center text-center px-6 text-slate-500">
                      Click Refresh to start the live preview.
                    </div>
                  )}
                </div>

                {equifaxLiveError && (
                  <div className="text-sm text-red-600 text-center">{equifaxLiveError}</div>
                )}
          </TabsContent>

        </Tabs>
      </div>

      {/* Edit Client Modal */}
      {showEditForm && client && (
        <EditClientForm
          client={{
            ...client,
            id: parseInt(client.id),
            user_id: 1, // Default user_id, adjust as needed
            status: (() => {
              switch (client.status) {
                case 'Active': return 'active';
                case 'Inactive': return 'inactive';
                case 'Pending': return 'on_hold';
                case 'Suspended': return 'inactive';
                default: return 'active';
              }
            })() as 'active' | 'inactive' | 'completed' | 'on_hold',
            created_at: client.joinDate,
            updated_at: new Date().toISOString()
          }}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}
      
      <Dialog open={fundingDialogOpen} onOpenChange={setFundingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Funding</DialogTitle>
            <DialogDescription>Select type and method to continue</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm">Funding Type</Label>
              <RadioGroup
                value={selectedFundingType}
                onValueChange={(v) => setSelectedFundingType(v as any)}
                className="grid gap-3"
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="personal" id="type-personal" />
                  <Label htmlFor="type-personal" className="cursor-pointer">Personal</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="business" id="type-business" />
                  <Label htmlFor="type-business" className="cursor-pointer">Business</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="both" id="type-both" />
                  <Label htmlFor="type-both" className="cursor-pointer">Both</Label>
                </div>
              </RadioGroup>
            </div>
            {selectedFundingType === "both" && (
              <div className="space-y-3">
                <Label className="text-sm">Start With</Label>
                <RadioGroup
                  value={startWithType}
                  onValueChange={(v) => setStartWithType(v as any)}
                  className="grid gap-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value="personal" id="start-personal" />
                    <Label htmlFor="start-personal" className="cursor-pointer">Personal</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value="business" id="start-business" />
                    <Label htmlFor="start-business" className="cursor-pointer">Business</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            <div className="space-y-3">
              <Label className="text-sm">Funding Method</Label>
              <RadioGroup
                value={selectedFundingMethod}
                onValueChange={(v) => setSelectedFundingMethod(v as any)}
                className="grid gap-3"
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="dfy" id="method-dfy" />
                  <Label htmlFor="method-dfy" className="cursor-pointer">Done For You</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="diy" id="method-diy" />
                  <Label htmlFor="method-diy" className="cursor-pointer">DIY</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundingDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleFundingContinue}
              disabled={!selectedFundingType || !selectedFundingMethod}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
