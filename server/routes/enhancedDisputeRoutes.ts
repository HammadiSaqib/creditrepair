import { Request, Response } from 'express';
import { z } from 'zod';
import * as crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { PassThrough } from 'stream';
import PDFDocument from 'pdfkit';
import puppeteer from 'puppeteer';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { runQuery, getQuery, allQuery, runTransaction, logActivity, logAudit } from '../database/databaseAdapter.js';
import { Dispute } from '../database/enhancedSchema.js';
import { AuthRequest } from '../middleware/securityMiddleware.js';
import { sanitizeInput } from '../config/security.js';

// ─── Types ──────────────────────────────────────────────────────────────────
type BureauKey = 'experian' | 'equifax' | 'transunion';
type ToneLevel = 2 | 3 | 4 | 5;

// ─── Bureau config ──────────────────────────────────────────────────────────
const BUREAU_CONFIG: Record<BureauKey, { name: string; address: string }> = {
  experian: { name: 'Experian', address: 'Experian\nPO BOX 4500\nALLEN, TX 75013' },
  equifax: { name: 'Equifax Information Services LLC', address: 'Equifax Information Services LLC\nPO Box740256\nATLANTA,GA 30374-0256' },
  transunion: { name: 'TransUnion LLC', address: 'TransUnion LLC\nPO Box 2000\nCHESTER, PA 19016-2000' },
};

const getBureauAddressLines = (bureauKey: BureauKey): { address1: string; address2: string } => {
  switch (bureauKey) {
    case 'experian': return { address1: 'PO BOX 4500', address2: 'ALLEN, TX 75013' };
    case 'equifax': return { address1: 'PO Box740256', address2: 'ATLANTA,GA 30374-0256' };
    case 'transunion': return { address1: 'PO Box 2000', address2: 'CHESTER, PA 19016-2000' };
    default: return { address1: '', address2: '' };
  }
};

const normalizeSupportBureau = (value: string) => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'tu' || raw === 'transunion') return { key: 'transunion', code: 'TU', label: 'TransUnion' };
  if (raw === 'ex' || raw === 'experian') return { key: 'experian', code: 'EX', label: 'Experian' };
  if (raw === 'eq' || raw === 'equifax') return { key: 'equifax', code: 'EQ', label: 'Equifax' };
  return { key: raw, code: raw.toUpperCase(), label: raw };
};

// ─── Category detection ─────────────────────────────────────────────────────
type CategoryKey = 'PERSONAL_INFO' | 'CHARGE_OFFS' | 'LATE_PAYMENTS' | 'DEROGATORY_LATES' | 'PUBLIC_RECORDS' | 'INQUIRIES' | 'MEDICAL' | 'STUDENT_LOANS' | 'OTHER';

const detectCategoryKeyFromText = (value: string): CategoryKey => {
  const text = String(value || '').toLowerCase();
  if (text.includes('inquir')) return 'INQUIRIES';
  if (text.includes('public record') || text.includes('bankruptcy') || text.includes('lien') || text.includes('judgment')) return 'PUBLIC_RECORDS';
  if (text.includes('medical')) return 'MEDICAL';
  if (text.includes('student')) return 'STUDENT_LOANS';
  if (text.includes('charge') || text.includes('collection') || text.includes('charge-off') || text.includes('charge off')) return 'CHARGE_OFFS';
  if (text.includes('late payment') || text.includes('late-payment') || /\b(30|60|90|120)\s*day[s]?\s*late\b/.test(text) || /\blate\b/.test(text)) return 'LATE_PAYMENTS';
  if (text.includes('delinquen') || text.includes('derog')) return 'DEROGATORY_LATES';
  if (text.includes('personal info') || text.includes('personal information') || text.includes('wrong name') || text.includes('wrong address')) return 'PERSONAL_INFO';
  return 'OTHER';
};

const mapCategoryNameToKey = (value: string | null | undefined): CategoryKey => {
  const name = String(value || '').trim().toLowerCase();
  if (!name) return 'OTHER';
  if (name.includes('personal')) return 'PERSONAL_INFO';
  if (name.includes('public')) return 'PUBLIC_RECORDS';
  if (name.includes('inquir')) return 'INQUIRIES';
  if (name.includes('late payment') || name.includes('late-payment')) return 'LATE_PAYMENTS';
  if (name.includes('medical')) return 'MEDICAL';
  if (name.includes('student')) return 'STUDENT_LOANS';
  if (name.includes('charge') || name.includes('collection')) return 'CHARGE_OFFS';
  if (name.includes('late') || name.includes('derog')) return 'DEROGATORY_LATES';
  return 'OTHER';
};

const getSupportCategoryIdForKey = async (categoryKey: CategoryKey): Promise<number | null> => {
  const rows = (await allQuery('SELECT id, name FROM support_letter_categories ORDER BY id ASC')) as any[];
  let foundId: number | null = null;
  for (const row of rows) {
    if (mapCategoryNameToKey(row.name) === categoryKey) { foundId = row.id; break; }
  }
  if (!foundId && (categoryKey === 'LATE_PAYMENTS' || categoryKey === 'DEROGATORY_LATES')) {
    const alt = categoryKey === 'LATE_PAYMENTS' ? 'DEROGATORY_LATES' : 'LATE_PAYMENTS';
    for (const row of rows) {
      if (mapCategoryNameToKey(row.name) === alt) { foundId = row.id; break; }
    }
  }
  return foundId;
};

// ─── Tradeline parsing ──────────────────────────────────────────────────────
type ParsedTradeline = { creditor: string; accountType: string; accountNumber: string; bureau: string; date: string };

function parseTradelineList(list: string): ParsedTradeline[] {
  if (!list) return [];
  return String(list).split('\n').map(l => l.trim()).filter(l => l.length > 0).map(l => l.replace(/^\s*-\s*/, '')).map(line => {
    const match = line.match(/^(.*?)\s*[–-]\s*(.*?)\s*\(Account\s*([^\),]+)\s*,\s*([^\),]+)(?:\s*,\s*Date:\s*([^)]*))?\)/i);
    if (match) return { creditor: match[1].trim(), accountType: match[2].trim(), accountNumber: match[3].trim(), bureau: match[4].trim(), date: (match[5] || '').trim() };
    return { creditor: '', accountType: '', accountNumber: '', bureau: '', date: '' };
  });
}

function maskAccountNumber(value: any) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return raw.slice(-4).padStart(raw.length, '*');
}

// ─── Creditor / Account entries for list placeholders ───────────────────────
type CreditorEntry = { name: string; date: string };
type AccountNumberEntry = { creditorName: string; accountNumber: string };

function buildCreditorEntries(items: Array<{ creditor_name?: string; negative_item_date?: string }>): CreditorEntry[] {
  return (items || []).filter(i => (i.creditor_name || '').trim()).map(i => ({ name: (i.creditor_name || '').trim(), date: (i.negative_item_date || '').trim() }));
}

function buildCreditorEntriesFromTradelines(tradelines: ParsedTradeline[], fallbackDate?: string): CreditorEntry[] {
  return (tradelines || []).filter(t => t.creditor.trim()).map(t => ({ name: t.creditor.trim(), date: (t.date || fallbackDate || '').trim() }));
}

function formatCreditorList(entries: CreditorEntry[]): string {
  if (!entries || entries.length === 0) return '';
  return entries.map((e, i) => e.date ? `${i + 1}. ${e.name} — Date: ${e.date}` : `${i + 1}. ${e.name}`).join('\n');
}

function buildAccountNumberEntries(items: Array<{ creditor_name?: string; account_number?: string; account_number_masked?: string }>): AccountNumberEntry[] {
  return (items || []).filter(i => (i.creditor_name || '').trim()).map(i => ({ creditorName: (i.creditor_name || '').trim(), accountNumber: (i.account_number || i.account_number_masked || '').trim() }));
}

function buildAccountNumberEntriesFromTradelines(tradelines: ParsedTradeline[]): AccountNumberEntry[] {
  return (tradelines || []).filter(t => t.creditor.trim()).map(t => ({ creditorName: t.creditor.trim(), accountNumber: (t.accountNumber || '').trim() }));
}

function formatAccountNumberList(entries: AccountNumberEntry[]): string {
  if (!entries || entries.length === 0) return '';
  return entries.map((e, i) => `${i + 1}. ${e.accountNumber}`).join('\n');
}

function resolveCreditorListWise(content: string, entries: CreditorEntry[]): string {
  if (!content || !entries || entries.length === 0) return content;
  let index = 0;
  return content.replace(/\{\{\s*CREDITOR_LIST_WISE\s*\}\}/gi, () => {
    const safeIndex = index % entries.length;
    const entry = entries[safeIndex];
    index += 1;
    if (!entry) return '';
    return entry.date ? `${safeIndex + 1}. ${entry.name} — Date: ${entry.date}` : `${safeIndex + 1}. ${entry.name}`;
  });
}

function resolveAccountNumberListWise(content: string, entries: AccountNumberEntry[]): string {
  if (!content || !entries || entries.length === 0) return content;
  let index = 0;
  return content.replace(/\{\{\s*ACCOUNT_NUMBER_LIST_WISE\s*\}\}/gi, () => {
    const safeIndex = index % entries.length;
    const entry = entries[safeIndex];
    index += 1;
    return entry ? `${safeIndex + 1}. ${entry.accountNumber}` : '';
  });
}

function computeLetterHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

type ClientDocumentEntry = {
  label: string;
  url: string;
};

type StoredOtherClientDocument = {
  file_url: string;
  original_name: string | null;
};

const CLIENT_DOCUMENTS_DIR = path.resolve(process.cwd(), 'uploads', 'client-documents');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

const parseStoredOtherClientDocuments = (value: unknown): StoredOtherClientDocument[] => {
  if (!value) return [];

  let parsedValue = value;
  if (typeof value === 'string') {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsedValue)) return [];

  return parsedValue
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;

      const candidate = entry as Record<string, unknown>;
      const fileUrl = typeof candidate.file_url === 'string' ? candidate.file_url.trim() : '';
      if (!fileUrl) return null;

      return {
        file_url: fileUrl,
        original_name:
          typeof candidate.original_name === 'string' && candidate.original_name.trim().length > 0
            ? candidate.original_name.trim()
            : null,
      };
    })
    .filter((entry): entry is StoredOtherClientDocument => Boolean(entry));
};

const resolveClientDocumentPath = (documentUrl: string): string | null => {
  if (!documentUrl) return null;
  try {
    const trimmed = documentUrl.trim();
    const pathname = trimmed.startsWith('http') ? new URL(trimmed).pathname : trimmed;
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

    if (!normalizedPath.startsWith('/uploads/client-documents/')) return null;
    const filename = path.basename(normalizedPath);
    const resolved = path.resolve(CLIENT_DOCUMENTS_DIR, filename);
    if (!resolved.startsWith(CLIENT_DOCUMENTS_DIR)) return null;
    return resolved;
  } catch {
    return null;
  }
};

const readClientDocument = async (documentUrl: string) => {
  const resolvedPath = resolveClientDocumentPath(documentUrl);
  if (!resolvedPath) return null;
  try {
    const buffer = await fs.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    return { buffer, ext };
  } catch {
    return null;
  }
};

