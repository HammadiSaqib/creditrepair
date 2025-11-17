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
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useRef, useState } from "react";
import api, { clientsApi, creditReportScraperApi } from "@/lib/api";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Star,
  Award,
  Zap,
  MessageSquare,
  ArrowRight,
  BarChart3,
  Users,
  FileText,
  Shield,
  RefreshCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Play,
  ChevronRight,
  Info,
  Rocket,
  Eye,
} from "lucide-react";

// Mock AI recommendations data
const aiRecommendations = [
  {
    id: 1,
    clientName: "Sarah Johnson",
    clientId: 1,
    type: "Immediate Action",
    priority: "High",
    category: "Credit Utilization",
    title: "Reduce Credit Card Utilization",
    description:
      "Current utilization is 72% across all cards. Recommend paying down Chase card by $1,200 to achieve optimal 30% utilization.",
    impact: "15-25 point score increase",
    timeline: "30-45 days",
    confidence: 92,
    aiScore: 9.2,
    status: "New",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    clientName: "Michael Chen",
    clientId: 2,
    type: "Strategic Planning",
    priority: "Medium",
    category: "Account Mix",
    title: "Optimize Credit Mix Strategy",
    description:
      "Client has only credit cards. Adding an installment loan could improve credit mix and overall profile strength.",
    impact: "8-15 point score increase",
    timeline: "60-90 days",
    confidence: 78,
    aiScore: 7.8,
    status: "In Progress",
    createdAt: "2024-01-12",
  },
  {
    id: 3,
    clientName: "Emma Davis",
    clientId: 3,
    type: "Dispute Strategy",
    priority: "High",
    category: "Collections",
    title: "Contest Medical Collections",
    description:
      "3 medical collections totaling $1,470. High probability of removal using validation disputes based on HIPAA violations.",
    impact: "35-50 point score increase",
    timeline: "45-60 days",
    confidence: 89,
    aiScore: 8.9,
    status: "Approved",
    createdAt: "2024-01-10",
  },
  {
    id: 4,
    clientName: "Robert Wilson",
    clientId: 4,
    type: "Preventive Care",
    priority: "Low",
    category: "Account Maintenance",
    title: "Monitor Hard Inquiry Aging",
    description:
      "2 hard inquiries approaching 12-month mark. Schedule reminder to verify automatic score improvement.",
    impact: "5-8 point score increase",
    timeline: "2-3 months",
    confidence: 95,
    aiScore: 9.5,
    status: "Scheduled",
    createdAt: "2024-01-08",
  },
];

// Mock AI chat messages
const chatMessages = [
  {
    id: 1,
    type: "ai",
    message:
      "Hello! I'm your AI Funding Coach. I've analyzed your client portfolio and found 12 new optimization opportunities. Would you like me to prioritize them by potential impact?",
    timestamp: "2024-01-15 10:30",
  },
  {
    id: 2,
    type: "user",
    message: "Yes, show me the highest impact recommendations first.",
    timestamp: "2024-01-15 10:31",
  },
  {
    id: 3,
    type: "ai",
    message:
      "Based on my analysis, Sarah Johnson has the highest score improvement potential. Her credit utilization is at 72%, and reducing it to 30% could increase her score by 15-25 points within 30-45 days. Should I generate a specific action plan?",
    timestamp: "2024-01-15 10:32",
  },
];

