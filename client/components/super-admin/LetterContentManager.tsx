import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  FileText,
  Copy,
  X,
  BookOpen,
  Layers,
  FolderOpen,
  Sparkles,
  LayoutGrid,
  ScrollText,
  ArrowRight,
} from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BUREAUS = ["EX", "TU", "EQ"] as const;
const UI_BUREAU = "ALL" as const;
const BUREAU_LABELS: Record<string, string> = {
  ALL: "Shared Templates",
  EX: "Experian",
  TU: "TransUnion",
  EQ: "Equifax",
};
const BUREAU_COLORS: Record<string, string> = {
  ALL: "bg-slate-800",
  EX: "bg-blue-600",
  TU: "bg-red-600",
  EQ: "bg-green-600",
};
const BUREAU_HEX: Record<string, string> = {
  ALL: "#1d4ed8",
  EX: "#1e40af",
  TU: "#b91c1c",
  EQ: "#15803d",
};
const BUREAU_LIGHT_HEX: Record<string, string> = {
  ALL: "#eff6ff",
  EX: "#eff6ff",
  TU: "#fff1f2",
  EQ: "#f0fdf4",
};
const BUREAU_GRADIENT: Record<string, string> = {
  ALL: "from-blue-600 to-blue-800",
  EX: "from-blue-600 to-blue-800",
  TU: "from-red-600 to-red-800",
  EQ: "from-green-600 to-green-800",
};
const ROUNDS = [1, 2, 3, 4, 5, 6] as const;
const BLOCK_ORDER = [
  "HEADER",
  "INTRO",
  ...Array.from({ length: 18 }, (_, i) => `BLOCK_${i + 1}`),
  "OUTRO",
];
const LETTER_CONTENT_TYPES = ["STANDARD", "ENHANCED"] as const;
const LETTER_CONTENT_TYPE_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  ENHANCED: "Enhanced",
};
const LETTER_CONTENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  STANDARD: "Default shared dispute wording for routine workflows.",
  ENHANCED: "Expanded wording for stronger or more customized disputes.",
};

const ALL_CATEGORIES = [
  "Personal Information",
  "Public Records",
  "Inquiries",
  "Student Loan Charge-Offs/Collections",
  "Medical Charge-Offs/Collections",
  "All Other Charge-Offs/Collections",
  "Student Loan Derogatory Lates (3+)",
  "Medical Derogatory Lates (3+)",
  "All Other Derogatory Lates (3+)",
  "Student Loan Delinquency Lates (1-2)",
  "Medical Delinquency Lates (1-2)",
  "All Other Delinquency Lates (1-2)",
  "Late Payments",
] as const;

const BLOCK_DEFAULT_LABELS: Record<string, string> = {
  BLOCK_1: "Creditor / Furnisher Name",
  BLOCK_2: "Account Number",
  BLOCK_3: "Date Opened",
  BLOCK_4: "Date of First Delinquency",
  BLOCK_5: "Current Balance",
  BLOCK_6: "Payment History",
  BLOCK_7: "Account Status",
  BLOCK_8: "Date of Last Payment",
  BLOCK_9: "Account Ownership / Assignment",
  BLOCK_10: "Monthly Payment Amount",
  BLOCK_11: "Credit Limit / High Credit",
  BLOCK_12: "Original Balance / Loan Amount",
  BLOCK_13: "Terms / Duration of Loan",
  BLOCK_14: "Payment Rating",
  BLOCK_15: "Account Type / Portfolio Type",
  BLOCK_16: "Responsibility (ECOA) Code",
  BLOCK_17: "Compliance Condition Code",
  BLOCK_18: "Special Comment Code",
};

const DEFAULT_HEADER_CLAUSE_CONTENT = `<div style="width: 100%; font-family: 'Times New Roman', serif; color: #000000; font-size: 16px; line-height: 1.15;">
  <table style="width: 100%; border-collapse: collapse;">
    <tbody><tr>
      <td style="width: 60%; vertical-align: top; text-align: left; padding: 0;">
        <div style="font-weight: bold; font-size: 18px;">{{CONSUMER_FULL_NAME}}</div>
        <div>{{CONSUMER_ADDRESS}}</div>
        <div>{{CONSUMER_CITY_STATE_ZIP}}</div>
        <div>Date of Birth: {{CONSUMER_DOB}}</div>
        <div>SSN (Last 4): {{CONSUMER_SSN_LAST4}}</div>
        <div>Email Address: {{CONSUMER_EMAIL}}</div>
        <div>Phone Number: {{CONSUMER_NUMBER}}</div>
      </td>
      <td style="width: 40%; vertical-align: top; text-align: right; padding: 0;">
        <div style="font-weight: bold; font-size: 18px;">{{BUREAU_NAME}}</div>
        <div>{{BUREAU_NAME}}</div>
        <div>{{BUREAU_ADDRESS_1}}</div>
        <div>{{BUREAU_ADDRESS_2}}</div>
      </td>
    </tr>
  </tbody></table>
</div>`;

const getDefaultBlockLabel = (block: string) => {
  if (block === "HEADER") return "Header";
  if (block === "INTRO") return "Intro";
  if (block === "OUTRO") return "Outro";

  if (BLOCK_DEFAULT_LABELS[block]) return BLOCK_DEFAULT_LABELS[block];

  const match = block.match(/^BLOCK_(\d+)$/);
  if (match) return `Block ${match[1]}`;

  return block;
};

const isHeaderBlock = (block: string) => block === "HEADER";

const getDefaultClauseContent = (block: string) =>
  isHeaderBlock(block) ? DEFAULT_HEADER_CLAUSE_CONTENT : "";

const getClausePreview = (content: string) => {
  const plainText = String(content || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) return "Untitled clause";
  if (plainText.length <= 20) return plainText;
  return `${plainText.slice(0, 20).trim()}...`;
};

type Bureau = (typeof BUREAUS)[number];
type TemplateBureau = Bureau | typeof UI_BUREAU;
type LetterContentType = (typeof LETTER_CONTENT_TYPES)[number];

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ContentRow {
  id: number;
  clause_content: string;
  bureau: string;
  round: number;
  category: string;
  type: LetterContentType;
  block: string;
  block_label?: string | null;
  created_at: string;
  updated_at: string;
}