const loadClientDocumentsForClient = async (clientId: number): Promise<ClientDocumentEntry[]> => {
  if (!Number.isFinite(clientId) || clientId <= 0) return [];

  try {
    const columnRows = (await allQuery(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'clients'
         AND COLUMN_NAME IN ('dl_or_id_card', 'ssc', 'poa', 'other_documents')`
    )) as any[];

    const availableColumns = new Set(
      columnRows
        .map((row) => String(row?.COLUMN_NAME || row?.column_name || '').trim())
        .filter(Boolean)
    );

    if (availableColumns.size === 0) return [];

    const selectColumns = ['id', ...Array.from(availableColumns)].join(', ');
    const client = await getQuery(`SELECT ${selectColumns} FROM clients WHERE id = ?`, [clientId]);
    if (!client) return [];

    const otherClientDocuments: ClientDocumentEntry[] = availableColumns.has('other_documents')
      ? parseStoredOtherClientDocuments((client as any).other_documents).map((entry, index) => ({
          label: entry.original_name ? `Other Document: ${entry.original_name}` : `Other Document ${index + 1}`,
          url: entry.file_url,
        }))
      : [];

    return [
      availableColumns.has('dl_or_id_card')
        ? { label: 'Government ID', url: String((client as any).dl_or_id_card || '').trim() }
        : null,
      availableColumns.has('ssc')
        ? { label: 'Social Security Number', url: String((client as any).ssc || '').trim() }
        : null,
      availableColumns.has('poa')
        ? { label: 'Proof of Address', url: String((client as any).poa || '').trim() }
        : null,
      ...otherClientDocuments,
    ].filter((entry): entry is ClientDocumentEntry => Boolean(entry?.url));
  } catch (error) {
    console.error('Failed to load client documents for dispute PDF:', error);
    return [];
  }
};

// ─── HTML helpers ───────────────────────────────────────────────────────────
const containsHtmlMarkup = (value: string): boolean => /<\/?[a-z][\s\S]*>/i.test(value);

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const stripHtmlToPlainText = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  if (!html.includes('<')) return html;
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  text = text.replace(/<\/(h[1-6]|div|li|tr)>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '- ');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
};

// ─── Default header HTML (two-column layout) ────────────────────────────────
const DEFAULT_DISPUTE_HEADER_HTML = `<div style="width: 100%; font-family: 'Times New Roman', serif; color: #000000; font-size: 16px; line-height: 1.15;">
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

// ─── Flat-table item payload ────────────────────────────────────────────────
type FlatTableItemPayload = {
  creditor_name: string; negative_item_type: string; account_or_inquiry_type: string;
  negative_item_date: string; account_number: string; account_number_masked: string;
  amount: string; date_opened: string; date_of_first_delinquency: string;
  account_status: string; current_balance: string; original_loan_amount: string;
  date_of_last_payment: string; date_of_last_activity: string; account_type: string;
  account_responsibility: string; account_status_date: string; account_terms: string;
  scheduled_payment_amount: string; date_closed: string; high_balance: string; payment_status: string;
};

const parseFlatTableItems = (value: any): FlatTableItemPayload[] => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e: any) => e && typeof e === 'object').map((e: any) => ({
      creditor_name: String(e.creditor_name || '').trim(),
      negative_item_type: String(e.negative_item_type || '').trim(),
      account_or_inquiry_type: String(e.account_or_inquiry_type || '').trim(),
      negative_item_date: String(e.negative_item_date || '').trim(),
      account_number: String(e.account_number || '').trim(),
      account_number_masked: String(e.account_number_masked || '').trim(),
      amount: String(e.amount || '').trim(),
      date_opened: String(e.date_opened || '').trim(),
      date_of_first_delinquency: String(e.date_of_first_delinquency || '').trim(),
      account_status: String(e.account_status || '').trim(),
      current_balance: String(e.current_balance || '').trim(),
      original_loan_amount: String(e.original_loan_amount || '').trim(),
      date_of_last_payment: String(e.date_of_last_payment || '').trim(),
      date_of_last_activity: String(e.date_of_last_activity || '').trim(),
      account_type: String(e.account_type || '').trim(),
      account_responsibility: String(e.account_responsibility || '').trim(),
      account_status_date: String(e.account_status_date || '').trim(),
      account_terms: String(e.account_terms || '').trim(),
      scheduled_payment_amount: String(e.scheduled_payment_amount || '').trim(),
      date_closed: String(e.date_closed || '').trim(),
      high_balance: String(e.high_balance || '').trim(),
      payment_status: String(e.payment_status || '').trim(),
    })).filter((e: any) => e.creditor_name.length > 0 || e.account_number.length > 0);
  } catch { return []; }
};

type FlatTableRow = {
  id: number;
  bureau: string;
  block: string;
  clause_content: string;
};

type FlatTableSlotBucket = {
  exact: FlatTableRow[];
  shared: FlatTableRow[];
};

const FLAT_BODY_SLOT_ORDER = Array.from({ length: 18 }, (_, i) => `BLOCK_${i + 1}`);

const normalizeFlatTableBlock = (value: unknown): string => String(value || '').trim().toUpperCase();

const buildFlatTableSlotBuckets = (
  rows: FlatTableRow[],
  requestedBureau: string,
): Map<string, FlatTableSlotBucket> => {
  const buckets = new Map<string, FlatTableSlotBucket>();

  for (const row of rows) {
    const slot = normalizeFlatTableBlock(row.block);
    if (!slot) continue;

    const bucket = buckets.get(slot) || { exact: [], shared: [] };
    const rowBureau = String(row.bureau || '').trim().toUpperCase();

    if (rowBureau === requestedBureau) {
      bucket.exact.push(row);
    } else if (rowBureau === 'ALL') {
      bucket.shared.push(row);
    }

    buckets.set(slot, bucket);
  }

  return buckets;
};

const getFlatTableSlotCandidates = (
  buckets: Map<string, FlatTableSlotBucket>,
  slot: string,
): FlatTableRow[] => {
  const bucket = buckets.get(slot);
  if (!bucket) return [];
  if (bucket.exact.length > 0) return bucket.exact;
  return bucket.shared;
};

const pickFlatTableSlotRow = (
  buckets: Map<string, FlatTableSlotBucket>,
  slot: string,
): FlatTableRow | null => {
  const candidates = getFlatTableSlotCandidates(buckets, slot);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] || null;
};

const wrapFlatTableSegmentHtml = (fragment: string): string => {
  const trimmed = String(fragment || '').trim();
  if (!trimmed) return '';

  if (containsHtmlMarkup(trimmed)) {
    return `<section class="flat-letter-segment">${trimmed}</section>`;
  }

  const paragraphHtml = escapeHtml(trimmed)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br />');

  return `<section class="flat-letter-segment"><p>${paragraphHtml}</p></section>`;
};

// ─── PDF rendering ──────────────────────────────────────────────────────────
interface LetterPdfData {
  clientName: string; clientAddress: string; clientCityStateZip: string;
  clientDob: string; clientSsnLast4: string; bureauName: string;
  bureauAddress: string; date: string; content: string; contentHtml?: string;
  disputeRound: number; skipHeader?: boolean;
}

const buildLetterPdfDocumentHtml = (data: LetterPdfData): string => {
  const leftLines = [data.clientName, data.clientAddress, data.clientCityStateZip,
    data.clientDob ? `Date of Birth: ${data.clientDob}` : '',
    data.clientSsnLast4 ? `SSN (Last 4): ${data.clientSsnLast4}` : ''].filter(Boolean);
  const rightLines = [data.bureauName, ...String(data.bureauAddress || '').split('\n').map(l => l.trim()).filter(Boolean),
    data.date ? `Date: ${data.date}` : ''].filter(Boolean);

  const bodyHtml = (data.contentHtml || '').trim()
    ? data.contentHtml!
    : `<p>${escapeHtml(stripHtmlToPlainText(data.content || '')).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br />')}</p>`;

  const headerHtml = data.skipHeader ? '' : `<section class="letter-header">
    <div class="letter-header__column">${leftLines.map((l, i) => i === 0 ? `<div class="letter-header__name">${escapeHtml(l)}</div>` : `<div>${escapeHtml(l)}</div>`).join('')}</div>
    <div class="letter-header__column letter-header__column--right">${rightLines.map((l, i) => i === 0 ? `<div class="letter-header__name">${escapeHtml(l)}</div>` : `<div>${escapeHtml(l)}</div>`).join('')}</div>
  </section>`;

  return `<!doctype html><html><head><meta charset="utf-8" /><style>
@page { size: Letter; margin: 0.75in; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body { color: #111827; font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.55; }
* { box-sizing: border-box; }
.letter-header { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 0.5in; align-items: start; }
.letter-header__column { white-space: pre-line; }
.letter-header__column--right { text-align: right; }
.letter-header__name { font-size: 12pt; font-weight: 700; }
.letter-body { margin-top: ${data.skipHeader ? '0' : '24px'}; }
.letter-body .flat-letter-segment { display: block; margin: 0 0 0.85em; }
.letter-body .flat-letter-segment:last-child { margin-bottom: 0; }
.letter-body p, .letter-body ul, .letter-body ol, .letter-body blockquote, .letter-body table { margin: 0 0 0.65em; }
.letter-body h1, .letter-body h2, .letter-body h3, .letter-body h4, .letter-body h5, .letter-body h6 { margin: 0 0 0.45em; font-weight: 700; line-height: 1.25; }
.letter-body ul, .letter-body ol { padding-left: 1.4em; }
.letter-body li { margin-bottom: 0.25em; }
.letter-body .letter-block-spacer { height: 0.6em; }
</style></head><body>${headerHtml}<main class="letter-body">${bodyHtml}</main></body></html>`;
};

const renderPlainTextLetterPdfBuffer = async (data: LetterPdfData): Promise<Buffer> => {
  const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(chunk as Buffer));
  const completion = new Promise<Buffer>((resolve, reject) => {
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
  doc.pipe(stream);

  const marginLeft = doc.page.margins.left;
  const pageWidth = doc.page.width;
  const textWidth = pageWidth - marginLeft - doc.page.margins.right;

  if (!data.skipHeader) {
    const headerY = doc.y;
    const colWidth = textWidth / 2;
    doc.font('Times-Bold').fontSize(12).text(data.clientName || '', marginLeft, headerY, { width: colWidth });
    doc.font('Times-Roman').fontSize(11);
    if (data.clientAddress) doc.text(data.clientAddress, marginLeft, doc.y, { width: colWidth });
    if (data.clientCityStateZip) doc.text(data.clientCityStateZip, marginLeft, doc.y, { width: colWidth });
    if (data.clientDob) doc.text(`Date of Birth: ${data.clientDob}`, marginLeft, doc.y, { width: colWidth });
    if (data.clientSsnLast4) doc.text(`SSN (Last 4): ${data.clientSsnLast4}`, marginLeft, doc.y, { width: colWidth });
    const leftEndY = doc.y;
    const rightX = marginLeft + colWidth;
    let ry = headerY;
    doc.font('Times-Bold').fontSize(12).text(data.bureauName || '', rightX, ry, { width: colWidth, align: 'right' });
    ry = doc.y;
    doc.font('Times-Roman').fontSize(11);
    for (const bLine of (data.bureauAddress || '').split('\n').filter(Boolean)) {
      doc.text(bLine.trim(), rightX, ry, { width: colWidth, align: 'right' }); ry = doc.y;
    }
    doc.text(`Date: ${data.date || ''}`, rightX, ry, { width: colWidth, align: 'right' }); ry = doc.y;
    doc.x = marginLeft;
    doc.y = Math.max(leftEndY, ry) + 24;
  }

  const rawContent = stripHtmlToPlainText(data.content || '');
  const paragraphs = rawContent.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  for (const para of paragraphs) {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 80) doc.addPage();
    doc.font('Times-Roman').fontSize(11).text(para, marginLeft, doc.y, { width: textWidth, lineGap: 3 });
    doc.moveDown(0.5);
  }

  doc.end();
  return completion;
};