// Mock insights data
const insights = [
  {
    id: 1,
    title: "Optimal Dispute Timing",
    description:
      "Best time to file disputes is Tuesday-Thursday, 10-11 AM EST. 23% higher success rate observed.",
    category: "Strategy",
    impact: "High",
    confidence: 87,
  },
  {
    id: 2,
    title: "Seasonal Score Trends",
    description:
      "Credit scores tend to improve 12% faster during Q1 due to post-holiday debt paydown patterns.",
    category: "Timing",
    impact: "Medium",
    confidence: 91,
  },
  {
    id: 3,
    title: "Medical Collection Patterns",
    description:
      "Medical collections have 67% removal rate when disputed using specific HIPAA-based language templates.",
    category: "Disputes",
    impact: "High",
    confidence: 94,
  },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-800 border-red-200";
    case "Medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "New":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "Scheduled":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function AICoach() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("recommendations");

  const [messages, setMessages] = useState<Array<{ id: string; type: 'ai' | 'user'; message: string; timestamp: string }>>([
    {
      id: "welcome-1",
      type: "ai",
      message:
        "Thanks for reaching out — I’m here to help with credit repair and funding. Tell me a bit about your situation (e.g., score range, negatives, goals), and I’ll walk you through practical steps under U.S. credit laws.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Admin: client selection and report analysis state
  const [clients, setClients] = useState<Array<{ id: number; first_name?: string; last_name?: string; email?: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientReport, setClientReport] = useState<any | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisStructured, setAnalysisStructured] = useState<any | null>(null);
  const [analysisSections, setAnalysisSections] = useState<any | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load clients for admin selector
  useEffect(() => {
    (async () => {
      try {
        const resp = await clientsApi.getClients();
        const data = (resp?.data?.clients || resp?.data?.data || resp?.data || []) as Array<any>;
        const normalized = data.map((c: any) => ({ id: c.id, first_name: c.first_name, last_name: c.last_name, email: c.email }));
        setClients(normalized);
      } catch (e) {
        console.warn('Failed to load clients', e);
      }
    })();
  }, []);

  const handleSelectClient = async (id: number) => {
    setSelectedClientId(id);
    setClientReport(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    try {
      const resp = await creditReportScraperApi.getClientReport(String(id));
      const payload = resp?.data?.data ?? resp?.data ?? {};
      // Support different shapes: { reportData } or full JSON
      const report = payload.reportData || payload.report_data || payload;
      setClientReport(report);
    } catch (e: any) {
      console.error('Failed to fetch client report', e?.response?.data || e?.message || e);
      setAnalysisError(e?.response?.data?.message || 'Failed to fetch latest report for this client');
    }
  };

  const handleAnalyzeReport = async () => {
    if (!selectedClientId || !clientReport) {
      setAnalysisError('Select a client and ensure a report is loaded.');
      return;
    }
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const resp = await api.post('/api/ai/finmint-analyze-report', {
        goal: 'both',
        clientId: selectedClientId,
        report: clientReport,
      });
      const analysis: string = resp?.data?.analysis || 'Analysis completed.';
      const structured: any | null = resp?.data?.structured ?? null;
      setAnalysisResult(analysis);
      setAnalysisStructured(structured);
      try {
        const parsed = parseAnalysis(analysis);
        setAnalysisSections(parsed);
      } catch (_) {
        setAnalysisSections(null);
      }
    } catch (e: any) {
      console.error('Report analysis error', e?.response?.data || e?.message || e);
      setAnalysisError(e?.response?.data?.error || 'Failed to analyze the report');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const extractSection = (text: string, heading: string) => {
    const pattern = new RegExp(`(^|\n)\s*${heading}\s*:?\s*\n`, 'i');
    const match = pattern.exec(text);
    if (!match) return null;
    const startIndex = (match.index || 0) + (match[0]?.length || 0);
    // Find next numbered section start
    const nextPattern = /(\n\s*\d+\.\s+[A-Z][^\n]*\n)/g;
    nextPattern.lastIndex = startIndex;
    const nextMatch = nextPattern.exec(text);
    const endIndex = nextMatch ? nextMatch.index : text.length;
    return text.slice(startIndex, endIndex).trim();
  };

  const parseBullets = (s: string | null) => {
    if (!s) return [];
    return s
      .split('\n')
      .map(l => l.replace(/^[-•\d+\.\)\s]+/, '').trim())
      .filter(Boolean);
  };

  const parseNegatives = (s: string | null) => {
    if (!s) return [];
    const blocks = s.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
    return blocks.map(b => {
      const lines = b.split('\n').map(x => x.trim()).filter(Boolean);
      return {
        item: lines[0] || 'Negative Item',
        details: lines.slice(1).join('\n') || '',
      };
    });
  };

  const parsePlanSteps = (s: string | null) => {
    if (!s) return [];
    return s
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => l.replace(/^\d+\.\s*/, ''));
  };

  const parseAnalysis = (text: string) => {
    const summary = extractSection(text, '1.\s*Credit Summary Overview');
    const negatives = extractSection(text, '2.\s*Negative Item Breakdown');
    const positives = extractSection(text, '3.\s*Positive Accounts');
    const utilization = extractSection(text, '4.\s*Utilization Analysis');
    const inquiries = extractSection(text, '5.\s*Inquiry Risk Assessment');
    const plan = extractSection(text, '6.\s*Score Improvement Plan');

    return {
      summary,
      negatives: parseNegatives(negatives),
      positives: parseBullets(positives),
      utilization,
      inquiries,
      planSteps: parsePlanSteps(plan),
    };
  };

  const scoreCategory = (score?: number) => {
    if (!score && score !== 0) return { label: '—', color: 'text-muted-foreground', desc: 'Not available in report.' };
    if (score < 580) return { label: 'Poor', color: 'text-red-600', desc: 'High risk; focus on removing negatives and paying down debt.' };
    if (score < 670) return { label: 'Fair', color: 'text-orange-600', desc: 'Moderate risk; address collections and reduce utilization.' };
    if (score < 740) return { label: 'Good', color: 'text-yellow-600', desc: 'Solid profile; optimize utilization and add positive history.' };
    if (score < 800) return { label: 'Very Good', color: 'text-green-600', desc: 'Low risk; maintain balances and age of credit.' };
    return { label: 'Excellent', color: 'text-emerald-600', desc: 'Prime profile; keep utilization low and inquiries minimal.' };
  };

  const handleSendMessage = async () => {
    const input = chatInput.trim();
    if (!input || loading) return;

    const newUserMsg = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      message: input,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newUserMsg]);
    setChatInput("");
    setError(null);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.type === 'ai' ? 'assistant' : 'user',
        content: m.message,
      }));

      const resp = await api.post('/api/ai/finmint-chat', {
        question: input,
        messages: history,
        topic: 'credit',
      });

      const reply: string = resp.data?.reply || 'I’m here to help. Could you share a bit more detail?';
      const aiMsg = {
        id: `ai-${Date.now()}`,
        type: 'ai' as const,
        message: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI chat error:', err?.response?.data || err?.message || err);
      setError(
        err?.response?.data?.error || 'Something went wrong sending your message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="FinMint AI"
      description="Certified USA Credit Repair & Business Funding guidance"
    >
      <div className="relative">
        {/* Content Enabled */}
        <div>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  AI Recommendations
                </CardTitle>
                <Brain className="h-4 w-4 text-ocean-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold gradient-text-primary">47</div>
                <p className="text-xs text-muted-foreground">+12 new this week</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">94.2%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Score Increase
                </CardTitle>
                <Target className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">+67</div>
                <p className="text-xs text-muted-foreground">points per client</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  AI Confidence
                </CardTitle>
                <Sparkles className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">89%</div>
                <p className="text-xs text-muted-foreground">High accuracy</p>
              </CardContent>
            </Card>
          </div>

          {/* Professional AI Coach: Chat + Client Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  FinMint AI Chat
                </CardTitle>
                <CardDescription>
                  Ask about credit repair, disputes, utilization, inquiries, or funding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[420px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm shadow ${m.type === 'user' ? 'bg-ocean-blue text-white' : 'bg-muted'} `}>
                          {m.message}
                          <div className={`mt-2 text-xs ${m.type === 'user' ? 'text-white/80' : 'text-muted-foreground'}`}>{new Date(m.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-xl px-4 py-2 text-sm bg-muted shadow animate-pulse">FinMint AI is typing…</div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {error && (
                    <div className="mt-2 text-xs text-red-600">{error}</div>
                  )}

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Type your question (e.g., how to lower utilization?)"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={loading || !chatInput.trim()} className="w-full sm:w-auto">
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-ocean-blue" />
                  Client Selection & Report
                </CardTitle>
                <CardDescription>
                  Select a client, fetch latest report, and run AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Client</label>
                    <Select onValueChange={(val) => handleSelectClient(parseInt(val, 10))}>
                      <SelectTrigger className="mt-1 w-full sm:w-64">
                        <SelectValue placeholder="Choose a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || `Client ${c.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="bg-gradient-to-br from-white to-blue-50/40 border-0">
                      <CardHeader className="py-2">
                        <CardTitle className="text-xs font-medium flex items-center gap-2"><BarChart3 className="h-3 w-3"/> Scores</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs">
                        <div className="space-y-1">
                          <div>Experian: <span className="font-semibold">{clientReport?.Score?.find?.((s: any) => /experian/i.test(s?.Bureau || s?.bureau))?.Score || '—'}</span></div>
                          <div>Equifax: <span className="font-semibold">{clientReport?.Score?.find?.((s: any) => /equifax/i.test(s?.Bureau || s?.bureau))?.Score || '—'}</span></div>
                          <div>TransUnion: <span className="font-semibold">{clientReport?.Score?.find?.((s: any) => /transunion/i.test(s?.Bureau || s?.bureau))?.Score || '—'}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-white to-rose-50/40 border-0">
                      <CardHeader className="py-2">
                        <CardTitle className="text-xs font-medium flex items-center gap-2"><AlertTriangle className="h-3 w-3"/> Negatives</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs">
                        <div className="space-y-1">
                          <div>Collections: <span className="font-semibold">{clientReport?.Collections?.length ?? clientReport?.negative_accounts ?? '—'}</span></div>
                          <div>Inquiries: <span className="font-semibold">{clientReport?.Inquiries?.length ?? clientReport?.inquiries_count ?? '—'}</span></div>
                          <div>Public Records: <span className="font-semibold">{clientReport?.PublicRecords?.length ?? clientReport?.public_records ?? '—'}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={handleAnalyzeReport} disabled={!selectedClientId || !clientReport || analysisLoading}>
                      <Brain className="h-4 w-4 mr-1" /> Analyze Report
                    </Button>
                    {analysisLoading && <span className="text-xs text-muted-foreground">Analyzing…</span>}
                  </div>

                  {analysisError && (
                    <div className="text-xs text-red-600">{analysisError}</div>
                  )}

                  {analysisResult && (
                    <div className="mt-3 space-y-6">
                      {/* Score Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['Experian','Equifax','TransUnion'].map((bureau) => {
                          const structuredScore = (analysisStructured?.scores?.[bureau.toLowerCase()] ?? null) as number | null;
                          const scoreObj = clientReport?.Score?.find?.((s: any) => new RegExp(bureau, 'i').test(s?.Bureau || s?.bureau));
                          const scoreVal = structuredScore != null && !isNaN(Number(structuredScore))
                            ? Number(structuredScore)
                            : Number(scoreObj?.Score ?? scoreObj?.score);
                          const cat = scoreCategory(isNaN(scoreVal) ? undefined : scoreVal);
                          return (
                            <Card key={bureau} className="border-0 shadow-md bg-gradient-to-br from-white to-slate-50">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{bureau} Score</CardTitle>
                              </CardHeader>
                              <CardContent className="flex items-center justify-between">
                                <div>
                                  <div className={`text-2xl font-bold ${cat.color}`}>{isNaN(scoreVal) ? '—' : scoreVal}</div>
                                  <div className="text-xs text-muted-foreground">{cat.label}</div>
                                </div>
                                <div className="text-xs text-muted-foreground max-w-[60%]">{cat.desc}</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Structured Analysis Sections */}
                      {analysisSections ? (
                        <div className="space-y-6">
                          {/* Credit Summary */}
                          <Card className="border-0 shadow-md">
                            <CardHeader>
                              <CardTitle className="text-base">1. Credit Summary Overview</CardTitle>
                              <CardDescription>High-level evaluation of scores, negatives, and overall risk</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                                {analysisSections.summary || 'Not available in report.'}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Negative Item Breakdown as Table */}
                          <Card className="border-0 shadow-md">
                            <CardHeader>
                              <CardTitle className="text-base">2. Negative Item Breakdown</CardTitle>
                              <CardDescription>Items impacting the score and dispute guidance</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {(analysisStructured?.negatives?.length ?? 0) > 0 ? (
                                <div className="rounded-lg border border-border/40 overflow-x-auto">
                                  <div className="min-w-[800px] sm:min-w-0">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Creditor</TableHead>
                                          <TableHead>Type</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead>First Delinquency</TableHead>
                                          <TableHead>Balance</TableHead>
                                          <TableHead>Guidance</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {analysisStructured.negatives.map((n: any, idx: number) => (
                                          <TableRow key={idx} className="align-top">
                                            <TableCell className="font-medium whitespace-pre-wrap">{n.creditor || '—'}</TableCell>
                                            <TableCell className="whitespace-pre-wrap text-sm">{n.account_type || '—'}</TableCell>
                                            <TableCell className="whitespace-pre-wrap text-sm">{n.status || '—'}</TableCell>
                                            <TableCell className="whitespace-pre-wrap text-sm">{n.first_delinquency || '—'}</TableCell>
                                            <TableCell className="whitespace-pre-wrap text-sm">{n.balance ?? '—'}</TableCell>
                                            <TableCell className="whitespace-pre-wrap text-sm text-muted-foreground">{n.strategy || n.explanation || '—'}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              ) : analysisSections.negatives?.length ? (
                                <div className="rounded-lg border border-border/40 overflow-x-auto">
                                  <div className="min-w-[500px] sm:min-w-0">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Item</TableHead>
                                          <TableHead>Details</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {analysisSections.negatives.map((n: any, idx: number) => (
                                          <TableRow key={idx} className="align-top">
                                            <TableCell className="font-medium whitespace-pre-wrap">{n.item}</TableCell>
                                            <TableCell className="whitespace-pre-wrap text-sm text-muted-foreground">{n.details || '—'}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No negative items listed.</div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Positive Accounts */}
                          <Card className="border-0 shadow-md">
                            <CardHeader>
                              <CardTitle className="text-base">3. Positive Accounts & Strength Factors</CardTitle>
                              <CardDescription>Established tradelines, on-time history, and age of credit</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {analysisSections.positives?.length ? (
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                  {analysisSections.positives.map((p: string, idx: number) => (
                                    <li key={idx}>{p}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-sm text-muted-foreground">Not available in report.</div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Utilization + Inquiries */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-md">
                              <CardHeader>
                                <CardTitle className="text-base">4. Utilization Analysis</CardTitle>
                                <CardDescription>Revolving balances vs. limits and target percentages</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {analysisStructured?.metrics?.revolving_utilization_pct != null ? (
                                  <div className="flex items-center gap-3">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {Math.round(Number(analysisStructured.metrics.revolving_utilization_pct))}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Current revolving utilization</div>
                                  </div>
                                ) : null}
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap mt-2">
                                  {analysisSections.utilization || 'Not available in report.'}
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border-0 shadow-md">
                              <CardHeader>
                                <CardTitle className="text-base">5. Inquiry Risk Assessment</CardTitle>
                                <CardDescription>Recent hard pulls, timing, and mitigation</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {analysisStructured?.inquiries?.count != null ? (
                                  <div className="flex items-center gap-3">
                                    <div className="text-2xl font-bold text-amber-600">
                                      {analysisStructured.inquiries.count}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Total inquiries</div>
                                  </div>
                                ) : null}
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap mt-2">
                                  {analysisSections.inquiries || 'Not available in report.'}
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Step-by-Step Plan */}
                          <Card className="border-0 shadow-md">
                            <CardHeader>
                              <CardTitle className="text-base">6. Score Improvement Plan (Step-by-Step)</CardTitle>
                              <CardDescription>Actionable timeline for disputes, utilization, and tradelines</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {(analysisStructured?.plan_steps?.length ?? 0) > 0 ? (
                                <ol className="space-y-3">
                                  {analysisStructured.plan_steps.map((step: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3">
                                      <div className="h-6 w-6 rounded-full bg-ocean-blue text-white flex items-center justify-center text-xs mt-0.5">
                                        {idx + 1}
                                      </div>
                                      <div className="text-sm">{step}</div>
                                    </li>
                                  ))}
                                </ol>
                              ) : analysisSections.planSteps?.length ? (
                                <ol className="space-y-3">
                                  {analysisSections.planSteps.map((step: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3">
                                      <div className="h-6 w-6 rounded-full bg-ocean-blue text-white flex items-center justify-center text-xs mt-0.5">
                                        {idx + 1}
                                      </div>
                                      <div className="text-sm">{step}</div>
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                <div className="text-sm text-muted-foreground">Not available in report.</div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div className="p-3 rounded-md bg-muted text-sm whitespace-pre-wrap">
                          {analysisResult}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live feature enabled */}
      </div>
    </DashboardLayout>
  );
}