interface SummaryRow {
  bureau: string;
  round: number;
  category: string;
  type: LetterContentType;
  block: string;
  block_label?: string | null;
  variant_count: number;
}

interface TreePath {
  bureau: TemplateBureau;
  category: string;
  type: LetterContentType;
  block: string;
  round: number;
}

type InlineEditorState =
  | { mode: "create"; block: string | null }
  | { mode: "edit"; entryId: number }
  | null;

const API = "/api/dispute-letter-content";

const apiFetch = async (url: string, opts: RequestInit = {}) => {
  const token = localStorage.getItem("auth_token");
  const resp = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${resp.status}`);
  }
  return resp.json();
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function LetterContentManager() {
  const { toast } = useToast();

  // State
  const [categories, setCategories] = useState<string[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [entries, setEntries] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<LetterContentType | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedPath, setSelectedPath] = useState<TreePath | null>(null);

  // Tree expansion state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [expandedTreeBlocks, setExpandedTreeBlocks] = useState<Set<string>>(new Set());
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [editingBlockLabel, setEditingBlockLabel] = useState<string | null>(null);
  const [editingBlockLabelValue, setEditingBlockLabelValue] = useState("");
  const [savingBlockLabel, setSavingBlockLabel] = useState<string | null>(null);

  // Inline editor state
  const [inlineEditor, setInlineEditor] = useState<InlineEditorState>(null);
  const [editingEntry, setEditingEntry] = useState<ContentRow | null>(null);
  const [formRound, setFormRound] = useState<number>(1);
  const [formCategory, setFormCategory] = useState<string>("");
  const [formType, setFormType] = useState<LetterContentType>("STANDARD");
  const [formBlock, setFormBlock] = useState<string>("INTRO");
  const [formBlockLabel, setFormBlockLabel] = useState<string>("");
  const [formContent, setFormContent] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [editingTypeBlock, setEditingTypeBlock] = useState<string | null>(null);
  const [editingTypeBlockLabelValue, setEditingTypeBlockLabelValue] = useState("");
  const [savingTypeBlockLabel, setSavingTypeBlockLabel] = useState<string | null>(null);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<ContentRow | null>(null);
  const [deleteBlockTarget, setDeleteBlockTarget] = useState<{
    category: string;
    type: LetterContentType;
    block: string;
    label: string;
  } | null>(null);

  // â”€â”€â”€ Data loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadCategories = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/categories`);
      setCategories(res.data || []);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams({ bureau: UI_BUREAU });
      const res = await apiFetch(`${API}/summary?${params}`);
      setSummary(res.data || []);
    } catch (err: any) {
      console.error("Failed to load summary:", err);
    }
  }, []);

  const loadEntries = useCallback(async (path: TreePath) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        bureau: path.bureau,
        round: String(path.round),
        category: path.category,
        type: path.type,
      });
      const res = await apiFetch(`${API}?${params}`);
      setEntries(res.data || []);
    } catch (err: any) {
      console.error("Failed to load entries:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCategories();
    loadSummary();
  }, [loadCategories, loadSummary]);

  useEffect(() => {
    if (selectedPath) {
      loadEntries(selectedPath);
    } else {
      setEntries([]);
    }
  }, [selectedPath, loadEntries]);

  // â”€â”€â”€ Summary helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const summaryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of summary) {
      map.set(s.bureau, (map.get(s.bureau) || 0) + s.variant_count);
      const catKey = `${s.bureau}:${s.category}`;
      map.set(catKey, (map.get(catKey) || 0) + s.variant_count);
      const typeKey = `${s.bureau}:${s.category}:${s.type}`;
      map.set(typeKey, (map.get(typeKey) || 0) + s.variant_count);
      const blockKey = `${s.bureau}:${s.category}:${s.type}:${s.block}`;
      map.set(blockKey, (map.get(blockKey) || 0) + s.variant_count);
      const roundKey = `${s.bureau}:${s.category}:${s.type}:${s.block}:${s.round}`;
      map.set(roundKey, s.variant_count);
    }
    return map;
  }, [summary]);

  // Unique rounds with content for each bureau
  const categoriesForPath = useMemo(() => {
    const set = new Set<string>(ALL_CATEGORIES);
    for (const s of summary) {
      set.add(s.category);
    }
    // Merge with categories from DB
    for (const c of categories) {
      set.add(c);
    }
    return Array.from(set).sort();
  }, [summary, categories]);

  // â”€â”€â”€ Entries grouped by block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const entriesByBlock = useMemo(() => {
    const map = new Map<string, ContentRow[]>();
    for (const e of entries) {
      const list = map.get(e.block) || [];
      list.push(e);
      map.set(e.block, list);
    }
    return map;
  }, [entries]);

  // â”€â”€â”€ Tree navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const toggleType = (key: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const toggleTreeBlock = (key: string) => {
    setExpandedTreeBlocks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const resetSelectionState = () => {
    setExpandedBlocks(new Set());
    setEditingBlockLabel(null);
    setEditingBlockLabelValue("");
    setInlineEditor(null);
    setEditingEntry(null);
  };

  const selectCategory = (category: string) => {
    setExpandedCategories((prev) => new Set(prev).add(`${UI_BUREAU}:${category}`));
    setSelectedCategory(category);
    setSelectedType(null);
    setSelectedBlock(null);
    setSelectedRound(null);
    setSelectedPath(null);
    resetSelectionState();
  };

  const selectType = (category: string, type: LetterContentType) => {
    const categoryKey = `${UI_BUREAU}:${category}`;
    setExpandedCategories((prev) => new Set(prev).add(categoryKey));
    setExpandedTypes((prev) => new Set(prev).add(`${categoryKey}:${type}`));
    setSelectedCategory(category);
    setSelectedType(type);
    setSelectedBlock(null);
    setSelectedRound(null);
    setSelectedPath(null);
    resetSelectionState();
  };

  const selectBlock = (
    category: string,
    type: LetterContentType,
    block: string,
  ) => {
    const categoryKey = `${UI_BUREAU}:${category}`;
    const typeKey = `${categoryKey}:${type}`;
    setExpandedCategories((prev) => new Set(prev).add(categoryKey));
    setExpandedTypes((prev) => new Set(prev).add(typeKey));
    setExpandedTreeBlocks((prev) => new Set(prev).add(`${typeKey}:${block}`));
    setSelectedCategory(category);
    setSelectedType(type);
    setSelectedBlock(block);
    setSelectedRound(null);
    setSelectedPath(null);
    resetSelectionState();
  };

  const selectPath = (
    category: string,
    type: LetterContentType,
    block: string,
    round: number,
  ) => {
    const categoryKey = `${UI_BUREAU}:${category}`;
    const typeKey = `${categoryKey}:${type}`;
    const treeBlockKey = `${typeKey}:${block}`;
    setExpandedCategories((prev) => new Set(prev).add(categoryKey));
    setExpandedTypes((prev) => new Set(prev).add(typeKey));
    setExpandedTreeBlocks((prev) => new Set(prev).add(treeBlockKey));
    setSelectedCategory(category);
    setSelectedType(type);
    setSelectedBlock(block);
    setSelectedRound(round);
    setSelectedPath({ bureau: UI_BUREAU, category, type, block, round });
    setExpandedBlocks(new Set([`${UI_BUREAU}:${round}:${category}:${type}:${block}`]));
    setEditingBlockLabel(null);
    setEditingBlockLabelValue("");
    setFormCategory(category);
    setFormType(type);
    setFormBlock(block);
    setFormBlockLabel(getSummaryBlockLabel(category, type, block));
    setFormRound(round);
    setFormContent(getDefaultClauseContent(block));
    setInlineEditor({ mode: "create", block });
    setEditingEntry(null);
  };

  // â”€â”€â”€ Inline editor handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const closeInlineEditor = () => {
    setInlineEditor(null);
    setEditingEntry(null);
  };

  const getStoredBlockLabel = (blockEntries?: ContentRow[]) =>
    String(
      blockEntries?.find((entry) => String(entry.block_label || "").trim())
        ?.block_label || "",
    ).trim();

  const getDisplayBlockLabel = (block: string, blockEntries?: ContentRow[]) =>
    getStoredBlockLabel(blockEntries) || getDefaultBlockLabel(block);

  const getSummaryBlockLabel = useCallback(
    (category: string, type: LetterContentType, block: string) => {
      const summaryLabel = summary.find(
        (item) =>
          item.bureau === UI_BUREAU &&
          item.category === category &&
          item.type === type &&
          item.block === block &&
          String(item.block_label || "").trim(),
      )?.block_label;

      return String(summaryLabel || "").trim() || getDefaultBlockLabel(block);
    },
    [summary],
  );

  const cancelBlockLabelEdit = () => {
    setEditingBlockLabel(null);
    setEditingBlockLabelValue("");
  };

  const cancelTypeBlockEdit = () => {
    setEditingTypeBlock(null);
    setEditingTypeBlockLabelValue("");
  };

  const resetToRoot = () => {
    cancelBlockLabelEdit();
    cancelTypeBlockEdit();
    setSelectedCategory(null);
    setSelectedType(null);
    setSelectedBlock(null);
    setSelectedRound(null);
    setSelectedPath(null);
    setExpandedBlocks(new Set());
    setInlineEditor(null);
    setEditingEntry(null);
  };

  const startBlockLabelEdit = (block: string, blockEntries: ContentRow[]) => {
    setEditingBlockLabel(block);
    setEditingBlockLabelValue(getDisplayBlockLabel(block, blockEntries));
    setInlineEditor(null);
    setEditingEntry(null);
  };

  const saveBlockLabelEdit = async (block: string, defaultLabel: string) => {
    if (!selectedPath) return;

    setSavingBlockLabel(block);
    try {
      const normalizedLabel = editingBlockLabelValue.trim();
      await apiFetch(`${API}/block-label`, {
        method: "PUT",
        body: JSON.stringify({
          bureau: selectedPath.bureau,
          round: selectedPath.round,
          category: selectedPath.category,
          type: selectedPath.type,
          block,
          block_label:
            normalizedLabel && normalizedLabel !== defaultLabel
              ? normalizedLabel
              : null,
        }),
      });
      await loadEntries(selectedPath);
      cancelBlockLabelEdit();
      toast({ title: "Updated", description: "Block name updated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingBlockLabel(null);
    }
  };

  const startCreate = (block?: string) => {
    cancelBlockLabelEdit();
    cancelTypeBlockEdit();
    setEditingEntry(null);
    const nextCategory = selectedPath?.category || selectedCategory || categories[0] || "";
    const nextType = selectedPath?.type || selectedType || "STANDARD";
    const nextBlock = block || selectedPath?.block || selectedBlock || "INTRO";
    const editorBlock = block || selectedPath?.block || selectedBlock || null;
    setFormRound(selectedPath?.round || selectedRound || 1);
    setFormCategory(nextCategory);
    setFormType(nextType);
    setFormBlock(nextBlock);
    setFormBlockLabel(
      selectedPath && nextBlock === selectedPath.block
        ? getDisplayBlockLabel(nextBlock, entriesByBlock.get(nextBlock))
        : getSummaryBlockLabel(nextCategory, nextType, nextBlock),
    );
      setFormContent(getDefaultClauseContent(nextBlock));
    setInlineEditor({ mode: "create", block: editorBlock });
    if (selectedPath && editorBlock) {
      const blockKey = `${selectedPath.bureau}:${selectedPath.round}:${selectedPath.category}:${selectedPath.type}:${editorBlock}`;
      setExpandedBlocks((prev) => new Set(prev).add(blockKey));
    }
  };

  const startEdit = (entry: ContentRow) => {
    cancelBlockLabelEdit();
    cancelTypeBlockEdit();
    setEditingEntry(entry);
    setFormRound(entry.round);
    setFormCategory(entry.category);
    setFormType(entry.type || "STANDARD");
    setFormBlock(entry.block);
    setFormBlockLabel(getDisplayBlockLabel(entry.block, entriesByBlock.get(entry.block)));
    setFormContent(entry.clause_content);
    setSelectedCategory(entry.category);
    setSelectedType(entry.type || "STANDARD");
    setSelectedBlock(entry.block);
    setSelectedRound(entry.round);
    setSelectedPath({
      bureau: UI_BUREAU,
      category: entry.category,
      type: entry.type || "STANDARD",
      block: entry.block,
      round: entry.round,
    });
    setInlineEditor({ mode: "edit", entryId: entry.id });
    const blockKey = `${UI_BUREAU}:${entry.round}:${entry.category}:${entry.type || "STANDARD"}:${entry.block}`;
    setExpandedBlocks(new Set([blockKey]));
  };

  const startTypeBlockEdit = (block: string) => {
    if (!selectedCategory || !selectedType) return;
    cancelBlockLabelEdit();
    closeInlineEditor();
    setEditingTypeBlock(block);
    setEditingTypeBlockLabelValue(getSummaryBlockLabel(selectedCategory, selectedType, block));
  };

  const saveTypeBlockLabel = async (block: string) => {
    if (!selectedCategory || !selectedType) return;

    setSavingTypeBlockLabel(block);
    try {
      const normalizedLabel = editingTypeBlockLabelValue.trim();
      await apiFetch(`${API}/block-scope`, {
        method: "PUT",
        body: JSON.stringify({
          bureau: UI_BUREAU,
          category: selectedCategory,
          type: selectedType,
          block,
          block_label:
            normalizedLabel && normalizedLabel !== getDefaultBlockLabel(block)
              ? normalizedLabel
              : null,
        }),
      });
      await loadSummary();
      cancelTypeBlockEdit();
      toast({ title: "Updated", description: "Block name updated successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingTypeBlockLabel(null);
    }
  };

  const handleSave = async () => {
    if (!formContent.trim() || !formCategory.trim()) {
      toast({
        title: "Validation",
        description: "Content and category are required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const normalizedBlockLabel = formBlockLabel.trim();
      const blockLabelValue =
        normalizedBlockLabel && normalizedBlockLabel !== getDefaultBlockLabel(formBlock)
          ? normalizedBlockLabel
          : null;
      const nextPath: TreePath = {
        bureau: UI_BUREAU,
        category: formCategory,
        type: formType,
        block: formBlock,
        round: formRound,
      };

      if (editingEntry) {
        await apiFetch(`${API}/${editingEntry.id}`, {
          method: "PUT",
          body: JSON.stringify({
            clause_content: formContent,
            bureau: UI_BUREAU,
            round: formRound,
            category: formCategory,
            type: formType,
            block: formBlock,
            block_label: blockLabelValue,
          }),
        });
        toast({ title: "Updated", description: "Clause updated successfully" });
      } else {
        await apiFetch(API, {
          method: "POST",
          body: JSON.stringify({
            clause_content: formContent,
            bureau: UI_BUREAU,
            round: formRound,
            category: formCategory,
            type: formType,
            block: formBlock,
            block_label: blockLabelValue,
          }),
        });
        toast({ title: "Created", description: "Clause created successfully" });
      }

      await apiFetch(`${API}/block-label`, {
        method: "PUT",
        body: JSON.stringify({
          bureau: UI_BUREAU,
          round: formRound,
          category: formCategory,
          type: formType,
          block: formBlock,
          block_label: blockLabelValue,
        }),
      });

      setSelectedCategory(formCategory);
      setSelectedType(formType);
      setSelectedBlock(formBlock);
      setSelectedRound(formRound);
      // Load data BEFORE setting selectedPath to avoid the useEffect
      // triggering a duplicate loadEntries that briefly shows the loading
      // spinner and hides the inline editor.
      await loadSummary();
      await loadEntries(nextPath);
      setSelectedPath(nextPath);
      setExpandedBlocks(new Set([`${UI_BUREAU}:${formRound}:${formCategory}:${formType}:${formBlock}`]));
      setEditingEntry(null);
      setFormContent(getDefaultClauseContent(formBlock));
      setInlineEditor({ mode: "create", block: formBlock });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderInlineEditor = (title: string, description: string) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Editor header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        {editingEntry && inlineEditor?.mode === "edit" && (
          <Badge
            variant="outline"
            className="font-mono text-[11px] bg-white border-slate-300 text-slate-500"
          >
            ID #{editingEntry.id}
          </Badge>
        )}
      </div>

      <div className="p-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              Category
            </Label>
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesForPath.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              Template Type
            </Label>
            <Select
              value={formType}
              onValueChange={(value) => setFormType(value as LetterContentType)}
            >
              <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LETTER_CONTENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {LETTER_CONTENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {LETTER_CONTENT_TYPE_DESCRIPTIONS[formType]}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              Block
            </Label>
            <Select value={formBlock} onValueChange={setFormBlock}>
              <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_ORDER.map((block) => (
                  <SelectItem key={block} value={block}>
                    {block}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2 xl:col-span-2">
            <Label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              Block Name
            </Label>
            <Input
              value={formBlockLabel}
              onChange={(event) => setFormBlockLabel(event.target.value)}
              placeholder={getDefaultBlockLabel(formBlock)}
              className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              Round
            </Label>
            <Select
              value={String(formRound)}
              onValueChange={(value) => setFormRound(Number(value))}
            >
              <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUNDS.map((round) => (
                  <SelectItem key={round} value={String(round)}>
                    Round {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
            Clause Content
          </Label>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <RichTextEditor
              value={formContent}
              onChange={setFormContent}
              placeholder="Write clause content here..."
              minHeight="200px"
              onSave={handleSave}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            onClick={closeInlineEditor}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm shadow-blue-500/20"
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {editingEntry ? "Update Clause" : "Create Clause"}
          </Button>
        </div>
      </div>
    </div>
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`${API}/${deleteTarget.id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Clause deleted" });
      setDeleteTarget(null);
      loadSummary();
      if (selectedPath) loadEntries(selectedPath);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteBlock = async () => {
    if (!deleteBlockTarget) return;

    try {
      await apiFetch(`${API}/block-scope`, {
        method: "DELETE",
        body: JSON.stringify({
          bureau: UI_BUREAU,
          category: deleteBlockTarget.category,
          type: deleteBlockTarget.type,
          block: deleteBlockTarget.block,
        }),
      });

      if (
        selectedPath &&
        selectedPath.category === deleteBlockTarget.category &&
        selectedPath.type === deleteBlockTarget.type &&
        selectedPath.block === deleteBlockTarget.block
      ) {
        setSelectedBlock(null);
        setSelectedRound(null);
        setSelectedPath(null);
        closeInlineEditor();
      }

      setDeleteBlockTarget(null);
      await loadSummary();
      toast({ title: "Deleted", description: "Block deleted successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDuplicate = async (entry: ContentRow) => {
    try {
      await apiFetch(API, {
        method: "POST",
        body: JSON.stringify({
          clause_content: entry.clause_content,
          bureau: entry.bureau,
          round: entry.round,
          category: entry.category,
          type: entry.type,
          block: entry.block,
        }),
      });
      toast({ title: "Duplicated", description: "Clause variant duplicated" });
      loadSummary();
      if (selectedPath) loadEntries(selectedPath);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const isPathSelected = (
    category: string,
    type: LetterContentType,
    block: string,
    round: number,
  ) =>
    selectedPath?.category === category &&
    selectedPath?.type === type &&
    selectedPath?.block === block &&
    selectedPath?.round === round;

  const isCategorySelected = (category: string) =>
    selectedCategory === category &&
    selectedType === null &&
    selectedBlock === null &&
    selectedRound === null &&
    !selectedPath;

  const isTypeSelected = (category: string, type: LetterContentType) =>
    selectedCategory === category &&
    selectedType === type &&
    selectedBlock === null &&
    selectedRound === null &&
    !selectedPath;

  const isBlockSelected = (
    category: string,
    type: LetterContentType,
    block: string,
  ) =>
    selectedCategory === category &&
    selectedType === type &&
    selectedBlock === block &&
    selectedRound === null &&
    !selectedPath;

  const categoriesWithCounts = categoriesForPath
    .map((category) => ({
      category,
      count: summaryMap.get(`${UI_BUREAU}:${category}`) || 0,
    }))
    .sort((left, right) => left.category.localeCompare(right.category));

  const typesForSelectedCategory = selectedCategory
    ? LETTER_CONTENT_TYPES.map((type) => ({
        type,
        count: summaryMap.get(`${UI_BUREAU}:${selectedCategory}:${type}`) || 0,
      }))
    : [];

  const blocksForSelectedType =
    selectedCategory && selectedType
      ? BLOCK_ORDER.map((block) => ({
          block,
          label: getSummaryBlockLabel(selectedCategory, selectedType, block),
          count: isHeaderBlock(block)
            ? Math.max(summaryMap.get(`${UI_BUREAU}:${selectedCategory}:${selectedType}:${block}`) || 0, 1)
            : summaryMap.get(`${UI_BUREAU}:${selectedCategory}:${selectedType}:${block}`) || 0,
        }))
      : [];

  const roundsForSelectedBlock =
    selectedCategory && selectedType && selectedBlock
      ? ROUNDS.map((round) => ({
          round,
          count:
            isHeaderBlock(selectedBlock)
              ? Math.max(
                  summaryMap.get(
                    `${UI_BUREAU}:${selectedCategory}:${selectedType}:${selectedBlock}:${round}`,
                  ) || 0,
                  1,
                )
              : summaryMap.get(
                  `${UI_BUREAU}:${selectedCategory}:${selectedType}:${selectedBlock}:${round}`,
                ) || 0,
        }))
      : [];

  const totalClauses = summary.reduce(
    (acc, item) => acc + Number(item.variant_count || 0),
    0,
  );

  const getBlockVariantCount = useCallback(
    (category: string, type: LetterContentType, block: string) => {
      const count = summaryMap.get(`${UI_BUREAU}:${category}:${type}:${block}`) || 0;
      return isHeaderBlock(block) ? Math.max(count, 1) : count;
    },
    [summaryMap],
  );

  const getRoundVariantCount = useCallback(
    (category: string, type: LetterContentType, block: string, round: number) => {
      const count = summaryMap.get(`${UI_BUREAU}:${category}:${type}:${block}:${round}`) || 0;
      return isHeaderBlock(block) ? Math.max(count, 1) : count;
    },
    [summaryMap],
  );

  const selectedBlockEntries = useMemo(() => {
    if (!selectedPath) return [];

    const blockEntries = entriesByBlock.get(selectedPath.block) || [];
    if (blockEntries.length > 0 || !isHeaderBlock(selectedPath.block)) {
      return blockEntries;
    }

    return [
      {
        id: -1,
        clause_content: DEFAULT_HEADER_CLAUSE_CONTENT,
        bureau: selectedPath.bureau,
        round: selectedPath.round,
        category: selectedPath.category,
        type: selectedPath.type,
        block: selectedPath.block,
        block_label: getDefaultBlockLabel(selectedPath.block),
        created_at: "",
        updated_at: "",
      },
    ];
  }, [entriesByBlock, selectedPath]);

  const selectedBlockLabel = selectedPath
    ? getDisplayBlockLabel(selectedPath.block, selectedBlockEntries)
    : selectedBlock
      ? getSummaryBlockLabel(selectedCategory || "", selectedType || "STANDARD", selectedBlock)
      : null;

  const selectedPathCounts = selectedPath
    ? {
        category: summaryMap.get(`${UI_BUREAU}:${selectedPath.category}`) || 0,
        type: summaryMap.get(`${UI_BUREAU}:${selectedPath.category}:${selectedPath.type}`) || 0,
        block: getBlockVariantCount(selectedPath.category, selectedPath.type, selectedPath.block),
        round: getRoundVariantCount(selectedPath.category, selectedPath.type, selectedPath.block, selectedPath.round),
      }
    : null;

  const allBlockSlotsForSelectedType =
    selectedCategory && selectedType
      ? BLOCK_ORDER.map((block) => ({
          block,
          label: getSummaryBlockLabel(selectedCategory, selectedType, block),
          count: getBlockVariantCount(selectedCategory, selectedType, block),
        }))
      : [];

  const visibleBlocksForSelectedPath = selectedPath
    ? [selectedPath.block]
    : [];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50">
      <div
        className="shrink-0 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e3a5f 0%, #1e40af 45%, #2563eb 100%)",
        }}
      >
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-10 bg-white" />
        <div className="pointer-events-none absolute -bottom-6 right-32 h-28 w-28 rounded-full opacity-10 bg-white" />
        <div className="pointer-events-none absolute top-4 left-1/2 h-16 w-16 rounded-full opacity-10 bg-white" />

        <div className="relative flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 shadow-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Letter Content Manager
              </h1>
              <p className="text-xs text-blue-200 mt-0.5">
                Manage dispute letter clauses by category, type, block &amp; round
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15">
              <Layers className="h-4 w-4 text-blue-200" />
              <span className="text-sm font-semibold text-white">
                {totalClauses}
              </span>
              <span className="text-xs text-blue-200">total clauses</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15">
              <LayoutGrid className="h-4 w-4 text-blue-200" />
              <span className="text-sm font-semibold text-white">
                {categoriesForPath.length}
              </span>
              <span className="text-xs text-blue-200">categories</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {selectedPath && (
          <div className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col shadow-sm">
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/80">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Navigator
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Category / Type / Block / Round
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-3 py-3 space-y-1">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-2 py-2">
                <button
                  type="button"
                  onClick={() => selectCategory(selectedPath.category)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-white shadow-sm"
                  style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                >
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/80" />
                  <FileText className="h-3.5 w-3.5 shrink-0 text-white/80" />
                  <span className="flex-1 truncate">{selectedPath.category}</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {selectedPathCounts?.category || 0}
                  </span>
                </button>

                <div className="ml-3 mt-2 space-y-1 border-l border-slate-200 pl-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => selectType(selectedPath.category, selectedPath.type)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold text-white shadow-sm"
                      style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                    >
                      <ChevronDown className="h-3 w-3 shrink-0 text-white/80" />
                      <Layers className="h-3 w-3 shrink-0 text-white/80" />
                      <span className="flex-1 truncate">{LETTER_CONTENT_TYPE_LABELS[selectedPath.type]}</span>
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {selectedPathCounts?.type || 0}
                      </span>
                    </button>

                    <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => selectBlock(selectedPath.category, selectedPath.type, selectedPath.block)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold text-white shadow-sm"
                          style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                        >
                          <ChevronDown className="h-3 w-3 shrink-0 text-white/80" />
                          <FolderOpen className="h-3 w-3 shrink-0 text-white/80" />
                          <span className="flex-1 truncate">{selectedBlockLabel}</span>
                          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {selectedPathCounts?.block || 0}
                          </span>
                        </button>

                        <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-3">
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                selectPath(
                                  selectedPath.category,
                                  selectedPath.type,
                                  selectedPath.block,
                                  selectedPath.round,
                                )
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold text-white shadow-sm"
                              style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                            >
                              <span className="h-2 w-2 rounded-full bg-white/80" />
                              <span className="flex-1">Round {selectedPath.round}</span>
                              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {selectedPathCounts?.round || 0}
                              </span>
                            </button>

                            {selectedBlockEntries.length > 0 && (
                              <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-3">
                                {selectedBlockEntries.map((entry, index) => {
                                  const isVirtualEntry = entry.id < 0;
                                  const clauseSelected =
                                    inlineEditor?.mode === "edit" &&
                                    inlineEditor.entryId === entry.id;

                                  return (
                                    <button
                                      key={`clause-leaf-${entry.id}`}
                                      type="button"
                                      onClick={() => {
                                        if (isVirtualEntry) {
                                          startCreate(selectedPath.block || "HEADER");
                                          return;
                                        }
                                        startEdit(entry);
                                      }}
                                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition-all duration-150 ${
                                        clauseSelected
                                          ? "font-semibold text-white shadow-sm"
                                          : "text-slate-500 hover:bg-white hover:text-slate-800"
                                      }`}
                                      style={clauseSelected ? { backgroundColor: BUREAU_HEX[UI_BUREAU] } : {}}
                                      title={getClausePreview(entry.clause_content)}
                                    >
                                      <ScrollText className={`h-3 w-3 shrink-0 ${clauseSelected ? "text-white/80" : "text-slate-400"}`} />
                                      <span className="flex-1 truncate">
                                        {getClausePreview(entry.clause_content)}
                                      </span>
                                      <span
                                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                          clauseSelected
                                            ? "bg-white/20 text-white"
                                            : "bg-white text-slate-500"
                                        }`}
                                      >
                                        {index + 1}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          </div>
        )}

        <div className="flex-1 overflow-hidden bg-slate-50 p-5">
          {!selectedCategory ? (
            <div className="h-full flex flex-col">
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                  style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                >
                  <LayoutGrid className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Categories</h2>
                  <p className="text-xs text-slate-400">
                    Start with a category, then drill into type, block, and round.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {categoriesWithCounts.map(({ category, count }) => (
                  <button
                    key={`category-card-${category}`}
                    type="button"
                    onClick={() => selectCategory(category)}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
                  >
                    <div className="p-5">
                      <div
                        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                        style={{ backgroundColor: BUREAU_LIGHT_HEX[UI_BUREAU] }}
                      >
                        <FileText className="h-5 w-5" style={{ color: BUREAU_HEX[UI_BUREAU] }} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-2">{category}</p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                        >
                          {count}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Browse template types, blocks, and rounds inside this category.
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : !selectedType ? (
            <div className="h-full flex flex-col">
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                  style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                >
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={resetToRoot}
                      className="rounded-md px-2 py-0.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      onClick={() => selectCategory(selectedCategory)}
                      className="text-base font-bold text-slate-800 hover:underline underline-offset-2"
                    >
                      {selectedCategory}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select the template type for this category.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {typesForSelectedCategory.map(({ type, count }) => (
                  <button
                    key={`type-card-${selectedCategory}-${type}`}
                    type="button"
                    onClick={() => selectType(selectedCategory, type)}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
                  >
                    <div className="p-5">
                      <div
                        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                        style={{ backgroundColor: type === "STANDARD" ? "#dbeafe" : "#dcfce7" }}
                      >
                        <Layers
                          className="h-5 w-5"
                          style={{ color: type === "STANDARD" ? "#1d4ed8" : "#15803d" }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {LETTER_CONTENT_TYPE_LABELS[type]}
                        </p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: type === "STANDARD" ? "#1d4ed8" : "#15803d" }}
                        >
                          {count}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {LETTER_CONTENT_TYPE_DESCRIPTIONS[type]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : !selectedBlock ? (
            <div className="h-full flex flex-col">
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                  style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                >
                  <FolderOpen className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                    <button
                      type="button"
                      onClick={resetToRoot}
                      className="rounded-md px-2 py-0.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      onClick={() => selectCategory(selectedCategory)}
                      className="hover:underline underline-offset-2"
                    >
                      {selectedCategory}
                    </button>
                    <span className="text-slate-300">/</span>
                    <button
                      type="button"
                      onClick={() => selectType(selectedCategory, selectedType)}
                      className="hover:underline underline-offset-2"
                    >
                      {LETTER_CONTENT_TYPE_LABELS[selectedType]}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose a block before selecting the round.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => startCreate()}
                  className="text-white shadow-sm"
                  style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add New Block
                </Button>
              </div>

              {inlineEditor?.mode === "create" && inlineEditor.block === null && (
                <div className="mb-4">
                  {renderInlineEditor(
                    "Create New Block",
                    "Select a block slot, set the block name, choose the round, and write the first clause.",
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {blocksForSelectedType.map(({ block, label, count }) => (
                  <div
                    key={`block-card-${selectedCategory}-${selectedType}-${block}`}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-2 px-5 pt-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                        style={{ backgroundColor: BUREAU_LIGHT_HEX[UI_BUREAU] }}
                      >
                        <FolderOpen className="h-5 w-5" style={{ color: BUREAU_HEX[UI_BUREAU] }} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          onClick={() => startTypeBlockEdit(block)}
                          title="Edit block name"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={() =>
                            setDeleteBlockTarget({
                              category: selectedCategory,
                              type: selectedType,
                              block,
                              label,
                            })
                          }
                          title="Delete block"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {editingTypeBlock === block ? (
                      <div className="px-5 pb-5 pt-3 space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                            Block Name
                          </Label>
                          <Input
                            value={editingTypeBlockLabelValue}
                            onChange={(event) => setEditingTypeBlockLabelValue(event.target.value)}
                            placeholder={getDefaultBlockLabel(block)}
                            className="bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelTypeBlockEdit}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={() => void saveTypeBlockLabel(block)}
                            disabled={savingTypeBlockLabel === block}
                            className="text-white shadow-sm"
                            style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                          >
                            {savingTypeBlockLabel === block && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => selectBlock(selectedCategory, selectedType, block)}
                        className="w-full px-5 pb-5 pt-3 text-left"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">{label}</p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                          >
                            {count}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{block}</p>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : !selectedPath ? (
            <div className="h-full flex flex-col">
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                  style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                    <button
                      type="button"
                      onClick={resetToRoot}
                      className="rounded-md px-2 py-0.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      onClick={() => selectCategory(selectedCategory)}
                      className="hover:underline underline-offset-2"
                    >
                      {selectedCategory}
                    </button>
                    <span className="text-slate-300">/</span>
                    <button
                      type="button"
                      onClick={() => selectType(selectedCategory, selectedType)}
                      className="hover:underline underline-offset-2"
                    >
                      {LETTER_CONTENT_TYPE_LABELS[selectedType]}
                    </button>
                    <span className="text-slate-300">/</span>
                    <button
                      type="button"
                      onClick={() => selectBlock(selectedCategory, selectedType, selectedBlock)}
                      className="hover:underline underline-offset-2"
                    >
                      {selectedBlockLabel}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose the round for this block.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {roundsForSelectedBlock.map(({ round, count }) => (
                  <button
                    key={`round-card-${selectedCategory}-${selectedType}-${selectedBlock}-${round}`}
                    type="button"
                    onClick={() => selectPath(selectedCategory, selectedType, selectedBlock, round)}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
                  >
                    <div className="h-1.5 w-full" style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }} />
                    <div className="p-5">
                      <div
                        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white text-lg font-bold shadow-sm"
                        style={{ backgroundColor: BUREAU_HEX[UI_BUREAU] }}
                      >
                        {round}
                      </div>
                      <p className="text-sm font-semibold text-slate-800">Round {round}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {count} clause variant{count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div
                className="shrink-0 px-5 py-4 border-b border-slate-100"
                style={{ backgroundColor: BUREAU_LIGHT_HEX[selectedPath.bureau] }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm text-white"
                      style={{ backgroundColor: BUREAU_HEX[selectedPath.bureau] }}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-slate-800">
                        <button
                          type="button"
                          onClick={resetToRoot}
                          className="rounded-md px-2 py-0.5 text-sm font-semibold text-slate-500 hover:bg-white/70 hover:text-slate-800"
                        >
                          &lt;
                        </button>
                        <button
                          type="button"
                          onClick={() => selectCategory(selectedPath.category)}
                          className="hover:underline underline-offset-2 transition-opacity hover:opacity-70"
                        >
                          {selectedPath.category}
                        </button>
                        <span className="text-slate-300">/</span>
                        <button
                          type="button"
                          onClick={() => selectType(selectedPath.category, selectedPath.type)}
                          className="hover:underline underline-offset-2 transition-opacity hover:opacity-70"
                        >
                          {LETTER_CONTENT_TYPE_LABELS[selectedPath.type]}
                        </button>
                        <span className="text-slate-300">/</span>
                        <button
                          type="button"
                          onClick={() => selectBlock(selectedPath.category, selectedPath.type, selectedPath.block)}
                          className="hover:underline underline-offset-2 transition-opacity hover:opacity-70"
                        >
                          {selectedBlockLabel}
                        </button>
                        <span className="text-slate-300">/</span>
                        <span>Round {selectedPath.round}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedBlockEntries.length} clause{selectedBlockEntries.length !== 1 ? "s" : ""} in this block and round
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => startCreate(selectedPath.block)}
                    className="text-white shadow-sm"
                    style={{ backgroundColor: BUREAU_HEX[selectedPath.bureau] }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Clause
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-5 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
                    </div>
                  ) : selectedBlockEntries.length === 0 ? (
                    inlineEditor?.mode === "create" && inlineEditor.block === selectedPath.block ? (
                      <div className="pt-1">
                        {renderInlineEditor(
                          `Create Variant in ${selectedBlockLabel}`,
                          "Add a new clause inline without opening a popup.",
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div
                          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: BUREAU_LIGHT_HEX[selectedPath.bureau] }}
                        >
                          <Sparkles className="h-7 w-7" style={{ color: BUREAU_HEX[selectedPath.bureau] }} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">
                          No clauses yet
                        </p>
                        <p className="text-xs text-slate-400 mb-4">
                          This block has no clause content for Round {selectedPath.round}.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => startCreate(selectedPath.block)}
                          className="text-white shadow-sm"
                          style={{ backgroundColor: BUREAU_HEX[selectedPath.bureau] }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add First Clause
                        </Button>
                      </div>
                    )
                  ) : (
                    visibleBlocksForSelectedPath.map((block) => {
                      const blockEntries =
                        selectedPath && block === selectedPath.block
                          ? selectedBlockEntries
                          : entriesByBlock.get(block) || [];
                      const blockKey = `${selectedPath.bureau}:${selectedPath.round}:${selectedPath.category}:${selectedPath.type}:${block}`;
                      const isBlockExpanded = expandedBlocks.has(blockKey);
                      const defaultBlockLabel = getDefaultBlockLabel(block);
                      const displayBlockLabel = getDisplayBlockLabel(block, blockEntries);
                      const hasCustomBlockLabel = displayBlockLabel !== defaultBlockLabel;
                      const isEditingBlockLabel = editingBlockLabel === block;

                      return (
                        <div
                          key={block}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-150 hover:shadow"
                        >
                          <button
                            onClick={() => {
                              setExpandedBlocks((prev) => {
                                const next = new Set(prev);
                                next.has(blockKey) ? next.delete(blockKey) : next.add(blockKey);
                                return next;
                              });
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 transition-colors duration-100"
                          >
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: BUREAU_LIGHT_HEX[selectedPath.bureau] }}
                            >
                              {isBlockExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" style={{ color: BUREAU_HEX[selectedPath.bureau] }} />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" style={{ color: BUREAU_HEX[selectedPath.bureau] }} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              {isEditingBlockLabel ? (
                                <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                                  <Input
                                    autoFocus
                                    className="h-7 text-sm border-slate-200"
                                    value={editingBlockLabelValue}
                                    onChange={(event) => setEditingBlockLabelValue(event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        void saveBlockLabelEdit(block, defaultBlockLabel);
                                      }
                                      if (event.key === "Escape") {
                                        event.preventDefault();
                                        cancelBlockLabelEdit();
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    disabled={savingBlockLabel === block}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void saveBlockLabelEdit(block, defaultBlockLabel);
                                    }}
                                  >
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      cancelBlockLabelEdit();
                                    }}
                                  >
                                    <X className="h-3.5 w-3.5 text-slate-400" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-800 truncate">
                                    {displayBlockLabel}
                                  </p>
                                  {hasCustomBlockLabel && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-400"
                                    >
                                      {defaultBlockLabel}
                                    </Badge>
                                  )}
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white ml-1"
                                    style={{ backgroundColor: BUREAU_HEX[selectedPath.bureau] }}
                                  >
                                    {blockEntries.length}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="ml-auto flex shrink-0 items-center gap-1">
                              <button
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-100"
                                title="Rename block"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startBlockLabelEdit(block, blockEntries);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-100"
                                title="Add variant to this block"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startCreate(block);
                                }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </button>

                          {isBlockExpanded && (
                            <div className="border-t border-slate-100">
                              {inlineEditor?.mode === "create" && inlineEditor.block === block && (
                                <div className="p-4 border-b border-slate-100">
                                  {renderInlineEditor(
                                    `Create Variant in ${displayBlockLabel}`,
                                    "This new clause will be added directly in this block section.",
                                  )}
                                </div>
                              )}

                              {blockEntries.map((entry, idx) => {
                                const isVirtualEntry = entry.id < 0;

                                return (
                                  <div key={entry.id} className="border-b border-slate-100 last:border-0">
                                    {inlineEditor?.mode === "edit" && inlineEditor.entryId === entry.id ? (
                                      <div className="p-4">
                                        {renderInlineEditor(
                                          `Edit Variant ${idx + 1}`,
                                          "Update this clause directly in the same content box.",
                                        )}
                                      </div>
                                    ) : (
                                      <div
                                        className="group cursor-pointer p-4 transition-colors duration-100 hover:bg-slate-50/80"
                                        onClick={() => {
                                          if (isVirtualEntry) {
                                            startCreate(block);
                                            return;
                                          }
                                          startEdit(entry);
                                        }}
                                        title={isVirtualEntry ? "Click to customize this default header inline" : "Click to edit this clause inline"}
                                      >
                                        <div className="mb-2.5 flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <span
                                              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                              style={{ backgroundColor: BUREAU_HEX[selectedPath.bureau] }}
                                            >
                                              {isVirtualEntry ? "Default" : `Variant ${idx + 1}`}
                                            </span>
                                            {isVirtualEntry ? (
                                              <span className="text-[10px] text-slate-400 font-mono">
                                                Auto Header
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 font-mono">
                                                ID #{entry.id}
                                              </span>
                                            )}
                                          </div>
                                          {!isVirtualEntry && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                                              <button
                                                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                                title="Duplicate"
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  void handleDuplicate(entry);
                                                }}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </button>
                                              <button
                                                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                                title="Edit"
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  startEdit(entry);
                                                }}
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </button>
                                              <button
                                                className="flex h-6 w-6 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Delete"
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  setDeleteTarget(entry);
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        <div
                                          className="prose prose-sm max-w-none text-sm text-slate-700 [&_*]:text-slate-700 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5"
                                          dangerouslySetInnerHTML={{ __html: entry.clause_content }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Delete Confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl border border-slate-200 shadow-xl">
          <AlertDialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-800">
              Delete Clause Variant?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              This will permanently remove clause variant{" "}
              <span className="font-mono font-semibold text-slate-700">
                #{deleteTarget?.id}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteBlockTarget}
        onOpenChange={(open) => !open && setDeleteBlockTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl border border-slate-200 shadow-xl">
          <AlertDialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-800">
              Delete Block?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              This will permanently remove every clause inside the block{" "}
              <span className="font-semibold text-slate-700">
                {deleteBlockTarget?.label}
              </span>
              . This action deletes all rounds for that block in the current category and template type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBlock}
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20"
            >
              Delete Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