const renderLetterPdfBuffer = async (data: LetterPdfData): Promise<Buffer> => {
  const fullHtml = buildLetterPdfDocumentHtml(data);
  try {
    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || undefined;
    const timeoutMs = 15000;
    const launchPromise = puppeteer.launch({
      headless: true,
      executablePath: execPath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: timeoutMs,
    });
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Puppeteer launch timed out')), timeoutMs));
    const browser = await Promise.race([launchPromise, timeoutPromise]);
    try {
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'load', timeout: 10000 });
      await page.emulateMediaType('screen');
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Rich PDF rendering failed, falling back to plain text PDF:', error);
    return renderPlainTextLetterPdfBuffer(data);
  }
};

const appendClientDocumentsToPdf = async (basePdf: Buffer, documents: Array<{ label: string; url: string }>): Promise<Buffer> => {
  if (!documents.length) return basePdf;

  const pdfDoc = await PDFLibDocument.load(basePdf);

  type PreviewBox = { x: number; y: number; width: number; height: number };
  type PreviewItem = {
    label: string;
    draw: (page: any, box: PreviewBox) => void;
  };

  const previewItems: PreviewItem[] = [];

  for (const entry of documents) {
    try {
      const docData = await readClientDocument(entry.url);
      if (!docData) continue;

      if (docData.ext === '.pdf') {
        const embeddedPages = await pdfDoc.embedPdf(docData.buffer);
        embeddedPages.forEach((embeddedPage) => {
          previewItems.push({
            label: entry.label,
            draw: (page, box) => {
              const scale = Math.min(box.width / embeddedPage.width, box.height / embeddedPage.height);
              const drawWidth = embeddedPage.width * scale;
              const drawHeight = embeddedPage.height * scale;
              const x = box.x + (box.width - drawWidth) / 2;
              const y = box.y + (box.height - drawHeight) / 2;
              page.drawPage(embeddedPage, { x, y, width: drawWidth, height: drawHeight });
            },
          });
        });
        continue;
      }

      if (IMAGE_EXTENSIONS.has(docData.ext)) {
        const image = docData.ext === '.png'
          ? await pdfDoc.embedPng(docData.buffer)
          : await pdfDoc.embedJpg(docData.buffer);
        const baseSize = image.scale(1);
        previewItems.push({
          label: entry.label,
          draw: (page, box) => {
            const scale = Math.min(box.width / baseSize.width, box.height / baseSize.height);
            const drawWidth = baseSize.width * scale;
            const drawHeight = baseSize.height * scale;
            const x = box.x + (box.width - drawWidth) / 2;
            const y = box.y + (box.height - drawHeight) / 2;
            page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });
          },
        });
      }
    } catch {
      continue;
    }
  }

  if (!previewItems.length) return basePdf;

  const { width, height } = pdfDoc.getPage(0).getSize();
  const pageMargin = 20;

  for (const item of previewItems) {
    const page = pdfDoc.addPage([width, height]);
    const previewBox: PreviewBox = {
      x: pageMargin,
      y: pageMargin,
      width: width - pageMargin * 2,
      height: height - pageMargin * 2,
    };
    item.draw(page, previewBox);
  }

  return Buffer.from(await pdfDoc.save());
};

// ─── Round / tone helpers ───────────────────────────────────────────────────
function resolveRound(raw: string | undefined): number {
  if (!raw) return 1;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return 1;
  return Math.max(1, Math.min(4, parsed));
}

function resolveToneLevel(raw: string | undefined, userRole?: string): { applied: ToneLevel; requested?: number } {
  if (!raw) return { applied: 2 };
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return { applied: 2 };
  let candidate: ToneLevel = parsed <= 2 ? 2 : parsed === 3 ? 3 : parsed === 4 ? 4 : 5;
  if (candidate === 5 && userRole && !['admin', 'super_admin', 'support'].includes(userRole)) return { applied: 4, requested: parsed };
  return { applied: candidate, requested: parsed };
}

function getRoundStrategy(round: number): { label: string; objective: string; escalation: string } {
  if (round === 1) return { label: 'Round 1 – Initial Investigation Request', objective: 'Establish a clear, documented FCRA dispute of the tradeline.', escalation: 'This dispute is submitted for initial review and prompt correction of any inaccuracies.' };
  if (round === 2) return { label: 'Round 2 – Follow-Up Reinvestigation', objective: 'Reaffirm the dispute and highlight any ongoing inaccuracy or incompleteness.', escalation: 'This matter has been previously disputed and remains unresolved.' };
  if (round === 3) return { label: 'Round 3 – Escalated Accuracy Challenge', objective: 'Stress the pattern of unresolved reporting issues and demand a careful review.', escalation: 'Failure to correct these reporting deficiencies may leave me no choice but to pursue additional remedies available under federal law.' };
  return { label: 'Round 4 – Final Accuracy and Verification Notice', objective: 'Document a firm request for compliance with FCRA dispute obligations.', escalation: 'Clarifies that the tradeline should not continue to be reported if it cannot be fully verified and reported accurately.' };
}

// Enhanced validation schemas
const disputeObjectSchema = z.object({
  client_id: z.number()
    .int('Client ID must be an integer')
    .positive('Client ID must be positive'),
  
  bureau: z.enum(['experian', 'equifax', 'transunion'], {
    errorMap: () => ({ message: 'Bureau must be experian, equifax, or transunion' })
  }),
  
  account_name: z.string()
    .min(1, 'Account name is required')
    .max(255, 'Account name must be less than 255 characters'),
  
  account_number: z.string()
    .max(50, 'Account number must be less than 50 characters')
    .optional(),
  
  dispute_reason: z.string()
    .min(10, 'Dispute reason must be at least 10 characters')
    .max(1000, 'Dispute reason must be less than 1000 characters'),
  
  dispute_type: z.enum(['inaccurate', 'incomplete', 'unverifiable', 'fraudulent', 'other'], {
    errorMap: () => ({ message: 'Invalid dispute type' })
  }),
  
  status: z.enum(['draft', 'submitted', 'in_progress', 'resolved', 'rejected'], {
    errorMap: () => ({ message: 'Invalid status' })
  }).default('draft'),
  
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Priority must be low, medium, or high' })
  }).default('medium'),
  
  filed_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Filed date must be in YYYY-MM-DD format')
    .refine((date) => {
      const filedDate = new Date(date);
      const today = new Date();
      return filedDate <= today;
    }, 'Filed date cannot be in the future')
    .optional(),
  
  response_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Response date must be in YYYY-MM-DD format')
    .optional(),
  
  expected_resolution_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected resolution date must be in YYYY-MM-DD format')
    .optional(),
  
  result: z.string()
    .max(2000, 'Result must be less than 2000 characters')
    .optional(),
  
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional(),
  
  documents: z.array(z.string().url('Invalid document URL'))
    .max(10, 'Cannot attach more than 10 documents')
    .optional()
});

const validateDisputeDates = (data: any, ctx: z.RefinementCtx) => {
  if (data?.response_date && !data?.filed_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Filed date is required when response date is provided',
      path: ['filed_date'],
    });
    return;
  }
  if (data?.response_date && data?.filed_date) {
    const response = new Date(String(data.response_date));
    const filed = new Date(String(data.filed_date));
    if (response < filed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Response date must be after filed date',
        path: ['response_date'],
      });
    }
  }
};

const disputeSchema = disputeObjectSchema.superRefine(validateDisputeDates);
const updateDisputeSchema = disputeObjectSchema.partial().superRefine(validateDisputeDates);

// Query parameter validation
const disputeQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n <= 100, 'Limit cannot exceed 100').default('20'),
  search: z.string().max(100).optional(),
  status: z.enum(['draft', 'submitted', 'in_progress', 'resolved', 'rejected']).optional(),
  bureau: z.enum(['experian', 'equifax', 'transunion']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  client_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  dispute_type: z.enum(['inaccurate', 'incomplete', 'unverifiable', 'fraudulent', 'other']).optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'filed_date', 'priority', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Get all disputes for the authenticated user with enhanced filtering
export async function getDisputes(req: AuthRequest, res: Response) {
  try {
    // Validate query parameters
    const queryParams = disputeQuerySchema.parse(req.query);
    const { 
      page, limit, search, status, bureau, priority, client_id, 
      dispute_type, sort_by, sort_order, date_from, date_to 
    } = queryParams;
    
    // Build secure query with joins
    let query = `
      SELECT 
        d.id, d.client_id, d.bureau, d.account_name, d.account_number,
        d.dispute_reason, d.dispute_type, d.status, d.priority,
        d.filed_date, d.response_date, d.expected_resolution_date,
        d.result, d.notes, d.documents, d.created_at, d.updated_at,
        d.created_by, d.updated_by,
        c.first_name, c.last_name, c.email as client_email
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
    `;
    
    let params: any[] = [req.user!.id];
    
    // Add filters with proper sanitization
    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }
    
    if (bureau) {
      query += ' AND d.bureau = ?';
      params.push(bureau);
    }
    
    if (priority) {
      query += ' AND d.priority = ?';
      params.push(priority);
    }
    
    if (client_id) {
      query += ' AND d.client_id = ?';
      params.push(client_id);
    }
    
    if (dispute_type) {
      query += ' AND d.dispute_type = ?';
      params.push(dispute_type);
    }
    
    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      query += ' AND (d.account_name LIKE ? OR d.dispute_reason LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)';
      const searchParam = `%${sanitizedSearch}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    if (date_from) {
      query += ' AND d.created_at >= ?';
      params.push(date_from + ' 00:00:00');
    }
    
    if (date_to) {
      query += ' AND d.created_at <= ?';
      params.push(date_to + ' 23:59:59');
    }
    
    // Add sorting with whitelist validation
    const allowedSortColumns = ['created_at', 'updated_at', 'filed_date', 'priority', 'status'];
    const allowedSortOrders = ['asc', 'desc'];
    
    if (allowedSortColumns.includes(sort_by) && allowedSortOrders.includes(sort_order)) {
      // Handle priority sorting specially
      if (sort_by === 'priority') {
        query += ` ORDER BY CASE d.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ${sort_order.toUpperCase()}`;
      } else {
        query += ` ORDER BY d.${sort_by} ${sort_order.toUpperCase()}`;
      }
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const disputes = await allQuery(query, params);
    
    // Parse documents JSON for each dispute
    const processedDisputes = disputes.map(dispute => ({
      ...dispute,
      documents: dispute.documents ? JSON.parse(dispute.documents) : []
    }));
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
    `;
    let countParams: any[] = [req.user!.id];
    
    // Apply same filters to count query
    if (status) {
      countQuery += ' AND d.status = ?';
      countParams.push(status);
    }
    
    if (bureau) {
      countQuery += ' AND d.bureau = ?';
      countParams.push(bureau);
    }
    
    if (priority) {
      countQuery += ' AND d.priority = ?';
      countParams.push(priority);
    }
    
    if (client_id) {
      countQuery += ' AND d.client_id = ?';
      countParams.push(client_id);
    }
    
    if (dispute_type) {
      countQuery += ' AND d.dispute_type = ?';
      countParams.push(dispute_type);
    }
    
    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      countQuery += ' AND (d.account_name LIKE ? OR d.dispute_reason LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)';
      const searchParam = `%${sanitizedSearch}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    if (date_from) {
      countQuery += ' AND d.created_at >= ?';
      countParams.push(date_from + ' 00:00:00');
    }
    
    if (date_to) {
      countQuery += ' AND d.created_at <= ?';
      countParams.push(date_to + ' 23:59:59');
    }
    
    const countResult = await getQuery(countQuery, countParams);
    const total = countResult?.total || 0;
    
    // Log activity
    await logActivity(
      'disputes_list_viewed',
      `Viewed disputes list (page ${page}, ${processedDisputes.length} results)`,
      req.user!.id,
      undefined,
      undefined,
      { page, limit, filters: { status, bureau, priority, client_id, dispute_type }, total },
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      data: {
        disputes: processedDisputes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        },
        filters: {
          search, status, bureau, priority, client_id, dispute_type,
          sort_by, sort_order, date_from, date_to
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching disputes:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch disputes'
    });
  }
}

// Get a specific dispute with enhanced security checks
export async function getDispute(req: AuthRequest, res: Response) {
  try {
    const disputeId = parseInt(req.params.id);
    
    if (isNaN(disputeId) || disputeId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dispute ID'
      });
    }
    
    const dispute = await getQuery(
      `SELECT 
        d.*, c.first_name, c.last_name, c.email as client_email,
        c.phone as client_phone, c.address as client_address
       FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ? AND c.user_id = ?`,
      [disputeId, req.user!.id]
    );
    
    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found or access denied'
      });
    }
    
    // Parse documents JSON
    dispute.documents = dispute.documents ? JSON.parse(dispute.documents) : [];
    
    // Get related activities
    const activities = await allQuery(
      `SELECT activity_type, description, created_at, created_by
       FROM activities 
       WHERE dispute_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [disputeId]
    );
    
    // Log activity
    await logActivity(
      'dispute_viewed',
      `Viewed dispute details: ${dispute.account_name} (${dispute.bureau})`,
      req.user!.id,
      dispute.client_id,
      disputeId,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      data: {
        dispute,
        related_data: {
          activities
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching dispute:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch dispute'
    });
  }
}

