import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { FileText, Building2, User, ArrowLeft, CreditCard, Shield, DollarSign, CheckCircle, AlertCircle, Clock } from "lucide-react";

type CardType = "personal" | "business";

interface FundingCard {
  id: number;
  card_image?: string;
  bank_id: number;
  bank_name?: string;
  bank_logo?: string;
  card_name: string;
  card_link: string;
  card_type: CardType;
  funding_type: string;
  credit_bureaus: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminInputs {
  status: "approved" | "not_approved";
  amountApproved?: number;
  description?: string;
}

function formatCurrency(n: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);
  } catch {
    return `$${(n || 0).toFixed(2)}`;
  }
}

export default function FundingDIY() {
  const navigate = useNavigate();
  const { type } = useParams();
  const { toast } = useToast();
  const isBusiness = type === "business";
  const isPersonal = type === "personal";
  const resolvedType: CardType | null = isBusiness ? "business" : isPersonal ? "personal" : null;

  const [cards, setCards] = useState<FundingCard[]>([]);
  const [allCards, setAllCards] = useState<FundingCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBureau, setSelectedBureau] = useState<string>("all");
  const [selectedFundingType, setSelectedFundingType] = useState<string>("all");
  const [adminData, setAdminData] = useState<Record<number, AdminInputs>>({});
  const [lockedMap, setLockedMap] = useState<Record<number, { status: string; amount_approved: number; admin_percent: number; description?: string }>>({});
  const [globalAdminPercent, setGlobalAdminPercent] = useState<number>(0);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { userProfile } = useAuthContext();
  // Accept multiple query param names to preserve client context from previous pages
  const clientIdFromQuery = Number(
    searchParams.get("client_id") ||
    searchParams.get("clientId") ||
    searchParams.get("client") ||
    ""
  );
  // Also accept clientId via navigation state (cleaner URLs)
  const state = (location.state as { clientId?: number } | null) || null;
  const clientIdFromState = Number(state?.clientId ?? "");
  // If the logged-in user is a client, default to their own ID
  const clientIdFromAuth = userProfile?.role === "client" ? Number(userProfile?.id) : NaN;
  // Resolve first valid clientId from query, navigation state, then auth
  const clientIdDetected = [clientIdFromQuery, clientIdFromState, clientIdFromAuth].find(
    (id) => Number.isFinite(id) && (id as number) > 0
  ) || 0;
  const [clientIdInput, setClientIdInput] = useState<number>(clientIdDetected);
  const [firstApprovedSubmitted, setFirstApprovedSubmitted] = useState<boolean>(false);
  const [invoiceMap, setInvoiceMap] = useState<Record<number, { token: string; url: string }>>({});

  const bureaus = ["all", "Equifax", "Experian", "TransUnion"];
  const fundingTypes = useMemo(() => {
    const unique = Array.from(new Set((cards || []).map((c) => c.funding_type).filter(Boolean)));
    return ["all", ...unique];
  }, [cards]);

  // Client details for eligibility
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [clientLoading, setClientLoading] = useState<boolean>(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Three-slot selection workflow state
  type SlotForm = {
    bankId?: number;
    cardId?: number;
    fundingType?: string;
    emergencyNotes?: string;
    altContact?: string;
    limitOverride?: number;
  };
  const [slotForms, setSlotForms] = useState<SlotForm[]>([{}]);
  const [bankSearchMap, setBankSearchMap] = useState<Record<number, string>>({});
  const [selectedSlots, setSelectedSlots] = useState<Array<{ bankId: number; cardId: number }>>([]);

  const [banks, setBanks] = useState<Array<{ id: number; name: string; logo?: string; state?: string | string[]; credit_bureaus?: string[] }>>([]);

  const banksFromCards = useMemo(() => {
    const map = new Map<number, { id: number; name: string; logo?: string }>();
    for (const c of cards) {
      if (c.bank_id && !map.has(c.bank_id)) {
        map.set(c.bank_id, { id: c.bank_id, name: c.bank_name || `Bank #${c.bank_id}`, logo: c.bank_logo });
      }
    }
    return Array.from(map.values());
  }, [cards]);

  const allBanks = useMemo(() => {
    if (banks && banks.length > 0) return banks;
    return banksFromCards;
  }, [banks, banksFromCards]);

  const canonBureau = (s: string): 'Experian' | 'Equifax' | 'TransUnion' | null => {
    const t = String(s || '').toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');
    if (t === 'experian' || t === 'ex' || t === 'exp') return 'Experian';
    if (t === 'equifax' || t === 'eq' || t === 'equ') return 'Equifax';
    if (t === 'transunion' || t === 'tu' || t === 'transu') return 'TransUnion';
    return null;
  };
  const cardHasBureau = (card: FundingCard, bureau: 'Experian' | 'Equifax' | 'TransUnion') => {
    const raw: any = (card as any).credit_bureaus;
    const arr = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
        ? raw.split(/[\,|]/).map((x: string) => x.trim()).filter(Boolean)
        : [];
    const canon = arr.map(canonBureau).filter(Boolean) as string[];
    return canon.includes(bureau);
  };

  

  // Fetch client details for eligibility (state and scores)
  useEffect(() => {
    const clientId = (Number.isFinite(clientIdDetected) && clientIdDetected > 0) ? clientIdDetected : clientIdInput;
    if (!clientId || clientId <= 0) return;
    const fetchClient = async () => {
      try {
        setClientLoading(true);
        setClientError(null);
        const resp = await fetch(`/api/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        if (!resp.ok) throw new Error("Failed to fetch client details");
        const data = await resp.json();
        setClientDetails(data);
      } catch (err: any) {
        setClientError(err?.message || "Failed to load client");
      } finally {
        setClientLoading(false);
      }
    };
    fetchClient();
  }, [clientIdDetected, clientIdInput]);

  // Derive fundable bureaus from explicit DB flags on clients table
  const fundableBureaus = useMemo(() => {
    const out: string[] = [];
    const normalize = (v: any) => {
      if (typeof v === 'boolean') return v;
      const n = Number(v);
      if (Number.isFinite(n)) return n === 1;
      const s = String(v || '').toLowerCase();
      return s === 'true' || s === 'yes' || s === '1';
    };
    try {
      const exFlag = normalize((clientDetails as any)?.fundable_in_ex);
      const eqFlag = normalize((clientDetails as any)?.fundable_in_eq);
      const tuFlag = normalize((clientDetails as any)?.fundable_in_tu);
      if (exFlag) out.push("Experian");
      if (eqFlag) out.push("Equifax");
      if (tuFlag) out.push("TransUnion");
    } catch {}
    return out;
  }, [clientDetails]);

  const clientFundableFlags = useMemo(() => ({
    Experian: fundableBureaus.includes("Experian"),
    Equifax: fundableBureaus.includes("Equifax"),
    TransUnion: fundableBureaus.includes("TransUnion"),
  }), [fundableBureaus]);

  const US_STATE_CODES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];

  const resolveClientState = (): string | null => {
    const raw = String(clientDetails?.state || '').trim();
    const upper = raw.toUpperCase();
    if (US_STATE_CODES.includes(upper)) return upper;
    const addr = String(clientDetails?.address || '').toUpperCase();
    if (addr) {
      const tokens = addr.replace(/[^A-Z0-9]/g, ' ').split(/\s+/).filter(Boolean);
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.length === 2 && US_STATE_CODES.includes(t)) return t;
        const m = t.match(/^([A-Z]{2})$/);
        if (m && US_STATE_CODES.includes(m[1])) return m[1];
      }
      const withZip = addr.match(/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/);
      if (withZip && US_STATE_CODES.includes(withZip[1])) return withZip[1];
    }
    return null;
  };

  useEffect(() => {
    const s = resolveClientState();
    setSelectedState(s);
  }, [clientDetails]);

  // Eligibility helpers
  const bankEligibility = (bankId?: number) => {
    const state = String((selectedState || resolveClientState() || '')).toUpperCase();
    const cardsByBank = allCards.filter(c => c.bank_id === bankId);
    let stateRank = 0;
    let isNationwide = false;
    const norm = (s: string) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const nationwideTokens = new Set<string>([
      'USA','US','ALL','ANY','NATIONWIDE','ALLSTATES','ANYSTATE','UNITEDSTATES','UNITEDSTATESOFAMERICA','ANYWHERE','50STATES'
    ]);
    const bankObj = allBanks.find(b => b.id === bankId);
    const bankStatesRaw: any = bankObj?.state;
    const bankStatesArr: string[] = Array.isArray(bankStatesRaw)
      ? bankStatesRaw
      : (typeof bankStatesRaw === 'string' && bankStatesRaw.trim().length > 0
        ? (() => { try { const parsed = JSON.parse(bankStatesRaw); return Array.isArray(parsed) ? parsed : [bankStatesRaw]; } catch { return [bankStatesRaw]; } })()
        : []);
    const bankStatesUpper = bankStatesArr.map(s => String(s).toUpperCase());
    const bankStatesNorm = bankStatesArr.map(norm);
    if (bankStatesUpper.some(s => ['USA','US','ALL','ANY','NATIONWIDE'].includes(s)) || bankStatesNorm.some(t => nationwideTokens.has(t))) {
      isNationwide = true;
      stateRank = Math.max(stateRank, 2);
    }
    if (state && (bankStatesUpper.includes(state) || bankStatesNorm.includes(norm(state)))) {
      stateRank = Math.max(stateRank, 3);
    }
    const isCardEligible = (c: any) => {
      const rawStates: any = (c as any).states;
      let statesArr: string[] = Array.isArray(rawStates)
        ? rawStates
        : typeof rawStates === 'string'
          ? rawStates.split(/[\,|]/).map((s: string) => String(s).trim()).filter(Boolean)
          : [];
      const upperStates = statesArr.map((s: string) => s.toUpperCase());
      const normalizedStates = statesArr.map(norm);
      const stateVal = (c as any).state || null;
      const stateValUpper = stateVal ? String(stateVal).toUpperCase() : '';
      const stateValNorm = norm(stateValUpper);
      if (upperStates.includes('USA') || upperStates.includes('US') || upperStates.includes('ALL') || upperStates.includes('ANY') || normalizedStates.some(t => nationwideTokens.has(t))) {
        stateRank = Math.max(stateRank, 2);
        isNationwide = true;
        return true;
      }
      if (['USA', 'US', 'ALL', 'ANY', 'NATIONWIDE'].includes(stateValUpper) || nationwideTokens.has(stateValNorm)) {
        stateRank = Math.max(stateRank, 2);
        isNationwide = true;
        return true;
      }
      if (stateValUpper && stateValUpper === state) {
        stateRank = Math.max(stateRank, 3);
        return true;
      }
      if (upperStates.length > 0 && upperStates.includes(state)) {
        stateRank = Math.max(stateRank, 3);
        return true;
      }
      if (!stateValUpper && upperStates.length === 0) {
        stateRank = Math.max(stateRank, 1);
        return true;
      }
      return false;
    };
    const stateEligible = cardsByBank.some(isCardEligible) || isNationwide || (state && (bankStatesUpper.includes(state) || bankStatesNorm.includes(norm(state))));
    const bureauEligible = {
      Experian: cardsByBank.some(c => cardHasBureau(c, 'Experian')) || Boolean((bankObj as any)?.credit_bureaus?.includes('Experian')),
      Equifax: cardsByBank.some(c => cardHasBureau(c, 'Equifax')) || Boolean((bankObj as any)?.credit_bureaus?.includes('Equifax')),
      TransUnion: cardsByBank.some(c => cardHasBureau(c, 'TransUnion')) || Boolean((bankObj as any)?.credit_bureaus?.includes('TransUnion')),
    };
    return { stateEligible, bureauEligible, stateRank, isNationwide };
  };

  const sortedBanks = useMemo(() => {
    return [...allBanks].sort((a, b) => {
      const eligA = bankEligibility(a.id);
      const eligB = bankEligibility(b.id);
      const scoreA = Number(eligA.stateRank || (eligA.stateEligible ? 1 : 0));
      const scoreB = Number(eligB.stateRank || (eligB.stateEligible ? 1 : 0));
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });
  }, [allBanks, selectedState, allCards]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = resolvedType ? `/api/cards?type=${resolvedType}&status=active` : `/api/cards?status=active`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        if (!response.ok) throw new Error("Failed to fetch funding cards");
        const data = await response.json();
        const fetched = (data.cards || []) as FundingCard[];
        setCards(fetched);
        setAdminData((prev) => {
          const next = { ...prev };
          for (const c of fetched) {
            if (!next[c.id]) {
              next[c.id] = { status: "not_approved", amountApproved: 0, description: "" };
            }
          }
          return next;
        });
      } catch (err: any) {
        console.error("Error fetching cards:", err);
        setError(err?.message || "Failed to load cards");
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [resolvedType]);

  useEffect(() => {
    const fetchAllCards = async () => {
      try {
        const resp = await fetch(`/api/cards?status=active`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const fetched = (data.cards || []) as FundingCard[];
        setAllCards(fetched);
      } catch {}
    };
    fetchAllCards();
  }, []);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const all: Array<{ id: number; name: string; logo?: string; state?: string | string[]; credit_bureaus?: string[] }> = [];
        let page = 1;
        const limit = 1000;
        while (true) {
          const resp = await fetch(`/api/banks?page=${page}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resp.ok) break;
          const data = await resp.json();
          const items = (data.banks || []).map((b: any) => ({
            id: Number(b.id),
            name: String(b.name || b.bank_name || `Bank #${b.id}`),
            logo: b.logo || b.bank_logo,
            state: b?.state ?? undefined,
            credit_bureaus: Array.isArray(b?.credit_bureaus)
              ? b.credit_bureaus
              : (typeof b?.credit_bureaus === 'string'
                ? (() => { try { const arr = JSON.parse(b.credit_bureaus); return Array.isArray(arr) ? arr : []; } catch { return []; } })()
                : [])
          }));
          all.push(...items);
          const totalPages = Number((data?.pagination?.totalPages ?? 1));
          if (!Number.isFinite(totalPages) || page >= totalPages) break;
          page += 1;
        }
        setBanks(all);
      } catch {}
    };
    fetchBanks();
  }, []);

  // Fetch existing submissions to lock approved cards for the selected client
  useEffect(() => {
    const clientId = (Number.isFinite(clientIdDetected) && clientIdDetected > 0) ? clientIdDetected : clientIdInput;
    if (!resolvedType || !clientId || clientId <= 0) return;
    const fetchSubmissions = async () => {
      try {
        const resp = await fetch(`/api/funding/diy-submissions?client_id=${clientId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });
        if (!resp.ok) return; // ignore silently
        const data = await resp.json();
        const rows = (data?.data || []) as Array<{
          card_id: number;
          status: string;
          amount_approved: number;
          admin_percent: number;
          description?: string;
        }>;
        const nextLocked: Record<number, { status: string; amount_approved: number; admin_percent: number; description?: string }> = {};
        const nextAdmin: Record<number, AdminInputs> = {};
        rows.forEach((row) => {
          if (String(row.status) === "approved") {
            nextLocked[row.card_id] = {
              status: row.status,
              amount_approved: Number(row.amount_approved || 0),
              admin_percent: Number(row.admin_percent || 0),
              description: row.description || "",
            };
            nextAdmin[row.card_id] = {
              status: "approved",
              amountApproved: Number(row.amount_approved || 0),
              description: row.description || "",
            };
          }
        });
        if (Object.keys(nextAdmin).length > 0) {
          setAdminData((prev) => ({ ...prev, ...nextAdmin }));
          setLockedMap(nextLocked);
        } else {
          setLockedMap({});
        }
      } catch (err) {
        // non-blocking
      }
    };
    fetchSubmissions();
  }, [resolvedType, clientIdDetected, clientIdInput]);

  const filteredCards = useMemo(() => {
    const byType = selectedFundingType === "all"
      ? cards
      : cards.filter((c) => (c.funding_type || "").toLowerCase() === selectedFundingType.toLowerCase());
    if (selectedBureau === "all") return byType;
    const canon = canonBureau(selectedBureau);
    if (!canon) return byType;
    return byType.filter((c) => cardHasBureau(c, canon));
  }, [cards, selectedFundingType, selectedBureau]);

  // Summary metrics across all cards (not just filtered)
  const { totalFunding, highestAmount, amountCharged } = useMemo(() => {
    let total = 0;
    let highest = 0;
    let charged = 0;
    for (const c of cards) {
      const a = adminData[c.id];
      if (a?.status === "approved" && (a.amountApproved || 0) > 0) {
        const amt = a.amountApproved || 0;
        total += amt;
        highest = Math.max(highest, amt);
        charged += amt * ((globalAdminPercent || 0) / 100);
      }
    }
    return { totalFunding: total, highestAmount: highest, amountCharged: charged };
  }, [cards, adminData, globalAdminPercent]);

  const hasAnyApproved = useMemo(() => {
    return cards.some((c) => adminData[c.id]?.status === "approved" && (adminData[c.id]?.amountApproved || 0) > 0);
  }, [cards, adminData]);

  const updateAdmin = (cardId: number, patch: Partial<AdminInputs>) => {
    setAdminData((prev) => ({ ...prev, [cardId]: { ...prev[cardId], ...patch } }));
  };

  const submitCard = async (card: FundingCard) => {
    const clientId = (Number.isFinite(clientIdDetected) && clientIdDetected > 0) ? clientIdDetected : clientIdInput;
    if (!clientId || clientId <= 0) {
      toast({ title: "Client ID required", description: "Please provide a valid client ID to save submissions.", variant: "destructive" });
      return;
    }
    const payload = {
      client_id: clientId,
      card_id: card.id,
      card_type: card.card_type,
      status: adminData[card.id]?.status || "not_approved",
      amount_approved: adminData[card.id]?.amountApproved || 0,
      admin_percent: globalAdminPercent || 0,
      description: adminData[card.id]?.description || "",
      credit_bureaus: card.credit_bureaus || [],
    };
    try {
      const resp = await fetch("/api/funding/diy-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        let message = "Failed to submit admin card data";
        try {
          const errData = await resp.json();
          message = errData?.error || message;
        } catch {}
        if (resp.status === 409) {
          toast({ title: "Locked", description: message || "Submission already approved and locked.", variant: "destructive" });
          // Refresh locked map
          setLockedMap((prev) => ({ ...prev, [card.id]: { status: "approved", amount_approved: payload.amount_approved, admin_percent: payload.admin_percent, description: payload.description } }));
          return;
        }
        throw new Error(message);
      }
      toast({ title: "Submitted", description: `${card.card_name} saved successfully.` });
      if ((payload.status === "approved") && (payload.amount_approved || 0) > 0) {
        setFirstApprovedSubmitted(true);
        // Auto-generate a separate invoice for this card approval
        await generateInvoiceForCard(card, clientId);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      toast({ title: "Submission failed", description: err?.message || "Could not save", variant: "destructive" });
    }
  };

  const generateInvoiceForCard = async (card: FundingCard, clientIdOverride?: number) => {
    try {
      const clientId = clientIdOverride ?? ((Number.isFinite(clientIdDetected) && clientIdDetected > 0) ? clientIdDetected : clientIdInput);
      if (!clientId || clientId <= 0) {
        toast({ title: "Client ID required", description: "Please provide a valid client ID to generate an invoice.", variant: "destructive" });
        return;
      }
      const adminId = Number(userProfile?.id || 0);
      const amt = Number(adminData[card.id]?.amountApproved || 0);
      const feePercent = Number(globalAdminPercent || 0);
      const feeAmount = Number((amt * (feePercent / 100)).toFixed(2));
      if (!(amt > 0) || !(feeAmount > 0)) {
        toast({ title: "Invalid amounts", description: "Approved amount or admin fee is missing.", variant: "destructive" });
        return;
      }
      const description = `Card: ${card.card_name} | Approved: ${formatCurrency(amt)} | Admin Fee: ${feePercent}%`;
      const resp = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: adminId || 1,
          client_id: clientId,
          currency: 'USD',
          line_items: [{ description, quantity: 1, unit_price: feeAmount }],
          tax_rate: 0,
          notes: `Funding admin fee for ${card.card_name}`,
        })
      });
      if (!resp.ok) throw new Error('Failed to create invoice');
      const data = await resp.json();
      const token = data?.data?.public_token;
      const publicUrl = data?.data?.public_url;
      if (!token || !publicUrl) throw new Error('Invalid invoice response');
      setInvoiceMap(prev => ({ ...prev, [card.id]: { token, url: publicUrl } }));
      // Fire-and-forget email send to client
      fetch(`/api/invoices/public/${token}/send-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
      toast({ title: 'Invoice generated', description: `Invoice created for ${card.card_name}.`, });
      return { token, publicUrl };
    } catch (err: any) {
      console.error('Generate invoice error:', err);
      toast({ title: 'Invoice error', description: err?.message || 'Could not generate invoice', variant: 'destructive' });
    }
  };

  const handleViewInvoice = async (card: FundingCard) => {
    const existing = invoiceMap[card.id];
    if (existing?.token) {
      navigate(`/invoice/${existing.token}`);
      return;
    }
    const created = await generateInvoiceForCard(card);
    const token = created?.token || invoiceMap[card.id]?.token;
    if (token) {
      navigate(`/invoice/${token}`);
      return;
    }
    toast({ title: 'Invoice not available yet', description: 'Please try again in a few seconds.', variant: 'destructive' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                DIY Funding Cards {isBusiness ? "— Business" : isPersonal ? "— Personal" : ""}
              </h1>
              <p className="text-sm text-muted-foreground">Admin can configure approvals, percentages, notes and submit.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        </div>

        {/* Global Admin Percentage */}
        {resolvedType && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Percentage (applies to all cards)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clientIdDetected > 0 ? (
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <p className="text-sm text-muted-foreground">Using Client ID {clientIdDetected} (auto-detected).</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    type="number"
                    min="1"
                    value={Number.isFinite(clientIdInput) ? clientIdInput : 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value || "0", 10);
                      setClientIdInput(Number.isFinite(val) ? val : 0);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Auto-detected when passed via URL, navigation, or client profile.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Client State</Label>
                <p className="text-sm text-muted-foreground">Detected from address: {resolveClientState() || 'Not detected'}</p>
                <Select value={String(selectedState || '')} onValueChange={(v) => setSelectedState(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATE_CODES.map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="global-admin-percent">Admin Percentage (%)</Label>
                <Input
                  id="global-admin-percent"
                  type="number"
                  step="0.1"
                  min="0"
                  value={Number.isFinite(globalAdminPercent) ? globalAdminPercent : 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value || "0");
                    setGlobalAdminPercent(Number.isFinite(val) ? val : 0);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Applies Globally</Label>
                <p className="text-sm text-muted-foreground">
                  Charged amounts and metrics use this percentage for all approved cards.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Type selector when none chosen */}
        {!resolvedType && (
          <Card>
            <CardHeader>
              <CardTitle>Select funding type</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={() => navigate("/funding/diy/personal", { state: { clientId: (clientIdDetected > 0 ? clientIdDetected : clientIdInput) || undefined } })}>Personal DIY</Button>
              <Button onClick={() => navigate("/funding/diy/business", { state: { clientId: (clientIdDetected > 0 ? clientIdDetected : clientIdInput) || undefined } })} variant="secondary">Business DIY</Button>
            </CardContent>
          </Card>
        )}

        {/* Metrics */}
        {resolvedType && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Funding (Across All Cards)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalFunding)}</div>
                <p className="text-xs text-muted-foreground">Sum of approved amounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Highest Amount (Top Card)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(highestAmount)}</div>
                <p className="text-xs text-muted-foreground">Largest approved amount</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Amount Charged (Admin Percentage)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(amountCharged)}</div>
                <p className="text-xs text-muted-foreground">Calculated from the global admin %</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading / Error */}
        {resolvedType && loading && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Loading {isBusiness ? "Business" : "Personal"} Cards...
            </h3>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          </div>
        )}
        {resolvedType && !loading && error && (
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {/* Three-Slot Selection Workflow */}
        {resolvedType && !loading && !error && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  {isBusiness ? <Building2 className="h-6 w-6 text-green-600" /> : <User className="h-6 w-6 text-green-600" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">{isBusiness ? "Business" : "Personal"} DIY Funding: Compare up to 3 options</h3>
                  <p className="text-sm text-green-600 font-medium">Select a bank, review eligibility, add cards to compare.</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Funding Type</Label>
                  <Tabs value={selectedFundingType} onValueChange={setSelectedFundingType}>
                    <TabsList className="flex flex-wrap">
                      {fundingTypes.map((ft) => (
                        <TabsTrigger key={ft} value={ft}>{ft}</TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <div className="space-y-2">
                  <Label>Bureau</Label>
                  <Tabs value={selectedBureau} onValueChange={setSelectedBureau}>
                    <TabsList className="flex flex-wrap">
                      {bureaus.map((b) => (
                        <TabsTrigger key={b} value={b}>{b}</TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {slotForms.map((slot, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-white">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Bank</Label>
                        {slotForms.length > 1 && (
                          <Button variant="ghost" onClick={() => setSlotForms((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                        )}
                      </div>
                      <Select
                        value={String(slot.bankId || '')}
                        onValueChange={(v) => {
                          const id = parseInt(v);
                          setSlotForms((prev) => {
                            const next = [...prev];
                            next[idx] = { bankId: id, fundingType: next[idx]?.fundingType, cardId: undefined };
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Search banks..."
                              value={bankSearchMap[idx] || ''}
                              onChange={(e) => setBankSearchMap((prev) => ({ ...prev, [idx]: e.target.value }))}
                            />
                          </div>
                          {(sortedBanks.filter((b) => {
                            const q = String(bankSearchMap[idx] || '').toLowerCase();
                            return q ? String(b.name || '').toLowerCase().includes(q) : true;
                          })).map((b) => {
                            const elig = bankEligibility(b.id);
                            return (
                              <SelectItem key={b.id} value={String(b.id)}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    {b.logo ? (
                                      <img src={b.logo} alt={b.name} className="h-4 w-4 rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                      <Building2 className="h-4 w-4" />
                                    )}
                                    <span>{b.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className={elig.stateEligible ? 'text-green-600' : 'text-red-500'}>{elig.stateEligible ? (elig.isNationwide ? '✅' : '✔') : '❌'} State</span>
                                    <span className={elig.bureauEligible.Experian && clientFundableFlags.Experian ? 'text-green-600' : 'text-red-500'}>EX {elig.bureauEligible.Experian && clientFundableFlags.Experian ? '✔' : '❌'}</span>
                                    <span className={elig.bureauEligible.Equifax && clientFundableFlags.Equifax ? 'text-green-600' : 'text-red-500'}>EQ {elig.bureauEligible.Equifax && clientFundableFlags.Equifax ? '✔' : '❌'}</span>
                                    <span className={elig.bureauEligible.TransUnion && clientFundableFlags.TransUnion ? 'text-green-600' : 'text-red-500'}>TU {elig.bureauEligible.TransUnion && clientFundableFlags.TransUnion ? '✔' : '❌'}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {selectedFundingType === "all" && (
                        <>
                          <Label>Funding Type</Label>
                          <Select
                            value={String(slot.fundingType || '')}
                            onValueChange={(v) => {
                              setSlotForms((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], fundingType: v, cardId: undefined };
                                return next;
                              });
                            }}
                            disabled={!slot.bankId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select funding type" />
                            </SelectTrigger>
                            <SelectContent>
                              {fundingTypes.filter((ft) => ft !== 'all').map((ft) => (
                                <SelectItem key={ft} value={ft}>{ft}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}

                      <Label>Card</Label>
                      <Select
                        value={String(slot.cardId || '')}
                        onValueChange={(v) => {
                          const id = parseInt(v);
                          setSlotForms((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], cardId: id };
                            return next;
                          });
                        }}
                        disabled={!slot.bankId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select card" />
                        </SelectTrigger>
                        <SelectContent>
                          {(cards.length > 0 ? cards : allCards)
                            .filter(c => c.bank_id === slot.bankId && c.card_type === resolvedType)
                            .filter(c => {
                              const effective = selectedFundingType === 'all' ? (slot.fundingType || 'all') : selectedFundingType;
                              if (effective === 'all') return true;
                              return (c.funding_type || '').toLowerCase() === String(effective).toLowerCase();
                            })
                            .filter(c => {
                              if (selectedBureau === 'all') return true;
                              const canon = canonBureau(selectedBureau);
                              if (!canon) return true;
                              return cardHasBureau(c, canon);
                            })
                            .sort((a, b) => {
                              const elig = slot.bankId ? bankEligibility(slot.bankId) : { stateEligible: false, bureauEligible: { Experian: false, Equifax: false, TransUnion: false } } as any;
                              const scoreFor = (card: typeof a) => {
                                const bureauMatch = (
                                  (cardHasBureau(card, 'Experian') && clientFundableFlags.Experian && elig.bureauEligible.Experian) ||
                                  (cardHasBureau(card, 'Equifax') && clientFundableFlags.Equifax && elig.bureauEligible.Equifax) ||
                                  (cardHasBureau(card, 'TransUnion') && clientFundableFlags.TransUnion && elig.bureauEligible.TransUnion)
                                );
                                return (elig.stateEligible ? 1 : 0) + (bureauMatch ? 1 : 0);
                              };
                              return scoreFor(b) - scoreFor(a);
                            })
                            .map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{c.card_name}</span>
                                  <div className="flex gap-1">
                                    {(c.credit_bureaus || []).map(b => (
                                      <Badge key={b} variant="outline" className="text-[10px]">{b}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {slot.cardId && (() => {
                        const card = cards.find(c => c.id === slot.cardId);
                        const bank = banks.find(b => b.id === slot.bankId);
                        if (!card) return null;
                        return (
                          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-300 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <CardHeader className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  {card.bank_logo ? (
                                    <img
                                      src={card.bank_logo}
                                      alt={`${card.bank_name || 'Bank'} logo`}
                                      className="h-8 w-8 rounded-full object-cover shadow-md"
                                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                      <Building2 className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm text-gray-600 font-medium">{bank?.name || card.bank_name}</div>
                                    <div className="text-base font-bold text-gray-800">{card.card_name}</div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs font-medium">{card.funding_type}</Badge>
                              </div>
                              <div className="flex justify-center mb-4">
                                {card.card_image ? (
                                  <img
                                    src={card.card_image}
                                    alt={card.card_name}
                                    className="h-24 w-38 rounded-lg object-cover shadow-md group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/uploads/card.png'; }}
                                  />
                                ) : (
                                  <img
                                    src="/uploads/card.png"
                                    alt="Default card"
                                    className="h-24 w-38 rounded-lg object-cover shadow-md group-hover:scale-105 transition-transform duration-300"
                                  />
                                )}
                              </div>
                              <div className="flex flex-wrap justify-center gap-2">
                                {(card.credit_bureaus || []).map((bureau) => (
                                  <span key={bureau} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {bureau}
                                  </span>
                                ))}
                              </div>
                            </CardHeader>
                            <CardContent className="relative z-10 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor={`status-${card.id}`}>Approval Status</Label>
                                  <Select
                                    value={adminData[card.id]?.status || "not_approved"}
                                    onValueChange={(v) => updateAdmin(card.id, { status: v as any, ...(v !== "approved" ? { amountApproved: 0 } : {}) })}
                                    disabled={Boolean(lockedMap[card.id])}
                                  >
                                    <SelectTrigger id={`status-${card.id}`}>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="approved">Approved</SelectItem>
                                      <SelectItem value="not_approved">Not Approved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`amt-${card.id}`}>Amount Approved (USD)</Label>
                                  <Input
                                    id={`amt-${card.id}`}
                                    type="number"
                                    min="0"
                                    value={(adminData[card.id]?.amountApproved ?? 0).toString()}
                                    disabled={adminData[card.id]?.status !== "approved" || Boolean(lockedMap[card.id])}
                                    onChange={(e) => updateAdmin(card.id, { amountApproved: parseFloat(e.target.value || "0") })}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`desc-${card.id}`}>Description / Notes</Label>
                                <Textarea
                                  id={`desc-${card.id}`}
                                  rows={4}
                                  placeholder="Add description or instructions for this card"
                                  value={adminData[card.id]?.description || ''}
                                  onChange={(e) => updateAdmin(card.id, { description: e.target.value })}
                                  disabled={Boolean(lockedMap[card.id])}
                                />
                              </div>
                              <Button onClick={() => window.open(card.card_link, '_blank')} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                <DollarSign className="h-4 w-4 mr-2" /> Apply Now
                              </Button>
                              <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="h-3 w-3 mr-1" /> Updated {new Date(card.updated_at).toLocaleDateString()}
                                </p>
                                <div className="flex items-center gap-2">
                                  {lockedMap[card.id] ? (
                                    <>
                                      <Badge variant="secondary" className="mr-2">Approved & Locked</Badge>
                                      <Button variant="secondary" onClick={() => handleViewInvoice(card)}>
                                        <FileText className="h-4 w-4 mr-2" /> View Invoice
                                      </Button>
                                    </>
                                  ) : (
                                    invoiceMap[card.id]?.token ? (
                                      <Button variant="secondary" onClick={() => navigate(`/invoice/${invoiceMap[card.id].token}`)}>
                                        <FileText className="h-4 w-4 mr-2" /> View Invoice
                                      </Button>
                                    ) : (
                                      <Button variant="outline" onClick={() => generateInvoiceForCard(card)}>
                                        <FileText className="h-4 w-4 mr-2" /> Generate Invoice
                                      </Button>
                                    )
                                  )}
                                  {lockedMap[card.id] ? (
                                    <Button disabled className="bg-gray-300">
                                      <CheckCircle className="h-4 w-4 mr-2" /> Submitted
                                    </Button>
                                  ) : (
                                    <Button onClick={() => submitCard(card)} className="bg-green-600 hover:bg-green-700">
                                      <CheckCircle className="h-4 w-4 mr-2" /> Submit
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </div>
                  </div>
                ))}
                <div className="p-4 rounded-lg border-2 border-dashed bg-white flex items-center justify-center">
                  <Button variant="outline" onClick={() => setSlotForms((prev) => [...prev, {}])}>+</Button>
                </div>
              </div>
              
              {/* Comparison Summary */}
              {selectedSlots.length > 0 && (
                <div className="mt-6">
                  <Label>Comparison</Label>
                  <div className="grid md:grid-cols-3 gap-4 mt-2">
                    {selectedSlots.map((sel, idx) => {
                      const card = cards.find(c => c.id === sel.cardId);
                      if (!card) return null;
                      const bank = banks.find(b => b.id === sel.bankId);
                      return (
                        <Card key={`${sel.cardId}-${idx}`}>
                          <CardHeader>
                            <CardTitle className="text-sm">{bank?.name || card.bank_name} — {card.card_name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              <Badge>{card.funding_type}</Badge>
                              {(card.credit_bureaus || []).map(b => (<Badge key={b} variant="outline">{b}</Badge>))}
                              {Array.isArray((card as any).states) && (card as any).states.length > 0 ? (
                                <Badge variant="secondary">{(card as any).states.join(', ')}</Badge>
                              ) : ((card as any).state ? <Badge variant="secondary">{(card as any).state}</Badge> : null)}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button variant="outline" onClick={() => window.open(card.card_link, '_blank')}>Apply</Button>
                              <Button variant="destructive" onClick={() => setSelectedSlots((prev) => prev.filter(p => p.cardId !== sel.cardId))}>Remove</Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