// Create a new dispute with enhanced validation
export async function createDispute(req: AuthRequest, res: Response) {
  try {
    // Validate and sanitize input data
    const disputeData = disputeSchema.parse(req.body);
    
    // Verify that the client belongs to the authenticated user
    const client = await getQuery(
      'SELECT id, first_name, last_name FROM clients WHERE id = ? AND user_id = ?',
      [disputeData.client_id, req.user!.id]
    );
    
    if (!client) {
      return res.status(400).json({
        success: false,
        error: 'Client not found or access denied'
      });
    }
    
    // Check for duplicate disputes (same client, bureau, account)
    const existingDispute = await getQuery(
      `SELECT id FROM disputes 
       WHERE client_id = ? AND bureau = ? AND account_name = ? AND status NOT IN ('resolved', 'rejected')`,
      [disputeData.client_id, disputeData.bureau, disputeData.account_name]
    );
    
    if (existingDispute) {
      return res.status(409).json({
        success: false,
        error: 'An active dispute for this account already exists with this bureau'
      });
    }
    
    // Prepare transaction queries
    const queries = [
      {
        sql: `INSERT INTO disputes (
          client_id, bureau, account_name, account_number, dispute_reason,
          dispute_type, status, priority, filed_date, response_date,
          expected_resolution_date, result, notes, documents,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          disputeData.client_id,
          disputeData.bureau,
          sanitizeInput(disputeData.account_name),
          sanitizeInput(disputeData.account_number) || null,
          sanitizeInput(disputeData.dispute_reason),
          disputeData.dispute_type,
          disputeData.status,
          disputeData.priority,
          disputeData.filed_date || null,
          disputeData.response_date || null,
          disputeData.expected_resolution_date || null,
          sanitizeInput(disputeData.result) || null,
          sanitizeInput(disputeData.notes) || null,
          disputeData.documents ? JSON.stringify(disputeData.documents) : null,
          req.user!.id,
          req.user!.id
        ]
      }
    ];
    
    const results = await runTransaction(queries);
    const disputeId = results[0];
    
    // Get the created dispute with client info
    const newDispute = await getQuery(
      `SELECT d.*, c.first_name, c.last_name, c.email as client_email
       FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ?`,
      [disputeId]
    );
    
    // Parse documents JSON
    newDispute.documents = newDispute.documents ? JSON.parse(newDispute.documents) : [];
    
    // Log activity and audit
    await Promise.all([
      logActivity(
        'dispute_created',
        `New dispute created: ${disputeData.account_name} with ${disputeData.bureau}`,
        req.user!.id,
        disputeData.client_id,
        disputeId,
        { 
          bureau: disputeData.bureau, 
          dispute_type: disputeData.dispute_type,
          priority: disputeData.priority 
        },
        req.ip,
        req.get('User-Agent')
      ),
      logAudit(
        'disputes',
        disputeId,
        'INSERT',
        null,
        newDispute,
        req.user!.id,
        req.ip,
        req.get('User-Agent')
      )
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: {
        dispute: newDispute
      }
    });
    
  } catch (error) {
    console.error('Error creating dispute:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create dispute'
    });
  }
}

// Update a dispute with enhanced validation and audit trail
export async function updateDispute(req: AuthRequest, res: Response) {
  try {
    const disputeId = parseInt(req.params.id);
    
    if (isNaN(disputeId) || disputeId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dispute ID'
      });
    }
    
    const updates = updateDisputeSchema.parse(req.body);
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }
    
    // Get existing dispute for audit trail and validation
    const existingDispute = await getQuery(
      `SELECT d.* FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ? AND c.user_id = ?`,
      [disputeId, req.user!.id]
    );
    
    if (!existingDispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found or access denied'
      });
    }
    
    // Validate client_id if being updated
    if (updates.client_id && updates.client_id !== existingDispute.client_id) {
      const client = await getQuery(
        'SELECT id FROM clients WHERE id = ? AND user_id = ?',
        [updates.client_id, req.user!.id]
      );
      
      if (!client) {
        return res.status(400).json({
          success: false,
          error: 'Invalid client ID or access denied'
        });
      }
    }
    
    // Build dynamic update query with sanitization
    const fields = Object.keys(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = updates[field as keyof typeof updates];
      // Sanitize string inputs
      if (typeof value === 'string' && ['account_name', 'account_number', 'dispute_reason', 'result', 'notes'].includes(field)) {
        return sanitizeInput(value);
      }
      // Handle documents array
      if (field === 'documents' && Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    await runQuery(
      `UPDATE disputes SET ${setClause}, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, req.user!.id, disputeId]
    );
    
    // Get updated dispute with client info
    const updatedDispute = await getQuery(
      `SELECT d.*, c.first_name, c.last_name, c.email as client_email
       FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ?`,
      [disputeId]
    );
    
    // Parse documents JSON
    updatedDispute.documents = updatedDispute.documents ? JSON.parse(updatedDispute.documents) : [];
    
    // Log activity and audit
    await Promise.all([
      logActivity(
        'dispute_updated',
        `Dispute updated: ${updatedDispute.account_name} (${updatedDispute.bureau})`,
        req.user!.id,
        updatedDispute.client_id,
        disputeId,
        { updated_fields: fields },
        req.ip,
        req.get('User-Agent')
      ),
      logAudit(
        'disputes',
        disputeId,
        'UPDATE',
        existingDispute,
        updatedDispute,
        req.user!.id,
        req.ip,
        req.get('User-Agent')
      )
    ]);
    
    res.json({
      success: true,
      message: 'Dispute updated successfully',
      data: {
        dispute: updatedDispute
      }
    });
    
  } catch (error) {
    console.error('Error updating dispute:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update dispute'
    });
  }
}

// Delete a dispute with enhanced security
export async function deleteDispute(req: AuthRequest, res: Response) {
  try {
    const disputeId = parseInt(req.params.id);
    
    if (isNaN(disputeId) || disputeId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dispute ID'
      });
    }
    
    // Get existing dispute for audit trail
    const existingDispute = await getQuery(
      `SELECT d.* FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ? AND c.user_id = ?`,
      [disputeId, req.user!.id]
    );
    
    if (!existingDispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found or access denied'
      });
    }
    
    // Check if dispute can be deleted (only drafts and rejected disputes)
    if (!['draft', 'rejected'].includes(existingDispute.status)) {
      return res.status(400).json({
        success: false,
        error: 'Only draft and rejected disputes can be deleted',
        current_status: existingDispute.status
      });
    }
    
    // Delete dispute
    await runQuery(
      'DELETE FROM disputes WHERE id = ?',
      [disputeId]
    );
    
    // Log activity and audit
    await Promise.all([
      logActivity(
        'dispute_deleted',
        `Dispute deleted: ${existingDispute.account_name} (${existingDispute.bureau})`,
        req.user!.id,
        existingDispute.client_id,
        disputeId,
        { status: existingDispute.status },
        req.ip,
        req.get('User-Agent')
      ),
      logAudit(
        'disputes',
        disputeId,
        'DELETE',
        existingDispute,
        null,
        req.user!.id,
        req.ip,
        req.get('User-Agent')
      )
    ]);
    
    res.json({
      success: true,
      message: 'Dispute deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting dispute:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete dispute'
    });
  }
}

// Get comprehensive dispute statistics
export async function getDisputeStats(req: AuthRequest, res: Response) {
  try {
    // Get basic stats
    const basicStats = await getQuery(`
      SELECT 
        COUNT(*) as total_disputes,
        COUNT(CASE WHEN d.status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN d.status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN d.status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN d.status = 'rejected' THEN 1 END) as rejected
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
    `, [req.user!.id]);
    
    // Calculate success rate
    const successfulDisputes = basicStats?.resolved || 0;
    const totalCompleted = (basicStats?.resolved || 0) + (basicStats?.rejected || 0);
    const successRate = totalCompleted > 0 ? Math.round((successfulDisputes / totalCompleted) * 100) : 0;
    
    // Get bureau breakdown
    const bureauStats = await allQuery(`
      SELECT 
        d.bureau,
        COUNT(*) as total,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN d.status = 'rejected' THEN 1 END) as rejected
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
      GROUP BY d.bureau
    `, [req.user!.id]);
    
    // Get dispute type breakdown
    const typeStats = await allQuery(`
      SELECT 
        d.dispute_type,
        COUNT(*) as count,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
      GROUP BY d.dispute_type
      ORDER BY count DESC
    `, [req.user!.id]);
    
    // Get priority breakdown
    const priorityStats = await allQuery(`
      SELECT 
        d.priority,
        COUNT(*) as count,
        AVG(CASE 
          WHEN d.filed_date IS NOT NULL AND d.response_date IS NOT NULL 
          THEN julianday(d.response_date) - julianday(d.filed_date)
        END) as avg_resolution_days
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
      GROUP BY d.priority
    `, [req.user!.id]);
    
    // Get recent activity (last 30 days)
    const recentStats = await getQuery(`
      SELECT 
        COUNT(*) as recent_disputes,
        COUNT(CASE WHEN d.created_at >= date('now', '-7 days') THEN 1 END) as this_week,
        COUNT(CASE WHEN d.status = 'resolved' AND d.updated_at >= date('now', '-30 days') THEN 1 END) as recent_resolved
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ? AND d.created_at >= date('now', '-30 days')
    `, [req.user!.id]);
    
    // Get monthly trends (last 12 months)
    const monthlyTrends = await allQuery(`
      SELECT 
        strftime('%Y-%m', d.created_at) as month,
        COUNT(*) as new_disputes,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_disputes
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ? AND d.created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', d.created_at)
      ORDER BY month DESC
      LIMIT 12
    `, [req.user!.id]);
    
    // Log activity
    await logActivity(
      'dispute_stats_viewed',
      'Viewed dispute statistics dashboard',
      req.user!.id,
      undefined,
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      data: {
        overview: {
          ...basicStats,
          success_rate: successRate,
          total_completed: totalCompleted
        },
        bureau_breakdown: bureauStats.map(bureau => ({
          ...bureau,
          success_rate: (bureau.resolved + bureau.rejected) > 0 
            ? Math.round((bureau.resolved / (bureau.resolved + bureau.rejected)) * 100) 
            : 0
        })),
        type_breakdown: typeStats.map(type => ({
          ...type,
          success_rate: type.count > 0 ? Math.round((type.resolved / type.count) * 100) : 0
        })),
        priority_breakdown: priorityStats.map(priority => ({
          ...priority,
          avg_resolution_days: priority.avg_resolution_days ? Math.round(priority.avg_resolution_days) : null
        })),
        recent_activity: recentStats,
        monthly_trends: monthlyTrends.reverse(), // Show oldest to newest
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching dispute stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch dispute statistics'
    });
  }
}

// Generate dispute letter using dispute_letter_content DB table (matches source pipeline)
export async function generateDisputeLetter(req: AuthRequest, res: Response) {
  try {
    const disputeId = parseInt(req.params.dispute_id);

    if (isNaN(disputeId) || disputeId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid dispute ID' });
    }

    // ── Get dispute + client data ────────────────────────────────────────
    const userRole = (req.user as any)?.role;
    const isAdminOrSuper = userRole === 'admin' || userRole === 'super_admin';
    const dispute = await getQuery(
      isAdminOrSuper
        ? `SELECT d.*, c.first_name, c.last_name, c.street_number_and_name as address, c.city, c.state, c.zip_code, c.date_of_birth, c.ssn_last_four, c.email as client_email, c.phone as client_phone
           FROM disputes d JOIN clients c ON d.client_id = c.id WHERE d.id = ?`
        : `SELECT d.*, c.first_name, c.last_name, c.street_number_and_name as address, c.city, c.state, c.zip_code, c.date_of_birth, c.ssn_last_four, c.email as client_email, c.phone as client_phone
           FROM disputes d JOIN clients c ON d.client_id = c.id WHERE d.id = ? AND c.user_id = ?`,
      isAdminOrSuper ? [disputeId] : [disputeId, req.user!.id]
    );

    if (!dispute) {
      return res.status(404).json({ success: false, error: 'Dispute not found or access denied' });
    }

    const bureauKey = (dispute.bureau || '').toLowerCase() as BureauKey;
    const bureauConfig = BUREAU_CONFIG[bureauKey];
    if (!bureauConfig) {
      return res.status(400).json({ success: false, error: 'Unsupported credit bureau' });
    }

    // ── Resolve parameters ───────────────────────────────────────────────
    const q = req.query as Record<string, any>;
    const disputeRound = resolveRound(q.round || q.dispute_round);
    const { applied: toneLevel, requested: requestedTone } = resolveToneLevel(q.tone_level || q.tone, req.user?.role);
    const roundStrategy = getRoundStrategy(disputeRound);

    const normalizeDate = (value: any) => {
      if (!value) return '';
      const parsed = new Date(value);
      return !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString('en-US') : String(value);
    };

    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── Category detection ───────────────────────────────────────────────
    const categoryText = [q.category_hint, q.negative_item_type, q.account_or_inquiry_type, q.creditor_name, q.tradeline_list, dispute.account_name, dispute.dispute_reason].filter(Boolean).join(' ');
    const categoryKey = detectCategoryKeyFromText(categoryText);

    // ── Client info ──────────────────────────────────────────────────────
    const clientAddress = [dispute.address, dispute.city && dispute.state ? `${dispute.city}, ${dispute.state}` : null, dispute.zip_code].filter(Boolean).join('\n');
    const clientCityStateZip = [dispute.city, dispute.state ? ` ${dispute.state}` : null, dispute.zip_code ? ` ${dispute.zip_code}` : null].filter(Boolean).join('').trim();
    const clientDob = normalizeDate(dispute.date_of_birth);
    const clientSsnLast4 = String(dispute.ssn_last_four || '');
    const clientPhone = String(q.consumer_number || q.consumer_phone || q.phone || dispute.client_phone || '').trim();
    const clientEmail = String(q.consumer_email || q.consumer_emaill || q.email || dispute.client_email || '').trim();

    const effectiveConsumerAddress = String(q.consumer_address || q.consumer_full_address || q.client_address || q.address_line1 || q.street_address || '' || clientAddress).trim() || clientAddress;
    const consumerCityStateZipOverride = String(q.consumer_city_state_zip || q.city_state_zip || [q.city, q.state, q.zip || q.postal_code].filter(Boolean).join(' ')).trim() || clientCityStateZip;

    const accountNumberInput = String(q.account_number || dispute.account_number || '').trim();
    const accountNumberMaskedInput = String(q.account_number_masked || '').trim();
    const accountNumberOutput = accountNumberMaskedInput && accountNumberMaskedInput !== accountNumberInput ? maskAccountNumber(accountNumberInput) : accountNumberInput;
    const creditorValue = String(q.creditor_name || dispute.account_name || '').trim();
    const tradelineTypeValue = String(q.account_or_inquiry_type || q.negative_item_type || '').trim();
    const tradelineListRaw = String(q.tradeline_list || '').trim();
    const negativeItemDateRaw = String(q.negative_item_date || '').trim();
    const defaultDisputeReason = 'The above-referenced tradelines are reporting information that is inaccurate, incomplete, or not capable of being fully verified under FCRA §607(b).';
    const disputeReasonText = String(q.specific_dispute_reason || dispute.dispute_reason || '').trim() || defaultDisputeReason;

    const flatTableItems = parseFlatTableItems(q.tradeline_items);
    const parsedTradelines = parseTradelineList(tradelineListRaw);
    const tradelineFallback = tradelineListRaw || `- ${creditorValue} – ${tradelineTypeValue || 'Account'} (Account ${accountNumberOutput}, ${bureauConfig.name})`;

    const subjectTarget = String(q.subject_target || '').trim() || (parsedTradelines.length === 1 ? parsedTradelines[0].creditor : '');

    // ── Creditor / account list entries ──────────────────────────────────
    const creditorEntries = flatTableItems.length > 0 ? buildCreditorEntries(flatTableItems) : buildCreditorEntriesFromTradelines(parsedTradelines, negativeItemDateRaw);
    const creditorListStr = formatCreditorList(creditorEntries);
    const accountNumberEntries = flatTableItems.length > 0 ? buildAccountNumberEntries(flatTableItems) : buildAccountNumberEntriesFromTradelines(parsedTradelines);
    const accountNumberListStr = String(q.account_number_list || '') || formatAccountNumberList(accountNumberEntries);

    // ── Global placeholders map ──────────────────────────────────────────
    const placeholders: Record<string, string> = {
      ClientName: `${dispute.first_name} ${dispute.last_name}`,
      ClientAddress: effectiveConsumerAddress || '',
      BureauName: bureauConfig.name,
      BureauAddress: bureauConfig.address,
      AccountName: creditorValue,
      AccountNumber: accountNumberOutput,
      DisputeReason: disputeReasonText,
      Date: currentDate,
      DisputeRound: roundStrategy.label,
      ToneLevel: String(toneLevel),
      BUREAU_NAME: bureauConfig.name,
      BUREAU_ADDRESS_1: getBureauAddressLines(bureauKey).address1,
      BUREAU_ADDRESS_2: getBureauAddressLines(bureauKey).address2,
      NEGATIVE_ITEM_TYPE: String(q.negative_item_type || ''),
      CREDITOR_NAME: creditorValue,
      ACCOUNT_OR_INQUIRY_TYPE: tradelineTypeValue,
      NEGATIVE_ITEM_DATE: normalizeDate(q.negative_item_date || ''),
      ACCOUNT_NUMBER: accountNumberOutput,
      ACCOUNT_NUMBER_MASKED: accountNumberOutput,
      AMOUNT: String(q.amount || ''),
      SPECIFIC_DISPUTE_REASON: disputeReasonText,
      TRADLINE_LIST: tradelineListRaw || tradelineFallback,
      CONSUMER_FULL_NAME: `${dispute.first_name} ${dispute.last_name}`.trim(),
      CONSUMER_ADDRESS: String(effectiveConsumerAddress || ''),
      CONSUMER_CITY_STATE_ZIP: String(consumerCityStateZipOverride || ''),
      CONSUMER_DOB: clientDob,
      CONSUMER_SSN_LAST4: clientSsnLast4,
      CONSUMER_NUMBER: clientPhone,
      CONSUMER_EMAIL: clientEmail,
      CONSUMER_EMAILL: clientEmail,
      TODAY_DATE: String(q.today_date || currentDate),
      SUBJECT_TARGET: subjectTarget,
      CREDITOR_LIST: creditorListStr,
      CREDITOR_LIST_WISE: '{{CREDITOR_LIST_WISE}}',
      ACCOUNT_NUMBER_LIST: accountNumberListStr,
      ACCOUNT_NUMBER_LIST_WISE: '{{ACCOUNT_NUMBER_LIST_WISE}}',
      DATE_OPENED: normalizeDate(q.date_opened || ''),
      DATE_OF_FIRST_DELINQUENCY: normalizeDate(q.date_of_first_delinquency || ''),
      ACCOUNT_STATUS: String(q.account_status || ''),
      CURRENT_BALANCE: String(q.current_balance || ''),
      ORIGINAL_LOAN_AMOUNT: String(q.original_loan_amount || ''),
      DATE_OF_LAST_PAYMENT: normalizeDate(q.date_of_last_payment || ''),
      DATE_OF_LAST_ACTIVITY: normalizeDate(q.date_of_last_activity || ''),
      ACCOUNT_TYPE: String(q.account_type || ''),
      ACCOUNT_RESPONSIBILITY: String(q.account_responsibility || ''),
      ACCOUNT_STATUS_DATE: normalizeDate(q.account_status_date || ''),
      ACCOUNT_TERMS: String(q.account_terms || ''),
      SCHEDULED_PAYMENT_AMOUNT: String(q.scheduled_payment_amount || ''),
      DATE_CLOSED: normalizeDate(q.date_closed || ''),
      HIGH_BALANCE: String(q.high_balance || ''),
      PAYMENT_STATUS: String(q.payment_status || ''),
    };

    const applyTemplateWithValues = (template: string, values: Record<string, string>) =>
      Object.entries(values).reduce((content, [key, value]) => content.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'gi'), value), template);
    const applyTemplate = (template: string) => applyTemplateWithValues(template, placeholders);

    const buildItemPlaceholders = (item?: Partial<FlatTableItemPayload> | null): Record<string, string> => {
      const itemAccountNumber = String(item?.account_number || '').trim();
      const itemAccountNumberMasked = String(item?.account_number_masked || '').trim() || itemAccountNumber;
      const itemCreditorName = String(item?.creditor_name || '').trim() || creditorValue;
      const itemNegativeType = String(item?.negative_item_type || '').trim() || String(q.negative_item_type || '');
      const itemInquiryType = String(item?.account_or_inquiry_type || '').trim() || tradelineTypeValue;
      const itemDate = normalizeDate(item?.negative_item_date || q.negative_item_date || '');
      const itemTradelineLine = `- ${itemCreditorName || 'Creditor'} – ${itemInquiryType || itemNegativeType || 'Account'} (Account ${itemAccountNumberMasked || itemAccountNumber || accountNumberOutput || 'XXXX'}, ${bureauConfig.name}${itemDate ? `, Date: ${itemDate}` : ''})`;
      const itemCreditorList = itemDate ? `1. ${itemCreditorName} — Date: ${itemDate}` : `1. ${itemCreditorName}`;
      const itemAccountNumberList = `1. ${itemAccountNumberMasked || itemAccountNumber || accountNumberOutput}`;
      return {
        ...placeholders,
        AccountName: itemCreditorName,
        AccountNumber: itemAccountNumberMasked || itemAccountNumber || accountNumberOutput,
        NEGATIVE_ITEM_TYPE: itemNegativeType,
        CREDITOR_NAME: itemCreditorName,
        ACCOUNT_OR_INQUIRY_TYPE: itemInquiryType,
        NEGATIVE_ITEM_DATE: itemDate,
        ACCOUNT_NUMBER: itemAccountNumber || accountNumberOutput,
        ACCOUNT_NUMBER_MASKED: itemAccountNumberMasked || itemAccountNumber || accountNumberOutput,
        AMOUNT: String(item?.amount || ''),
        SUBJECT_TARGET: itemCreditorName,
        TRADLINE_LIST: itemTradelineLine,
        CREDITOR_LIST: itemCreditorList,
        CREDITOR_LIST_WISE: itemCreditorList,
        ACCOUNT_NUMBER_LIST: itemAccountNumberList,
        ACCOUNT_NUMBER_LIST_WISE: itemAccountNumberList,
        DATE_OPENED: normalizeDate(item?.date_opened || ''),
        DATE_OF_FIRST_DELINQUENCY: normalizeDate(item?.date_of_first_delinquency || ''),
        ACCOUNT_STATUS: String(item?.account_status || ''),
        CURRENT_BALANCE: String(item?.current_balance || ''),
        ORIGINAL_LOAN_AMOUNT: String(item?.original_loan_amount || ''),
        DATE_OF_LAST_PAYMENT: normalizeDate(item?.date_of_last_payment || ''),
        DATE_OF_LAST_ACTIVITY: normalizeDate(item?.date_of_last_activity || ''),
        ACCOUNT_TYPE: String(item?.account_type || ''),
        ACCOUNT_RESPONSIBILITY: String(item?.account_responsibility || ''),
        ACCOUNT_STATUS_DATE: normalizeDate(item?.account_status_date || ''),
        ACCOUNT_TERMS: String(item?.account_terms || ''),
        SCHEDULED_PAYMENT_AMOUNT: String(item?.scheduled_payment_amount || ''),
        DATE_CLOSED: normalizeDate(item?.date_closed || ''),
        HIGH_BALANCE: String(item?.high_balance || ''),
        PAYMENT_STATUS: String(item?.payment_status || ''),
      };
    };

    // ══════════════════════════════════════════════════════════════════════
    // ══ FLAT TABLE CONTENT LOADING (dispute_letter_content) ═════════════
    // ══════════════════════════════════════════════════════════════════════
    let content = '';
    let contentHtml = '';
    let usedFlatTable = false;
    let effectiveTemplateSource = 'support';
    let selectedClauseIds: number[] | undefined;

    {
      // Resolve flat-table category name
      let flatCategoryName = String(q.category_hint || '').trim();
      if (!flatCategoryName) {
        const catId = await getSupportCategoryIdForKey(categoryKey);
        if (catId) {
          const catRow = await getQuery('SELECT name FROM support_letter_categories WHERE id = ?', [catId]);
          if (catRow?.name) flatCategoryName = catRow.name;
        }
      }
      // Fallback: if support_letter_categories had no match, scan dispute_letter_content categories directly
      if (!flatCategoryName) {
        try {
          const distinctCats = await allQuery('SELECT DISTINCT category FROM dispute_letter_content') as any[];
          // First try: match categoryKey derived from all available text
          for (const row of distinctCats) {
            if (mapCategoryNameToKey(row.category) === categoryKey) {
              flatCategoryName = row.category;
              break;
            }
          }
          // Second try: use negative_item_type / account_or_inquiry_type as a direct category name
          if (!flatCategoryName) {
            const directCandidates = [q.negative_item_type, q.account_or_inquiry_type, q.category_hint].filter(Boolean).map(String);
            const catNamesLower = new Map(distinctCats.map((r: any) => [String(r.category).toLowerCase(), r.category]));
            for (const candidate of directCandidates) {
              const match = catNamesLower.get(candidate.trim().toLowerCase());
              if (match) { flatCategoryName = match; break; }
            }
          }
          // Third try: re-derive key from negative_item_type alone (covers the
          // case where category_hint was empty but negative_item_type has keywords)
          if (!flatCategoryName) {
            const altKey = detectCategoryKeyFromText(String(q.negative_item_type || ''));
            if (altKey !== 'OTHER') {
              for (const row of distinctCats) {
                if (mapCategoryNameToKey(row.category) === altKey) {
                  flatCategoryName = row.category;
                  break;
                }
              }
            }
          }
        } catch (_) { /* ignore */ }
      }

      const flatBureauCode = normalizeSupportBureau(dispute.bureau || '').code;
      const flatRound = Number(disputeRound) || 1;
      const flatContentType = String(q.content_type || 'STANDARD').trim().toUpperCase() === 'ENHANCED' ? 'ENHANCED' : 'STANDARD';

      console.log(`[generateDisputeLetter] 🔍 FLAT TABLE LOOKUP: category_hint="${q.category_hint}", resolved="${flatCategoryName}", bureau="${flatBureauCode}", round=${flatRound}, type=${flatContentType}`);

      if (flatCategoryName) {
        try {
          const flatRows = (await allQuery(
            'SELECT * FROM dispute_letter_content WHERE bureau IN (?, ?) AND round = ? AND category = ? AND `type` = ?',
            [flatBureauCode, 'ALL', flatRound, flatCategoryName, flatContentType]
          )) as FlatTableRow[];

          console.log(`[generateDisputeLetter] 🔍 FLAT TABLE RESULT: bureau=${flatBureauCode}/ALL, type=${flatContentType}, ${flatRows.length} rows found`);

          if (flatRows.length > 0) {
            const slotBuckets = buildFlatTableSlotBuckets(flatRows, flatBureauCode);

            const pickedParts: string[] = [];
            const pickedIds: number[] = [];
            let pickedNonHeaderSlots = 0;
            let introSlotUsed: string | null = null;

            const perItemRecords = flatTableItems.length > 0
              ? flatTableItems
              : [{
                  creditor_name: creditorValue,
                  negative_item_type: String(q.negative_item_type || ''),
                  account_or_inquiry_type: tradelineTypeValue,
                  negative_item_date: negativeItemDateRaw,
                  account_number: accountNumberInput,
                  account_number_masked: accountNumberOutput,
                  amount: String(q.amount || ''),
                  date_opened: String(q.date_opened || ''),
                  date_of_first_delinquency: String(q.date_of_first_delinquency || ''),
                  account_status: String(q.account_status || ''),
                  current_balance: String(q.current_balance || ''),
                  original_loan_amount: String(q.original_loan_amount || ''),
                  date_of_last_payment: String(q.date_of_last_payment || ''),
                  date_of_last_activity: String(q.date_of_last_activity || ''),
                  account_type: String(q.account_type || ''),
                  account_responsibility: String(q.account_responsibility || ''),
                  account_status_date: String(q.account_status_date || ''),
                  account_terms: String(q.account_terms || ''),
                  scheduled_payment_amount: String(q.scheduled_payment_amount || ''),
                  date_closed: String(q.date_closed || ''),
                  high_balance: String(q.high_balance || ''),
                  payment_status: String(q.payment_status || ''),
                }];

            const appendPickedRow = (row: FlatTableRow | null, values: Record<string, string>) => {
              if (!row) return false;
              const renderedSegment = applyTemplateWithValues(String(row.clause_content || ''), values);
              const wrappedSegment = wrapFlatTableSegmentHtml(renderedSegment);
              if (!wrappedSegment) return false;
              pickedParts.push(wrappedSegment);
              pickedIds.push(row.id);
              pickedNonHeaderSlots += 1;
              return true;
            };

            for (const slot of ['INTRO', ...FLAT_BODY_SLOT_ORDER]) {
              const pickedIntroRow = pickFlatTableSlotRow(slotBuckets, slot);
              if (!pickedIntroRow) continue;
              appendPickedRow(pickedIntroRow, placeholders);
              introSlotUsed = slot;
              break;
            }

            for (const item of perItemRecords) {
              const itemPlaceholders = buildItemPlaceholders(item);
              for (const slot of FLAT_BODY_SLOT_ORDER) {
                if (slot === introSlotUsed) continue;
                appendPickedRow(pickFlatTableSlotRow(slotBuckets, slot), itemPlaceholders);
              }
            }

            appendPickedRow(pickFlatTableSlotRow(slotBuckets, 'OUTRO'), placeholders);

            if (pickedNonHeaderSlots > 0) {
              const headerHtml = applyTemplateWithValues(DEFAULT_DISPUTE_HEADER_HTML, placeholders);
              const assembled = [headerHtml, ...pickedParts].join('\n\n');
              const processed = applyTemplate(assembled);

              content = processed;
              contentHtml = containsHtmlMarkup(processed) ? processed : '';
              selectedClauseIds = pickedIds;
              usedFlatTable = true;
              console.log(`[generateDisputeLetter] ✅ Used dispute_letter_content: bureau=${flatBureauCode}/ALL, round=${flatRound}, category="${flatCategoryName}", type=${flatContentType}, intro_slot=${introSlotUsed || 'none'}, picked_slots=${pickedNonHeaderSlots}, total_rows=${flatRows.length}`);
            }
          }
        } catch (flatErr: any) {
          console.error('[generateDisputeLetter] dispute_letter_content query failed:', flatErr?.message);
        }
      }

      // If flat table had no content, show clear message
      if (!usedFlatTable) {
        const flatBureauCode2 = normalizeSupportBureau(dispute.bureau || '').code;
        const flatRound2 = Number(disputeRound) || 1;
        const flatContentType2 = String(q.content_type || 'STANDARD').trim().toUpperCase() === 'ENHANCED' ? 'ENHANCED' : 'STANDARD';
        const noContentMsg = `<p><strong>No letter content found.</strong></p><p>No content exists in the dispute_letter_content table for: requested bureau=<strong>${flatBureauCode2}</strong> or shared bureau=<strong>ALL</strong>, round=<strong>${flatRound2}</strong>, category=<strong>${flatCategoryName || '(none)'}</strong>, type=<strong>${flatContentType2}</strong>.</p><p>Please add content for this combination in the Super Admin → Letters page.</p>`;
        content = noContentMsg;
        contentHtml = noContentMsg;
        console.warn(`[generateDisputeLetter] ⚠️ NO flat-table content for bureau=${flatBureauCode2}, round=${flatRound2}, category="${flatCategoryName}", type=${flatContentType2}`);
      }
    }

    // ── Universal final pass: resolve remaining {{TOKEN}} placeholders ──
    {
      const finalValues: Record<string, string> = {
        CONSUMER_FULL_NAME: `${dispute.first_name || ''} ${dispute.last_name || ''}`.trim(),
        CONSUMER_ADDRESS: String(effectiveConsumerAddress || ''),
        CONSUMER_CITY_STATE_ZIP: String(consumerCityStateZipOverride || ''),
        CONSUMER_DOB: normalizeDate(dispute.date_of_birth),
        CONSUMER_SSN_LAST4: String(dispute.ssn_last_four || ''),
        CONSUMER_NUMBER: clientPhone,
        CONSUMER_EMAIL: clientEmail,
        CONSUMER_EMAILL: clientEmail,
        TODAY_DATE: currentDate,
        BUREAU_NAME: bureauConfig.name || '',
        BUREAU_ADDRESS_1: getBureauAddressLines(bureauKey).address1,
        BUREAU_ADDRESS_2: getBureauAddressLines(bureauKey).address2,
        CREDITOR_NAME: creditorValue || '',
        ACCOUNT_NUMBER: accountNumberOutput || '',
        ACCOUNT_NUMBER_MASKED: accountNumberOutput || '',
        NEGATIVE_ITEM_TYPE: String(q.negative_item_type || ''),
        ACCOUNT_OR_INQUIRY_TYPE: tradelineTypeValue || '',
        AMOUNT: String(q.amount || ''),
        SPECIFIC_DISPUTE_REASON: disputeReasonText || '',
        TRADLINE_LIST: tradelineListRaw || tradelineFallback || '',
        CREDITOR_LIST: creditorListStr || '',
        CREDITOR_LIST_WISE: '{{CREDITOR_LIST_WISE}}',
        ACCOUNT_NUMBER_LIST: accountNumberListStr || '',
        ACCOUNT_NUMBER_LIST_WISE: '{{ACCOUNT_NUMBER_LIST_WISE}}',
      };
      content = content.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_: string, token: string) => {
        const val = finalValues[token];
        return (val !== undefined && val !== null && String(val).trim().length > 0) ? String(val) : `{{${token}}}`;
      });
      contentHtml = contentHtml.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_: string, token: string) => {
        const val = finalValues[token];
        return (val !== undefined && val !== null && String(val).trim().length > 0) ? String(val) : `{{${token}}}`;
      });
    }

    // ── Stateful passes ──────────────────────────────────────────────────
    content = resolveCreditorListWise(content, creditorEntries);
    contentHtml = resolveCreditorListWise(contentHtml, creditorEntries);
    content = resolveAccountNumberListWise(content, accountNumberEntries);
    contentHtml = resolveAccountNumberListWise(contentHtml, accountNumberEntries);

    // ── Letter hash ──────────────────────────────────────────────────────
    const letterHash = computeLetterHash(content);
    const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;

    const letter = {
      date: currentDate,
      client_name: `${dispute.first_name} ${dispute.last_name}`,
      client_address: [effectiveConsumerAddress, consumerCityStateZipOverride].filter(Boolean).join('\n'),
      bureau_name: bureauConfig.name,
      bureau_address: bureauConfig.address,
      account_name: subjectTarget,
      account_number: accountNumberOutput,
      dispute_reason: disputeReasonText,
      dispute_type: dispute.dispute_type,
      tone_level: toneLevel,
      requested_tone: requestedTone,
      dispute_round: disputeRound,
      template_source: effectiveTemplateSource,
      strategy: { label: roundStrategy.label, objective: roundStrategy.objective },
      selected_clause_ids: selectedClauseIds,
      word_count: wordCount,
      content,
      content_html: contentHtml,
      generated_at: new Date().toISOString(),
      dispute_id: disputeId,
      letter_type: 'formal_dispute',
      letter_hash: letterHash,
    };

    // ── Log activity ─────────────────────────────────────────────────────
    await logActivity(
      'dispute_letter_generated',
      `Generated dispute letter for: ${dispute.account_name} (${dispute.bureau})`,
      req.user!.id,
      dispute.client_id,
      disputeId,
      { letter_type: 'formal_dispute', tone_level: toneLevel, dispute_round: disputeRound, template_source: effectiveTemplateSource, letter_hash: letterHash, word_count: wordCount },
      req.ip,
      req.get('User-Agent')
    );

    const output = String(q.format || q.output || '').toLowerCase();

    // ── Save letter history (skip for PDF — JSON call already saved) ────
    if (output !== 'pdf') {
      try {
        const recentRecord = await getQuery(
          `SELECT * FROM dispute_letter_history WHERE user_id = ? AND dispute_round = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND) ORDER BY created_at DESC LIMIT 1`,
          [req.user!.id, disputeRound]
        );
        if (recentRecord) {
          const safeJsonParse = (v: any, fb: any = []) => { if (!v) return fb; if (Array.isArray(v)) return v; if (typeof v === 'string') { try { return JSON.parse(v); } catch { return fb; } } return fb; };
          const mergedBureaus = Array.from(new Set([...safeJsonParse(recentRecord.bureaus, []), bureauConfig.name]));
          await runQuery(`UPDATE dispute_letter_history SET bureaus = ? WHERE id = ?`, [JSON.stringify(mergedBureaus), recentRecord.id]);
        } else {
          await runQuery(
            `INSERT INTO dispute_letter_history (user_id, client_id, dispute_id, bureaus, negative_item_types, dispute_round, templates_used, template_count, template_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user!.id, dispute.client_id || null, disputeId, JSON.stringify([bureauConfig.name]), JSON.stringify([tradelineTypeValue].filter(Boolean)), disputeRound, '[]', 0, effectiveTemplateSource]
          );
        }
      } catch (histErr) {
        console.error('Failed to save dispute letter history:', histErr);
      }
    }

    // ── PDF output ───────────────────────────────────────────────────────
    if (output === 'pdf') {
      const clientDocuments = await loadClientDocumentsForClient(Number(dispute.client_id || 0));
      const basePdf = await renderLetterPdfBuffer({
        clientName: letter.client_name,
        clientAddress: effectiveConsumerAddress || '',
        clientCityStateZip: consumerCityStateZipOverride || '',
        clientDob: clientDob,
        clientSsnLast4: clientSsnLast4,
        bureauName: bureauConfig.name,
        bureauAddress: bureauConfig.address,
        date: letter.date,
        content: letter.content || '',
        contentHtml: letter.content_html || '',
        disputeRound: disputeRound,
        skipHeader: true, // dispute_letter_content handles its own header
      });
      const finalPdf = await appendClientDocumentsToPdf(basePdf, clientDocuments);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="dispute-letter.pdf"');
      res.end(finalPdf);
      return;
    }

    // ── JSON output (default) ────────────────────────────────────────────
    res.json({ success: true, data: { letter } });

  } catch (error) {
    console.error('Error generating dispute letter:', error);
    res.status(500).json({ success: false, error: 'Internal server error', message: 'Failed to generate dispute letter' });
  }
}

// Bulk operations for disputes
export async function bulkUpdateDisputes(req: AuthRequest, res: Response) {
  try {
    const { dispute_ids, updates } = req.body;
    
    // Validate input
    if (!Array.isArray(dispute_ids) || dispute_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'dispute_ids must be a non-empty array'
      });
    }
    
    if (dispute_ids.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update more than 50 disputes at once'
      });
    }
    
    // Validate updates
    const validatedUpdates = updateDisputeSchema.parse(updates);
    
    if (Object.keys(validatedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }
    
    // Verify all disputes belong to the user's clients
    const placeholders = dispute_ids.map(() => '?').join(',');
    const ownedDisputes = await allQuery(
      `SELECT d.id FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id IN (${placeholders}) AND c.user_id = ?`,
      [...dispute_ids, req.user!.id]
    );
    
    if (ownedDisputes.length !== dispute_ids.length) {
      return res.status(403).json({
        success: false,
        error: 'Some disputes not found or access denied'
      });
    }
    
    // Build update query
    const fields = Object.keys(validatedUpdates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = validatedUpdates[field as keyof typeof validatedUpdates];
      if (field === 'documents' && Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    // Perform bulk update
    await runQuery(
      `UPDATE disputes SET ${setClause}, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      [...values, req.user!.id, ...dispute_ids]
    );
    
    // Log activity
    await logActivity(
      'disputes_bulk_updated',
      `Bulk updated ${dispute_ids.length} disputes`,
      req.user!.id,
      undefined,
      undefined,
      { dispute_ids, updated_fields: fields, count: dispute_ids.length },
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      message: `Successfully updated ${dispute_ids.length} disputes`,
      data: {
        updated_count: dispute_ids.length,
        updated_fields: fields
      }
    });
    
  } catch (error) {
    console.error('Error in bulk update:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to perform bulk update'
    });
  }
}

// ==========================================
// CREDIT REPAIR LETTER GENERATION
// ==========================================

const creditRepairGenerateSchema = z.object({
  client_id: z.number().positive(),
  report_id: z.number().optional(),
  round: z.number().int().min(1).max(6).default(1),
  template_type: z.string().default('DISPUTE_STANDARD'),
  generation_mode: z.string().default('ONE_PER_ITEM'),
  posture: z.string().optional(),
  seed: z.number().optional(),
  items: z.array(z.object({
    negative_item_id: z.string(),
    category_id: z.number(),
    bureau: z.string(),
    negative_item_type: z.string().optional(),
    creditor_name: z.string().optional(),
    account_or_inquiry_type: z.string().optional(),
    negative_item_date: z.string().optional(),
    account_number: z.string().optional(),
    account_number_masked: z.string().optional(),
    amount: z.string().optional(),
    detected_laws: z.array(z.string()).optional(),
  })).min(1),
});

const BUREAU_INFO: Record<string, { label: string; address: string }> = {
  experian: {
    label: 'Experian',
    address: 'P.O. Box 4500, Allen, TX 75013',
  },
  equifax: {
    label: 'Equifax',
    address: 'P.O. Box 740256, Atlanta, GA 30374',
  },
  transunion: {
    label: 'TransUnion',
    address: 'P.O. Box 2000, Chester, PA 19016',
  },
};

function normalizeBureauKey(bureau: string): string {
  return String(bureau || '').toLowerCase().replace(/[^a-z]/g, '');
}

function computeSimpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export async function generateCreditRepairLetters(req: AuthRequest, res: Response) {
  try {
    const body = creditRepairGenerateSchema.parse(req.body || {});
    const client = await getQuery(
      `SELECT id, first_name, last_name, street_number_and_name as address, city, state, zip_code, 
              date_of_birth, ssn_last_four, email as client_email, phone as client_phone
       FROM clients
       WHERE id = ? AND user_id = ?`,
      [body.client_id, req.user!.id]
    );

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found or access denied' });
    }

    if (body.generation_mode !== 'ONE_PER_ITEM') {
      return res.status(400).json({ success: false, error: 'Unsupported generation mode' });
    }

    const errors: any[] = [];
    const letters: any[] = [];
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const consumerName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
    const consumerAddress = String(client.address || '');
    const consumerCityStateZip = [client.city, client.state, client.zip_code].filter(Boolean).join(', ');

    for (const item of body.items) {
      const bureauKey = normalizeBureauKey(item.bureau);
      const bureauInfo = BUREAU_INFO[bureauKey];
      if (!bureauInfo) {
        errors.push({ negative_item_id: item.negative_item_id, error: `Unknown bureau: ${item.bureau}` });
        continue;
      }

      // Try to find a matching support template
      let templateContent: string | null = null;
      let templateId: number | null = null;
      let templateVersion: number | null = null;

      try {
        const templates = await allQuery(
          `SELECT id, content, version FROM support_letter_templates
           WHERE category_id = ? AND (bureau = ? OR bureau IS NULL) AND round = ? 
             AND status = 'active' AND template_type = ?
           ORDER BY bureau DESC, version DESC LIMIT 1`,
          [item.category_id, bureauInfo.label.toUpperCase().substring(0, 2), body.round, body.template_type]
        );
        if (templates.length > 0) {
          templateContent = templates[0].content;
          templateId = templates[0].id;
          templateVersion = templates[0].version;
        }
      } catch (e) {
        // Template lookup failed, will use default
      }

      // Try dispute_letter_content blocks if no template found
      if (!templateContent) {
        try {
          const categoryRow = await getQuery(
            'SELECT name FROM support_letter_categories WHERE id = ?',
            [item.category_id]
          );
          const categoryName = categoryRow?.name || 'General';
          
          const blocks = await allQuery(
            `SELECT block, clause_content FROM dispute_letter_content
             WHERE (bureau = ? OR bureau = 'ALL') AND round = ? AND category = ?
             ORDER BY FIELD(block, 'HEADER','INTRO','BLOCK_1','BLOCK_2','BLOCK_3','BLOCK_4','BLOCK_5',
                          'BLOCK_6','BLOCK_7','BLOCK_8','BLOCK_9','BLOCK_10','BLOCK_11','BLOCK_12',
                          'BLOCK_13','BLOCK_14','BLOCK_15','BLOCK_16','BLOCK_17','BLOCK_18','OUTRO')`,
            [bureauInfo.label.toUpperCase().substring(0, 2), body.round, categoryName]
          );

          if (blocks.length > 0) {
            templateContent = blocks.map((b: any) => b.clause_content).join('\n\n');
          }
        } catch (e) {
          // Block lookup failed, will use default
        }
      }

      // Build default letter if no template found
      if (!templateContent) {
        templateContent = buildDefaultDisputeLetter({
          bureauLabel: bureauInfo.label,
          bureauAddress: bureauInfo.address,
          consumerName,
          consumerAddress,
          consumerCityStateZip,
          currentDate,
          item,
          round: body.round,
        });
      } else {
        // Replace placeholders in template
        const replacements: Record<string, string> = {
          BUREAU_NAME: bureauInfo.label,
          BUREAU_ADDRESS: bureauInfo.address,
          NEGATIVE_ITEM_TYPE: item.negative_item_type || '',
          CREDITOR_NAME: item.creditor_name || '',
          ACCOUNT_OR_INQUIRY_TYPE: item.account_or_inquiry_type || '',
          NEGATIVE_ITEM_DATE: item.negative_item_date || '',
          ACCOUNT_NUMBER: item.account_number || item.account_number_masked || '',
          ACCOUNT_NUMBER_MASKED: item.account_number_masked || '',
          AMOUNT: item.amount || '',
          CONSUMER_FULL_NAME: consumerName,
          CONSUMER_ADDRESS: consumerAddress,
          CONSUMER_CITY_STATE_ZIP: consumerCityStateZip,
          CONSUMER_DOB: client.date_of_birth || '',
          CONSUMER_SSN_LAST4: client.ssn_last_four || '',
          CONSUMER_NUMBER: client.client_phone || '',
          CONSUMER_EMAIL: client.client_email || '',
          TODAY_DATE: currentDate,
        };

        for (const [key, value] of Object.entries(replacements)) {
          templateContent = templateContent.replace(
            new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'),
            value
          );
        }
      }

      const letterHash = computeSimpleHash(templateContent);

      // Check for prior letter (for round >= 2)
      if (body.round >= 2) {
        try {
          const priorLetter = await getQuery(
            `SELECT id, letter_hash FROM credit_repair_generated_letters
             WHERE user_id = ? AND negative_item_id = ? AND bureau = ? AND round = ?
             ORDER BY created_at DESC LIMIT 1`,
            [req.user!.id, item.negative_item_id, bureauKey, body.round - 1]
          );
          if (!priorLetter) {
            errors.push({
              negative_item_id: item.negative_item_id,
              error: 'No prior round letter found',
              bureau: bureauKey,
              requested_round: body.round,
            });
            continue;
          }
        } catch (e) {
          // Prior letter check failed, proceed anyway
        }
      }

      const letter = {
        negative_item_id: item.negative_item_id,
        category_id: item.category_id,
        bureau: bureauKey,
        template_id: templateId,
        template_version: templateVersion,
        round: body.round,
        goal: 'DELETION',
        tone: 'FIRM',
        word_count: templateContent.split(/\s+/).length,
        content: templateContent,
        law_tags: item.detected_laws || [],
        posture: body.posture || null,
        generated_at: new Date().toISOString(),
        letter_hash: letterHash,
      };

      letters.push(letter);

      // Store generated letter
      try {
        await runQuery(
          `INSERT INTO credit_repair_generated_letters (
            user_id, client_id, credit_report_id, negative_item_id, bureau, round,
            goal, tone, template_id, template_version, seed_used,
            selected_clause_ids, rendered_letter, letter_hash, prior_letter_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            req.user!.id, client.id, body.report_id || null,
            item.negative_item_id, bureauKey, body.round,
            'DELETION', 'FIRM', templateId, templateVersion,
            body.seed || null, JSON.stringify([]),
            templateContent, letterHash, null,
          ]
        );
      } catch (e) {
        console.error('Error storing generated letter:', e);
      }

      // Log activity
      try {
        await logActivity(
          'credit_repair_letter_generated',
          `Generated credit repair letter for item ${item.negative_item_id}`,
          req.user!.id,
          client.id,
          undefined,
          {
            report_id: body.report_id || null,
            negative_item_id: item.negative_item_id,
            template_id: templateId,
            round: body.round,
            letter_hash: letterHash,
          },
          req.ip,
          req.get('User-Agent')
        );
      } catch (e) {
        // Activity logging failure should not block
      }
    }

    if (letters.length === 0 && errors.length > 0) {
      return res.status(400).json({ success: false, error: 'Letter generation failed', errors });
    }

    return res.json({
      success: true,
      data: { letters },
      ...(errors.length > 0 ? { warnings: errors } : {}),
    });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request payload',
        details: error?.errors || []
      });
    }
    console.error('Error generating credit repair letters:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate credit repair letters'
    });
  }
}

function buildDefaultDisputeLetter(params: {
  bureauLabel: string;
  bureauAddress: string;
  consumerName: string;
  consumerAddress: string;
  consumerCityStateZip: string;
  currentDate: string;
  item: any;
  round: number;
}): string {
  const { bureauLabel, bureauAddress, consumerName, consumerAddress, consumerCityStateZip, currentDate, item, round } = params;
  
  const roundLabel = round > 1 ? ` (Round ${round} - Escalated)` : '';
  const escalationNote = round > 1
    ? `\n\nThis is my ${round}${round === 2 ? 'nd' : round === 3 ? 'rd' : 'th'} request regarding this matter. My previous dispute was not resolved to my satisfaction, and I am escalating this matter pursuant to FCRA Section 611(a).`
    : '';

  return `${currentDate}

${bureauLabel}
${bureauAddress}

Re: Dispute of Inaccurate Information${roundLabel}

Dear ${bureauLabel} Dispute Department,

I am writing to formally dispute the following information that appears on my credit report, as it is inaccurate and requires investigation and correction pursuant to the Fair Credit Reporting Act (FCRA), Section 611.

Consumer Information:
Name: ${consumerName}
Address: ${consumerAddress}
${consumerCityStateZip}

Disputed Item:
Creditor/Account: ${item.creditor_name || 'Unknown'}
Account Type: ${item.account_or_inquiry_type || item.negative_item_type || 'Unknown'}
Account Number: ${item.account_number || item.account_number_masked || 'On File'}
${item.amount ? `Amount: ${item.amount}` : ''}
Date: ${item.negative_item_date || 'On File'}

Reason for Dispute:
This item is being disputed because it is ${item.negative_item_type || 'inaccurate'}. Under the Fair Credit Reporting Act, you are required to conduct a reasonable reinvestigation of this disputed information within 30 days of receiving this notice.${escalationNote}

I request that you:
1. Conduct a thorough reinvestigation of this disputed item
2. Forward all relevant information to the information furnisher
3. Provide me with the results of your reinvestigation
4. Remove or correct any information found to be inaccurate, incomplete, or unverifiable

Under FCRA Section 611(a)(1)(A), you must complete this reinvestigation within 30 days.
Under FCRA Section 607(b), you have an obligation to follow reasonable procedures to assure maximum possible accuracy.

If you cannot verify this information, it must be promptly deleted from my credit report pursuant to FCRA Section 611(a)(5)(A).

Thank you for your prompt attention to this matter.

Sincerely,
${consumerName}`;
}

// Get generated letter history for a client
export async function getGeneratedLetterHistory(req: AuthRequest, res: Response) {
  try {
    const { client_id } = req.query;
    if (!client_id) {
      return res.status(400).json({ success: false, error: 'client_id is required' });
    }

    // Verify client belongs to user
    const client = await getQuery(
      'SELECT id FROM clients WHERE id = ? AND user_id = ?',
      [Number(client_id), req.user!.id]
    );
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const letters = await allQuery(
      `SELECT id, negative_item_id, bureau, round, goal, tone, template_id, 
              rendered_letter, letter_hash, created_at
       FROM credit_repair_generated_letters
       WHERE user_id = ? AND client_id = ?
       ORDER BY created_at DESC`,
      [req.user!.id, Number(client_id)]
    );

    res.json({ success: true, data: letters });
  } catch (error) {
    console.error('Error fetching generated letter history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch letter history' });
  }
}

// ── Dispute Letter History (per-client) ─────────────────────────────────
export async function getDisputeLetterHistory(req: AuthRequest, res: Response) {
  try {
    const clientId = Number(req.params.clientId);
    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId is required' });
    }

    // Verify client belongs to user (or user is super-admin)
    const isSuperAdmin = (req.user as any)?.role === 'super_admin';
    if (!isSuperAdmin) {
      const client = await getQuery(
        'SELECT id FROM clients WHERE id = ? AND user_id = ?',
        [clientId, req.user!.id]
      );
      if (!client) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }
    }

    const rows = await allQuery(
      `SELECT h.*, u.first_name AS user_first_name, u.last_name AS user_last_name, u.email AS user_email
       FROM dispute_letter_history h
       LEFT JOIN users u ON u.id = h.user_id
       WHERE h.client_id = ?
       ORDER BY h.created_at DESC`,
      [clientId]
    );

    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error('Error fetching dispute letter history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dispute letter history' });
  }
}
