/**
 * Credit Report Scraper Routes
 * 
 * API endpoints for scraping credit reports from various platforms
 */

import express from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fetchCreditReport, PLATFORMS } from '../services/scrapers/index.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getDatabaseAdapter } from '../database/databaseAdapter.js';

const router = express.Router();

// Validation schema for scraper requests
const scraperRequestSchema = z.object({
  platform: z.string().min(1).refine(val => {
    return Object.values(PLATFORMS).includes(val.toLowerCase());
  }, {
    message: 'Unsupported platform'
  }),
  credentials: z.object({
    username: z.string().min(1),
    password: z.string().min(1)
  }),
  options: z.object({
    saveHtml: z.boolean().optional(),
    takeScreenshots: z.boolean().optional(),
    outputDir: z.string().optional(),
    ssnLast4: z.string().length(4).optional()
  }).optional()
});

/**
 * @route POST /api/credit-reports/scrape
 * @desc Scrape credit report from specified platform
 * @access Private
 */
router.post('/scrape', authenticateToken, async (req, res) => {
  try {
    // Validate request body
    const validationResult = scraperRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }
    
    const { platform, credentials, options } = validationResult.data;
    const clientId = req.query.clientId || req.body.clientId || 'unknown';
    
    // Set default options
    const scraperOptions = {
      saveHtml: false,
      takeScreenshots: false,
      outputDir: './scraper-output',
      clientId: clientId,
      ...options
    };
    
    // Start scraping process
    console.log(`Starting credit report scrape for platform: ${platform}, clientId: ${clientId}`);
    const safeOptionsLog = {
      ...scraperOptions,
      ssnLast4: scraperOptions.ssnLast4 ? '****' : undefined,
      outputDir: scraperOptions.outputDir,
    };
    console.log('Scraper options:', safeOptionsLog);
    
    const startTime = Date.now();
    const reportData = await fetchCreditReport(
      platform,
      credentials.username,
      credentials.password,
      scraperOptions
    );
    console.log("🔥🔥 FULL RAW MyScoreIQ SCRAPER OUTPUT:", JSON.stringify(reportData, null, 2));

    const durationMs = Date.now() - startTime;
    console.log(`Scrape finished for ${platform} in ${durationMs}ms`);

    // Normalize MyScoreIQ output to MyFreeScoreNow-like and extract section paths
    try {
      // --- Start robust MyScoreIQ conversion block ---
if (platform && String(platform).toLowerCase() === String(PLATFORMS.MYSCOREIQ).toLowerCase()) {
  const outDir = scraperOptions.outputDir || './scraper-output';
  const cid = String(clientId || 'unknown');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  // 1) Debug: log top-level keys and small sample so we know what the scraper returned
  try {
    console.log("🔥 RAW SCRAPER OUTPUT KEYS:", Object.keys(reportData || {}).join(', '));
    // print a small sample (protect large outputs)
    const sample = (() => {
      try {
        const preview = { keys: Object.keys(reportData || {}) };
        if (reportData && typeof reportData === 'object') {
          // include the first-level small values for quick diagnosis
          for (const k of Object.keys(reportData)) {
            try {
              const v = reportData[k];
              if (typeof v === 'string' && v.length < 200) preview[k] = v;
              else if (Array.isArray(v)) preview[k] = `array(${v.length})`;
              else if (v && typeof v === 'object') preview[k] = `object(${Object.keys(v).slice(0,5).join(',')}${Object.keys(v).length>5 ? ',...' : ''})`;
            } catch {}
          }
        }
        return preview;
      } catch { return null; }
    })();
    console.log('🔥 RAW SCRAPER OUTPUT SAMPLE:', JSON.stringify(sample, null, 2));
  } catch (e) {
    console.warn('Failed to log raw scraper output sample:', e?.message || e);
  }

  // Helper: safe read
  const safeGet = (obj, pathArr) => {
    try {
      return pathArr.reduce((acc, p) => (acc && typeof acc === 'object' ? acc[p] : undefined), obj);
    } catch { return undefined; }
  };

  // Helper: merge arrays across object of bureaus if present
  const mergeAcrossBureaus = (obj, keyNames = []) => {
    const bureaus = ['TransUnion','Experian','Equifax','transunion','experian','equifax'];
    const out = [];
    for (const b of bureaus) {
      if (obj && obj[b] && typeof obj[b] === 'object') {
        for (const k of keyNames) {
          if (Array.isArray(obj[b][k])) out.push(...obj[b][k]);
          // try alternative key name casing
          const alt = Object.keys(obj[b]).find(x => x.toLowerCase() === k.toLowerCase());
          if (alt && Array.isArray(obj[b][alt])) out.push(...obj[b][alt]);
        }
      }
    }
    return out;
  };

  const flattenRawData = (obj, key) => {
    const out = [];
    try {
      const list = obj && obj.data;
      if (Array.isArray(list)) {
        for (const entry of list) {
          const v = entry && entry[key];
          if (!v) continue;
          if (Array.isArray(v)) out.push(...v);
          else out.push(v);
        }
      }
    } catch {}
    return out;
  };

  const bureauToId = (b) => {
    try {
      const s = String(b || '').toLowerCase();
      if (s.includes('trans')) return 1;
      if (s.includes('exper')) return 2;
      if (s.includes('equif')) return 3;
    } catch {}
    return null;
  };

  // Helper: shallow find arrays by name on an object (case-insensitive)
  const findArrayByNames = (obj, nameCandidates=[]) => {
    if (!obj || typeof obj !== 'object') return null;
    for (const key of Object.keys(obj)) {
      for (const cand of nameCandidates) {
        if (key.toLowerCase() === cand.toLowerCase() && Array.isArray(obj[key])) {
          return obj[key];
        }
      }
    }
    return null;
  };

  // Helper: recursively scan object for arrays which look like accounts/inquiries
  const looksLikeAccountArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    const first = arr.find(i => i && typeof i === 'object');
    if (!first) return false;
    const accountHints = ['creditor','creditorName','creditor_name','accountNumber','account_number','currentBalance','current_balance','dateOpened','date_opened','paymentHistory','payStatusHistory'];
    let hits = 0;
    for (const h of accountHints) if (Object.keys(first).some(k => k.toLowerCase().includes(h.toLowerCase()))) hits++;
    return hits >= 1;
  };

  const looksLikeInquiryArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    const first = arr.find(i => i && typeof i === 'object');
    if (!first) return false;
    const hints = ['company_name','company_type','date_of_inquiry','creditorname','industry','dateinquiry'];
    return hints.some(h => Object.keys(first).some(k => k.toLowerCase().includes(h)));
  };

  const looksLikeEmployerArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    const first = arr.find(i => i && typeof i === 'object');
    if (!first) return false;
    const hints = ['employername','dateupdated','datereported','name','date_first_reported','date_last_updated'];
    return hints.some(h => Object.keys(first).some(k => k.toLowerCase().includes(h)));
  };

  const looksLikeAddressArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    const first = arr.find(i => i && typeof i === 'object');
    if (!first) return false;
    const hints = ['house_number','street_name','suffix','city','state','zipcode','streetaddress','zip'];
    return hints.some(h => Object.keys(first).some(k => k.toLowerCase().includes(h)));
  };

  const looksLikePublicRecordArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    const first = arr.find(i => i && typeof i === 'object');
    if (!first) return false;
    const hints = ['public','bankruptcy','court','filing','case'];
    return hints.some(h => Object.keys(first).some(k => k.toLowerCase().includes(h)));
  };

  const findArrayRecursively = (obj, nameCandidates=[]) => {
    const seen = new Set();
    const queue = [obj];
    while (queue.length) {
      const cur = queue.shift();
      if (!cur || typeof cur !== 'object') continue;
      if (Array.isArray(cur)) {
        if (nameCandidates.length) {
          if (looksLikeAccountArray(cur)) return cur;
        } else {
          // if no nameCandidates, return the first array that looks like accounts
          if (looksLikeAccountArray(cur)) return cur;
        }
      }
      for (const k of Object.keys(cur)) {
        const v = cur[k];
        if (v && typeof v === 'object' && !seen.has(v)) {
          seen.add(v);
          queue.push(v);
        }
        // also check named arrays directly
        if (Array.isArray(v) && nameCandidates.length) {
          if (nameCandidates.some(n => k.toLowerCase() === n.toLowerCase()) && looksLikeAccountArray(v)) return v;
        }
      }
    }
    return null;
  };

  const findArrayRecursivelyTyped = (obj, predicate) => {
    const seen = new Set();
    const queue = [obj];
    while (queue.length) {
      const cur = queue.shift();
      if (!cur || typeof cur !== 'object') continue;
      if (Array.isArray(cur)) {
        if (predicate(cur)) return cur;
      }
      for (const k of Object.keys(cur)) {
        const v = cur[k];
        if (v && typeof v === 'object' && !seen.has(v)) {
          seen.add(v);
          queue.push(v);
        }
      }
    }
    return null;
  };

  // possible candidate containers to inspect (order matters)
  const candidates = [
    reportData?.rawCreditData,
    reportData?.raw,
    reportData?.reportData,
    reportData?.data,
    reportData?.report,
    reportData?.parsed,
    reportData?.scraped,
    reportData?.artifacts,
    reportData?.artifacts?.sections,
    reportData
  ].filter(Boolean);

  // default arrays
  let accounts = [], inquiries = [], publicRecords = [], addresses = [], employers = [];

  // 1) If rawCreditData is object of bureaus: merge across bureaus
  const firstRaw = reportData?.rawCreditData || reportData?.report || reportData?.reportData || reportData?.data || null;
  if (firstRaw && typeof firstRaw === 'object') {
    // try merge by common keys
    accounts = mergeAcrossBureaus(firstRaw, ['Accounts','accounts','AccountsList','tradelines']);
    inquiries = mergeAcrossBureaus(firstRaw, ['Inquiries','inquiries','CreditInquiries']);
    publicRecords = mergeAcrossBureaus(firstRaw, ['PublicRecords','public_records','PublicRecordsList']);
    addresses = mergeAcrossBureaus(firstRaw, ['Addresses','addresses']);
    employers = mergeAcrossBureaus(firstRaw, ['Employers','employers']);
  }

  // 2) If still empty, try find arrays by name at top-level candidates
  if (!accounts.length) {
    for (const c of candidates) {
      const found = findArrayByNames(c, ['Accounts','AccountsList','accounts','tradelines','creditAccounts']);
      if (Array.isArray(found) && found.length) { accounts = found; break; }
    }
  }
  if (!inquiries.length) {
    for (const c of candidates) {
      const found = findArrayByNames(c, ['Inquiries','inquiries','CreditInquiries']);
      if (Array.isArray(found) && found.length) { inquiries = found; break; }
    }
  }
  if (!publicRecords.length) {
    for (const c of candidates) {
      const found = findArrayByNames(c, ['PublicRecords','public_records','publicrecords']);
      if (Array.isArray(found) && found.length) { publicRecords = found; break; }
    }
  }
  if (!addresses.length) {
    for (const c of candidates) {
      const found = findArrayByNames(c, ['Addresses','addresses','Address']);
      if (Array.isArray(found) && found.length) { addresses = found; break; }
    }
  }
  if (!employers.length) {
    for (const c of candidates) {
      const found = findArrayByNames(c, ['Employers','employers','Employer']);
      if (Array.isArray(found) && found.length) { employers = found; break; }
    }
  }

  // 3) Final fallback: recursive scan for any array that looks like accounts
  if (!accounts.length) {
    const found = findArrayRecursively(reportData, ['Accounts','accounts','tradelines']);
    if (found) accounts = found;
  }
  if (!inquiries.length) {
    const found = findArrayRecursivelyTyped(reportData, looksLikeInquiryArray);
    if (found) inquiries = found;
  }
  if (!publicRecords.length) {
    const found = findArrayRecursivelyTyped(reportData, looksLikePublicRecordArray);
    if (found) publicRecords = found;
  }
  if (!addresses.length) {
    const found = findArrayRecursivelyTyped(reportData, looksLikeAddressArray);
    if (found) addresses = found;
  }
  if (!employers.length) {
    const found = findArrayRecursivelyTyped(reportData, looksLikeEmployerArray);
    if (found) employers = found;
  }

  // Final normalization: ensure arrays (maybe null -> empty)
  accounts = Array.isArray(accounts) ? accounts : [];
  inquiries = Array.isArray(inquiries) ? inquiries : [];
  publicRecords = Array.isArray(publicRecords) ? publicRecords : [];
  addresses = Array.isArray(addresses) ? addresses : [];
  employers = Array.isArray(employers) ? employers : [];

  // Extra debug logs so you can see counts quickly
  console.log(`MyScoreIQ -> extracted counts: accounts=${accounts.length}, inquiries=${inquiries.length}, publicRecords=${publicRecords.length}, addresses=${addresses.length}, employers=${employers.length}`);

  // Normalize accounts to MyFreeScoreNow-like shape and ensure creditor is a string
  const normalizeStr = (v, def = '') => {
    if (v === null || v === undefined) return def;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'object') {
      if (v && typeof v.name === 'string') return v.name;
    }
    try { return JSON.stringify(v); } catch { return def; }
  };
  const parseDate = (v) => {
    const s = normalizeStr(v, '');
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) {
      const m = s.match(/\d{4}-\d{2}-\d{2}/) || s.match(/\d{2}\/\d{2}\/\d{4}/);
      return m ? m[0] : null;
    }
    return d.toISOString();
  };
  const toNumber = (v) => {
    const s = normalizeStr(v, '');
    const n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  };
  const toTitle = (s) => {
    const str = normalizeStr(s, '');
    return str ? str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : str;
  };
  const statusToLetter = (s) => {
    const t = normalizeStr(s, '').toLowerCase();
    if (!t) return 'C';
    if (t.includes('ok') || t.includes('current') || t.includes('paid') || t.includes('as agreed')) return 'C';
    if (t.includes('30')) return '1';
    if (t.includes('60')) return '2';
    if (t.includes('90')) return '3';
    if (t.includes('late') || t.includes('delinquent')) return 'L';
    if (t.includes('charge')) return 'X';
    return 'C';
  };

  const buildPayStatusHistory = (a) => {
    if (Array.isArray(a?.payment_histories)) {
      const monthsOrder = ['january','february','march','april','may','june','july','august','september','october','november','december'];
      const parts = [];
      for (const ph of a.payment_histories) {
        for (const m of monthsOrder) {
          if (ph[m]) parts.push(statusToLetter(ph[m]));
        }
      }
      return parts.join('');
    }
    const hist = normalizeStr(a?.PayStatusHistory?.status || a?.paymentHistory || '', '');
    if (!hist) return '';
    return hist.split(/[\s,;|]+/).map(statusToLetter).join('');
  };

  const accountsFormal = accounts.map((a, idx) => {
    const creditorName = normalizeStr(a?.CreditorName || a?.name || a?.creditor?.name || a?.creditor, '');
    const bureauId = a?.bureau_id ?? bureauToId(a?.bureau || a?.Bureau || a?.Source?.Bureau?.symbol) ?? (idx % 3) + 1;
    return {
      BureauId: bureauId,
      AccountTypeDescription: toTitle(a?.AccountTypeDescription || a?.classification || a?.type),
      HighBalance: normalizeStr(a?.HighBalance || a?.high_balance || a?.GrantedTrade?.highBalance || toNumber(a?.high_balance), ''),
      DateReported: (parseDate(a?.DateReported || a?.dateReported || a?.status_date) || '')?.slice(0,10) || '',
      DateOpened: (parseDate(a?.DateOpened || a?.dateOpened || a?.date_opened || a?.opened) || '')?.slice(0,10) || '',
      AccountNumber: normalizeStr(a?.AccountNumber || a?.accountNumber || a?.number, '').replace(/\*/g, ''),
      DateAccountStatus: (parseDate(a?.dateAccountStatus || a?.status_date || a?.DateReported || a?.dateReported) || '')?.slice(0,10) || '',
      CurrentBalance: String(toNumber(a?.CurrentBalance || a?.balance || a?.current_balance)),
      CreditorName: creditorName || normalizeStr(a?.CreditorName, ''),
      AccountCondition: normalizeStr(a?.AccountCondition?.description || a?.type_definition_flags?.account_status || a?.account_condition, ''),
      AccountDesignator: normalizeStr(a?.AccountDesignator?.description || a?.responsibility, ''),
      DisputeFlag: normalizeStr(a?.DisputeFlag?.description || 'Account not disputed', ''),
      Industry: normalizeStr(a?.Industry || a?.IndustryCode?.description || a?.business_type, ''),
      AccountStatus: normalizeStr(a?.OpenClosed?.description || a?.account_status || a?.type_definition_flags?.account_status, ''),
      PaymentStatus: normalizeStr(a?.PayStatus?.description || a?.payment_status_class || a?.payment_status, ''),
      AmountPastDue: String(toNumber(a?.GrantedTrade?.amountPastDue || a?.past_due_amount)),
      AccountType: toTitle(a?.GrantedTrade?.AccountType?.description || a?.type_raw),
      CreditType: toTitle(a?.GrantedTrade?.CreditType?.description || a?.classification || a?.type),
      PaymentFrequency: normalizeStr(a?.GrantedTrade?.PaymentFrequency?.description || '', ''),
      TermType: normalizeStr(a?.GrantedTrade?.TermType?.description || 'Provided', ''),
      WorstPayStatus: normalizeStr(a?.GrantedTrade?.WorstPayStatus?.description || 'Current', ''),
      PayStatusHistoryStartDate: (parseDate(a?.GrantedTrade?.PayStatusHistory?.startDate || a?.balance_date || a?.status_date) || '')?.slice(0,10) || '',
      PayStatusHistory: buildPayStatusHistory(a) || '',
      Remark: (Array.isArray(a?.Remark) && a.Remark[0]?.RemarkCode?.description) ? a.Remark[0].RemarkCode.description : null,
      CreditLimit: String(toNumber(a?.CreditLimit || a?.limit || a?.credit_limit))
    };
  });

  const accountsAlias = accounts.map((a) => {
    const creditorName = normalizeStr(a?.CreditorName || a?.name || a?.creditor?.name || a?.creditor, 'Unknown Creditor');
    return {
      creditor: creditorName,
      name: normalizeStr(a?.name || a?.CreditorName || creditorName, ''),
      type: normalizeStr(a?.AccountTypeDescription || a?.classification || a?.type, ''),
      CurrentBalance: toNumber(a?.CurrentBalance || a?.balance),
      CreditLimit: toNumber(a?.CreditLimit || a?.limit),
      DateOpened: parseDate(a?.DateOpened || a?.date_opened || a?.opened),
      DateReported: parseDate(a?.DateReported || a?.status_date),
    };
  });

  const inquiriesFormal = inquiries.map((inq, idx) => ({
    BureauId: inq?.bureau_id ?? bureauToId(inq?.bureau) ?? (idx % 3) + 1,
    DateInquiry: (parseDate(inq?.DateInquiry || inq?.date || inq?.date_of_inquiry || inq?.inquiry_date) || '')?.slice(0,10) || '',
    CreditorName: normalizeStr(inq?.company_name || inq?.companyName || inq?.CreditorName || inq?.creditor?.name || inq?.creditor, ''),
    InquiryType: normalizeStr(inq?.InquiryType || inq?.type || inq?.inquiry_type, ''),
    Industry: normalizeStr(inq?.company_type || inq?.companyType || inq?.Industry || inq?.industry, '')
  }));

  const employersFormal = (Array.isArray(employers) ? employers : []).map((emp, idx) => ({
    EmployerName: normalizeStr(emp?.EmployerName || emp?.name || '', ''),
    BureauId: emp?.bureau_id ?? bureauToId(emp?.bureau) ?? (idx % 3) + 1,
    DateReported: (parseDate(emp?.DateReported || emp?.date_first_reported) || '')?.slice(0,10) || '',
    DateUpdated: (parseDate(emp?.DateUpdated || emp?.date_last_updated) || '')?.slice(0,10) || '',
    Position: normalizeStr(emp?.Position || '', ''),
    Income: toNumber(emp?.Income || emp?.income)
  }));

  const pickLatestAddressDate = (arr) => {
    let latest = null;
    for (const a of arr || []) {
      const d = parseDate(a?.date_first_reported || a?.DateFirstReported || a?.DateReported);
      if (!d) continue;
      const t = new Date(d).getTime();
      if (!latest || t > latest.time) latest = { time: t };
    }
    return latest?.time || 0;
  };
  const latestTime = pickLatestAddressDate(addresses);
  const combineStreet = (a) => {
    const parts = [a?.house_number, a?.pre_directional, a?.street_name, a?.suffix, a?.post_directional]
      .map((p) => normalizeStr(p, '').trim())
      .filter((p) => !!p);
    let street = parts.join(' ').replace(/\s+/g, ' ').trim();
    const unit = normalizeStr(a?.unit, '').trim();
    if (unit) street = `${street} ${unit}`;
    return street;
  };
  const addressesFormal = (Array.isArray(addresses) ? addresses : []).map((a) => {
    const reported = parseDate(a?.date_first_reported || a?.DateFirstReported || a?.DateReported);
    const reportedTime = reported ? new Date(reported).getTime() : 0;
    return {
      StreetAddress: combineStreet(a),
      City: normalizeStr(a?.city || a?.City, ''),
      State: normalizeStr(a?.state || a?.State, ''),
      Zip: normalizeStr(a?.zipcode || a?.Zip || a?.zip, ''),
      AddressType: reportedTime && reportedTime === latestTime ? 'Current' : 'Previous',
      DateReported: (reported || '')?.slice(0,10) || ''
    };
  });

  // Build converted report (UCS-style simplified)
  // ===== Add MyFreeScoreNow-format extras (CreditReport, Name, DOB, Score) =====

// Extract Score arrays
let scoreArray = [];
try {
  scoreArray =
    mergeAcrossBureaus(firstRaw, ["Score", "Scores", "VantageScore"]) ||
    findArrayByNames(reportData, ["Score", "Scores"]) ||
    [];
} catch (e) {}

if (!scoreArray || scoreArray.length === 0) {
  const rawScores = flattenRawData(firstRaw, 'score_details');
  scoreArray = rawScores.map((s, idx) => ({
    BureauId: s?.bureau_id ?? bureauToId(s?.bureau) ?? (idx + 1),
    Score: s?.score || '',
    ScoreType: s?.model || '',
    DateScore: s?.score_dt ? String(s.score_dt).split('T')[0] : null
  }));
}

// Extract Names
let nameArray = [];
try {
  nameArray =
    mergeAcrossBureaus(firstRaw, ["Name", "Names"]) ||
    findArrayByNames(reportData, ["Name", "Names"]) ||
    [];
} catch (e) {}

if (!nameArray || nameArray.length === 0) {
  const rawNames = flattenRawData(firstRaw, 'names');
  nameArray = rawNames.map((n, idx) => ({
    BureauId: n?.bureau_id ?? bureauToId(n?.bureau) ?? (idx + 1),
    FirstName: n?.first_name || '',
    Middle: n?.middle_name || '',
    LastName: n?.last_name || '',
    NameType: 'Primary'
  }));
}

// Extract DOBs
let dobArray = [];
try {
  dobArray =
    mergeAcrossBureaus(firstRaw, ["DOB", "DateOfBirth"]) ||
    findArrayByNames(reportData, ["DOB", "DateOfBirth"]) ||
    [];
} catch (e) {}

if (!dobArray || dobArray.length === 0) {
  const rawNamesForDob = flattenRawData(firstRaw, 'names');
  dobArray = rawNamesForDob.map((n, idx) => ({
    BureauId: n?.bureau_id ?? bureauToId(n?.bureau) ?? (idx + 1),
    DOB: n?.dob || n?.date_of_birth || ''
  }));
}

console.log(`MyScoreIQ -> extras extracted counts: name=${nameArray.length}, dob=${dobArray.length}, score=${scoreArray.length}`);

// Extract Credit Report Metadata (Date + Provider)
const creditReportArray = [
  {
    DateReport:
      reportData.reportDate ||
      reportData?.ReportDate ||
      new Date().toISOString().substring(0, 10),

    ReportProvider: "MyScoreIQ"
  }
];

// ===== Final converted report (UCS full schema) =====
  const converted = {
  clientInfo: {
    clientId: cid,
    username: credentials.username,
    timestamp: new Date().toISOString(),
    reportDate: reportData.reportDate || null
  },

  reportData: {
    CreditReport: creditReportArray,
    Name: nameArray,
    DOB: dobArray,
    Score: scoreArray,

    Accounts: accountsFormal,
    accounts: accountsAlias,
    Inquiries: inquiriesFormal,
    inquiries: inquiries,
    PublicRecords: publicRecords,
    publicRecords: publicRecords,
    Address: addressesFormal,
    addresses: addressesFormal,
    Employer: employersFormal
  }
  ,
  _diagnostics: {
    extractedFrom: candidates.map(c => (c && typeof c === 'object' ? Object.keys(c).slice(0,10) : String(c))).slice(0,5)
  }
  };


  // Write converted file
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const convertedPath = path.join(outDir, `client_${cid}_myscoreiq_converted_${ts}.json`);
    fs.writeFileSync(convertedPath, JSON.stringify(converted, null, 2), 'utf8');
    reportData.converted_report_path = convertedPath;
    reportData.filePath = convertedPath;
    try {
      reportData.reportData = converted.reportData;
      reportData.Score = converted.reportData?.Score;
      reportData.CreditReport = converted.reportData?.CreditReport;
      reportData.ReportDate = converted.reportData?.CreditReport?.[0]?.DateReport;
    } catch {}
    console.log('MyScoreIQ converted report saved to:', convertedPath);
  } catch (e) {
    console.error('Failed to save converted report:', e?.message || e);
  }
}
// --- End robust MyScoreIQ conversion block ---


    } catch (convErr) {
      console.warn('MyScoreIQ conversion warning:', convErr?.message || convErr);
    }

    try {
      if (platform && String(platform).toLowerCase() === String(PLATFORMS.IDENTITYIQ).toLowerCase()) {
        const outDir = scraperOptions.outputDir || './scraper-output';
        const cid = String(clientId || 'unknown');
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const raw = reportData?.rawCreditData || reportData;
        const bureauFromType = (t) => {
          const s = String(t || '').toLowerCase();
          if (s.includes('tuc')) return 1;
          if (s.includes('exp')) return 2;
          if (s.includes('eqf')) return 3;
          return null;
        };
        const bureauFromStr = (b) => {
          const s = String(b || '').toLowerCase();
          if (s.includes('trans')) return 1;
          if (s.includes('exper')) return 2;
          if (s.includes('equif')) return 3;
          return null;
        };
        const bureauFromCode = (c) => {
          const s = String(c || '').toLowerCase();
          if (s.includes('tuc')) return 1;
          if (s.includes('exp')) return 2;
          if (s.includes('eqf')) return 3;
          return null;
        };
        const normalizeStr = (v, def = '') => {
          if (v === null || v === undefined) return def;
          if (typeof v === 'string') return v;
          if (typeof v === 'number') return String(v);
          if (typeof v === 'object') {
            if (v && typeof v.name === 'string') return v.name;
            if (v && typeof v.$ === 'string') return v.$;
          }
          try { return JSON.stringify(v); } catch { return def; }
        };
        const parseDate = (v) => {
          const s = normalizeStr(v, '');
          if (!s) return null;
          const d = new Date(s);
          if (isNaN(d.getTime())) {
            const m = s.match(/\d{4}-\d{2}-\d{2}/) || s.match(/\d{2}\/\d{2}\/\d{4}/);
            return m ? m[0] : null;
          }
          return d.toISOString();
        };
        const toNumber = (v) => {
          const s = normalizeStr(v, '');
          const n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
          return isNaN(n) ? 0 : n;
        };
        const toTitle = (s) => {
          const str = normalizeStr(s, '');
          return str ? str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : str;
        };
        const accountsIQ = [];
        const inquiriesIQ = [];
        const employersIQ = [];
        const scoresIQ = [];
        const namesIQ = [];
        const birthsIQ = [];
        const q = [{ node: raw, bureau: null }];
        const seen = new Set();
        while (q.length) {
          const { node, bureau } = q.shift();
          if (!node || typeof node !== 'object') continue;
          if (seen.has(node)) continue;
          seen.add(node);
          const typeVal = normalizeStr(node?.Type?.$, null);
          const nextBureau = typeVal ? bureauFromType(typeVal) : bureau;
          for (const k of Object.keys(node)) {
            const v = node[k];
            if (!v) continue;
            if (k === 'Tradeline' && Array.isArray(v)) {
              for (const a of v) {
                const bi = a?.['@bureau'] ? bureauFromStr(a['@bureau']) : nextBureau;
                accountsIQ.push({ a, bi });
              }
            } else if (k === 'Inquiry' && Array.isArray(v)) {
              for (const inq of v) {
                const bi = nextBureau;
                inquiriesIQ.push({ inq, bi });
              }
            } else if (k === 'Inquiry' && typeof v === 'object' && !Array.isArray(v)) {
              const bi = nextBureau;
              inquiriesIQ.push({ inq: v, bi });
            } else if (k === 'BorrowerName' && Array.isArray(v)) {
              for (const n of v) {
                const bi = bureauFromStr(n?.Source?.Bureau?.['@abbreviation']) || bureauFromCode(n?.Source?.Bureau?.['@symbol']) || nextBureau;
                namesIQ.push({ n, bi });
              }
            } else if (k === 'Birth' && Array.isArray(v)) {
              for (const b of v) {
                const bi = bureauFromStr(b?.Source?.Bureau?.['@abbreviation']) || bureauFromCode(b?.Source?.Bureau?.['@symbol']) || nextBureau;
                birthsIQ.push({ b, bi });
              }
            } else if (k === 'Employer' && Array.isArray(v)) {
              for (const emp of v) {
                const bi = nextBureau;
                employersIQ.push({ emp, bi });
              }
            } else if (k === 'CreditScoreType' && typeof v === 'object') {
              const bi = nextBureau;
              scoresIQ.push({ s: v, bi });
            }
            if (typeof v === 'object') q.push({ node: v, bureau: nextBureau });
          }
        }
        const accountsFormal = accountsIQ.map(({ a, bi }, idx) => ({
          BureauId: bi ?? ((idx % 3) + 1),
          AccountTypeDescription: toTitle(a?.['@accountTypeDescription'] || a?.GrantedTrade?.AccountType?.['@description'] || a?.GrantedTrade?.AccountType?.description || ''),
          HighBalance: normalizeStr(a?.['@highBalance'] || a?.GrantedTrade?.highBalance || ''),
          DateReported: (parseDate(a?.['@dateReported']) || '')?.slice(0,10) || '',
          DateOpened: (parseDate(a?.['@dateOpened']) || '')?.slice(0,10) || '',
          AccountNumber: normalizeStr(a?.['@accountNumber'] || '').replace(/\*/g, ''),
          DateAccountStatus: (parseDate(a?.['@dateAccountStatus']) || '')?.slice(0,10) || '',
          CurrentBalance: String(toNumber(a?.['@currentBalance'])),
          CreditorName: normalizeStr(a?.['@creditorName'] || ''),
          AccountCondition: normalizeStr(a?.AccountCondition?.['@description'] || a?.AccountCondition?.description || ''),
          AccountDesignator: normalizeStr(a?.AccountDesignator?.['@description'] || a?.AccountDesignator?.description || ''),
          DisputeFlag: normalizeStr(a?.DisputeFlag?.['@description'] || a?.DisputeFlag?.description || ''),
          Industry: normalizeStr(a?.Industry?.['@description'] || ''),
          AccountStatus: normalizeStr(a?.AccountCondition?.['@description'] || ''),
          PaymentStatus: normalizeStr(a?.GrantedTrade?.PayStatus?.['@description'] || a?.GrantedTrade?.PayStatus?.description || ''),
          AmountPastDue: String(toNumber(a?.GrantedTrade?.amountPastDue || a?.GrantedTrade?.AmountPastDue)),
          AccountType: toTitle(a?.['@accountTypeDescription'] || a?.GrantedTrade?.CreditType?.['@description'] || a?.GrantedTrade?.CreditType?.description || ''),
          CreditType: toTitle(a?.GrantedTrade?.AccountType?.['@description'] || a?.GrantedTrade?.AccountType?.description || ''),
          PaymentFrequency: normalizeStr(a?.GrantedTrade?.PaymentFrequency?.['@description'] || a?.GrantedTrade?.PaymentFrequency?.description || ''),
          TermType: normalizeStr(a?.GrantedTrade?.TermType?.['@description'] || a?.GrantedTrade?.TermType?.description || ''),
          WorstPayStatus: normalizeStr(a?.GrantedTrade?.WorstPayStatus?.['@description'] || a?.GrantedTrade?.WorstPayStatus?.description || ''),
          PayStatusHistoryStartDate: (parseDate(a?.GrantedTrade?.PayStatusHistory?.['@startDate'] || a?.GrantedTrade?.PayStatusHistory?.startDate) || '')?.slice(0,10) || '',
          PayStatusHistory: normalizeStr(a?.GrantedTrade?.PayStatusHistory?.status || ''),
          Remark: null,
          CreditLimit: String(toNumber(a?.['@creditLimit'] || a?.GrantedTrade?.creditLimit))
        }));
        const inquiriesFormal = inquiriesIQ.map(({ inq, bi }, idx) => ({
          BureauId: bi ?? ((idx % 3) + 1),
          DateInquiry: (parseDate(inq?.['@inquiryDate']) || '')?.slice(0,10) || '',
          CreditorName: normalizeStr(inq?.['@subscriberName'] || ''),
          InquiryType: normalizeStr(
            inq?.InquiryType?.['@description'] || inq?.InquiryType?.['@abbreviation'] || inq?.['@inquiryType'] || ''
          ),
          Industry: normalizeStr(
            inq?.IndustryCode?.['@description'] || inq?.IndustryCode?.['@abbreviation'] || inq?.Industry?.['@description'] || inq?.Industry?.['@abbreviation'] || ''
          )
        }));
        const employersFormal = employersIQ.map(({ emp, bi }, idx) => ({
          EmployerName: normalizeStr(emp?.['@name'] || ''),
          BureauId: bi ?? ((idx % 3) + 1),
          DateReported: (parseDate(emp?.['@dateReported']) || '')?.slice(0,10) || '',
          DateUpdated: (parseDate(emp?.['@dateUpdated']) || '')?.slice(0,10) || '',
          Position: '',
          Income: 0
        }));
        const namesFormal = namesIQ.map(({ n, bi }, idx) => ({
          BureauId: bi ?? ((idx % 3) + 1),
          FirstName: normalizeStr(n?.Name?.['@first'] || ''),
          Middle: normalizeStr(n?.Name?.['@middle'] || ''),
          LastName: normalizeStr(n?.Name?.['@last'] || ''),
          NameType: normalizeStr(n?.NameType?.['@description'] || n?.NameType?.description || 'Primary')
        }));
        const dobsFormal = birthsIQ.map(({ b, bi }, idx) => {
          const y = normalizeStr(b?.BirthDate?.['@year'] || '');
          const m = normalizeStr(b?.BirthDate?.['@month'] || '');
          const d = normalizeStr(b?.BirthDate?.['@day'] || '');
          const dateRaw = normalizeStr(b?.['@date'] || '');
          const date = (parseDate(dateRaw || (y && m && d ? `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` : '')) || '')?.slice(0,10) || '';
          return {
            BureauId: bi ?? ((idx % 3) + 1),
            DOB: date
          };
        });
        const scoreArray = scoresIQ.map(({ s, bi }) => ({
          BureauId: bi ?? null,
          Score: normalizeStr(s?.['@riskScore'] || ''),
          ScoreType: normalizeStr(s?.['@scoreName'] || s?.['@model'] || ''),
          DateScore: (parseDate(reportData?.clientInfo?.timestamp) || '')?.slice(0,10) || null
        })).filter(x => x.Score);
        const creditReportDates = [1,2,3].map(id => ({ BureauId: id, DateReport: (parseDate(reportData?.clientInfo?.timestamp) || '')?.slice(0,10) || '' }));
        const converted = {
          reportData: {
            CreditReport: creditReportDates,
            Score: scoreArray,
            Name: namesFormal,
            DOB: dobsFormal,
            Accounts: accountsFormal,
            Inquiries: inquiriesFormal,
            PublicRecords: [],
            Address: [],
            Employer: employersFormal
          },
          platform,
          clientId,
          ts,
          rawKeys: Object.keys(reportData || {}),
          extractedCounts: {
            accounts: accountsFormal.length,
            inquiries: inquiriesFormal.length,
            employers: employersFormal.length,
            scores: scoreArray.length
          }
        };
        try {
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
          const convertedPath = path.join(outDir, `client_${cid}_identityiq_converted_${ts}.json`);
          fs.writeFileSync(convertedPath, JSON.stringify(converted, null, 2), 'utf8');
          reportData.converted_report_path = convertedPath;
          reportData.filePath = convertedPath;
          try {
            reportData.reportData = converted.reportData;
            reportData.Score = converted.reportData?.Score;
            reportData.CreditReport = converted.reportData?.CreditReport;
            reportData.ReportDate = converted.reportData?.CreditReport?.[0]?.DateReport;
          } catch {}
        } catch {}
      }
    } catch {}
    
    // Save to database
    try {
      // Use the pre-imported database utility
      const dbUtil = await import('../database/dbConnection.js');
      
      console.log('Saving report history to database');
      
      // Extract bureau scores from reportData
      let experianScore = null;
      let equifaxScore = null;
      let transunionScore = null;
      let creditScore = null;
      let reportDate = null;
      let notes = null;

      // Extract scores from reportData if available
      if (reportData && reportData.reportData && reportData.reportData.Score && Array.isArray(reportData.reportData.Score)) {
        const scores = reportData.reportData.Score;
        
        scores.forEach(score => {
          const scoreValue = parseInt(score.Score);
          if (!isNaN(scoreValue)) {
            if (score.BureauId === 1) transunionScore = scoreValue;
            if (score.BureauId === 2) experianScore = scoreValue;
            if (score.BureauId === 3) equifaxScore = scoreValue;
          }
        });

        // Calculate primary credit score as the maximum of the three
        const validScores = [experianScore, equifaxScore, transunionScore].filter(score => score !== null);
        if (validScores.length > 0) {
          creditScore = Math.max(...validScores);
        }
      } else if (reportData && reportData.Score && Array.isArray(reportData.Score)) {
        const scores = reportData.Score;
        scores.forEach(score => {
          const scoreValue = parseInt(score.Score);
          if (!isNaN(scoreValue)) {
            if (score.BureauId === 1) transunionScore = scoreValue;
            if (score.BureauId === 2) experianScore = scoreValue;
            if (score.BureauId === 3) equifaxScore = scoreValue;
          }
        });
        const validScores = [experianScore, equifaxScore, transunionScore].filter(score => score !== null);
        if (validScores.length > 0) {
          creditScore = Math.max(...validScores);
        }
      }

      // Extract report date if available
      if (reportData && reportData.reportData && reportData.reportData.ReportDate) {
        reportDate = reportData.reportData.ReportDate;
      } else if (reportData && reportData.CreditReport && Array.isArray(reportData.CreditReport) && reportData.CreditReport[0]?.DateReport) {
        reportDate = reportData.CreditReport[0].DateReport;
      }

      // Create notes with additional report information
      if (reportData && (reportData.reportData || reportData.Score)) {
        const noteData = {
          platform: platform,
          scraped_at: new Date().toISOString(),
          has_scores: !!(experianScore || equifaxScore || transunionScore),
          bureau_scores: {
            experian: experianScore,
            equifax: equifaxScore,
            transunion: transunionScore
          }
        };
        notes = JSON.stringify(noteData);
      }

      // Save report history to database
      const historyData = {
        client_id: clientId,
        platform: platform,
        report_path: reportData.converted_report_path || reportData.filePath || null,
        status: 'completed',
        credit_score: creditScore,
        experian_score: experianScore,
        equifax_score: equifaxScore,
        transunion_score: transunionScore,
        report_date: reportDate,
        notes: notes
      };
      
      // Log the data we're trying to save
      console.log('Saving history data:', JSON.stringify(historyData));
      
      // Save to database using our utility with timeout guard
      const timeoutMs = 10000;
      const savePromise = dbUtil.saveCreditReport(historyData);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB save timeout')), timeoutMs));
      const result = await Promise.race([savePromise, timeoutPromise]);
      console.log('Successfully saved report to database with ID:', result.insertId);
      console.log('Saved report history to database');
      
      // Store the report ID for potential client ID updates later
      const reportId = result.insertId;
      
      return res.status(200).json({
        success: true,
        message: 'Credit report scraped successfully',
        data: reportData,
        extractedPaths: reportData.extracted_paths || null,
        convertedReportPath: reportData.converted_report_path || null,
        reportId: reportId,
        clientId: clientId // Include client ID in response (will be "unknown" if not provided)
      });
    } catch (dbError) {
      console.error('Failed to save report to database:', dbError);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to save report to database',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (error) {
    console.error('Credit report scraper error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to scrape credit report',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route GET /api/credit-reports/platforms
 * @desc Get list of supported platforms
 * @access Private
 */
router.get('/platforms', authenticateToken, (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      platforms: Object.values(PLATFORMS)
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch supported platforms'
    });
  }
});

/**
 * @route GET /api/credit-reports/history
 * @desc Get credit report history for a client or all clients
 * @access Private
 */
router.get('/history', authenticateToken, async (req, res) => {
  let connection = null;
  
  try {
    const { clientId } = req.query;
    const userId = req.user.id;
    
    console.log('🔍 DEBUG: GET /api/credit-reports/history request received (JS file)');
    console.log('🔍 DEBUG: User ID:', userId);
    console.log('🔍 DEBUG: Client ID:', clientId || 'not specified');
    console.log('🔍 DEBUG: Is Super Admin:', req.user.role === 'super_admin' ? 'Yes' : 'No');
    console.log('🔍 DEBUG: User object:', JSON.stringify(req.user, null, 2));
    
    // Import database connection with timeout
    const dbUtil = await import('../database/dbConnection.js');
    
    // Set a timeout for the database connection
    const connectionPromise = dbUtil.getConnection();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 5000);
    });
    
    connection = await Promise.race([connectionPromise, timeoutPromise]);
    console.log('🔍 DEBUG: Database connection established');
    
    // Build query based on whether clientId is provided - using credit_report_history table
    let query = `
      SELECT 
        crh.id, 
        crh.client_id, 
        crh.platform,
        crh.report_path,
        crh.status,
        crh.created_at as report_date,
        crh.created_at,
        c.first_name, 
        c.last_name, 
        c.previous_credit_score,
        u.first_name as admin_first_name,
        u.last_name as admin_last_name,
        u.email as admin_email,
        crh.experian_score,
        crh.equifax_score,
        crh.transunion_score,
        crh.credit_score,
        0 as accounts_total, 
        0 as negative_accounts, 
        0 as inquiries_count, 
        0 as public_records
      FROM credit_report_history crh
      LEFT JOIN clients c ON crh.client_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
    `;
    
    const params = [];
    
    // Add user filter based on role
    if (req.user.role === 'super_admin') {
      // Super admin can see all reports - no filter needed
    } else if (req.user.role === 'client') {
      // Client can only see their own reports - filter by client_id
      query += ' WHERE crh.client_id = ?';
      params.push(userId); // For clients, userId is actually their client_id
    } else {
      // Regular users (admin, support, etc.) - filter by user_id
      query += ' WHERE c.user_id = ?';
      params.push(userId);
    }
    
    // Add client filter if clientId is provided (and not already filtered by client role)
    if (clientId && clientId !== 'all' && req.user.role !== 'client') {
      query += params.length > 0 ? ' AND crh.client_id = ?' : ' WHERE crh.client_id = ?';
      params.push(clientId);
    }
    
    query += ' ORDER BY crh.created_at DESC';
    
    console.log('🔍 DEBUG: SQL Query:', query);
    console.log('🔍 DEBUG: Query Parameters:', params);
    
    // Execute the query with timeout
    const queryPromise = connection.query(query, params);
    const queryTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query execution timeout')), 8000);
    });
    
    const [reports] = await Promise.race([queryPromise, queryTimeoutPromise]);
    
    console.log('🔍 DEBUG: Query returned rows:', reports ? reports.length : 0);
    
    if (reports && reports.length > 0) {
      console.log('🔍 DEBUG: First row sample:', JSON.stringify(reports[0], null, 2));
    } else {
      console.log('🔍 DEBUG: No rows returned from query');
    }
    
    return res.status(200).json({
      success: true,
      data: reports || []
    });
  } catch (error) {
    console.error('Error fetching credit report history:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch credit report history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Always release the connection
    if (connection) {
      try {
        connection.release();
        console.log('🔍 DEBUG: Database connection released');
      } catch (releaseError) {
        console.error('Error releasing database connection:', releaseError);
      }
    }
  }
});

// Get credit report for a specific client (for client dashboard)
router.get('/client/:clientId', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const user = req.user;

    console.log(`🔍 DEBUG: Fetching credit report for client ${clientId}, user ${user.id}`);

    // Authorization logic:
    // - Clients can only access their own reports
    // - Admins can access any client's reports
    // - Super admins can access any client's reports
    if (user.role === 'client' && user.id !== parseInt(clientId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Allow admin and super_admin roles to access any client's reports
    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(user.role) && user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    }

    // Use the database adapter instead of direct MySQL connection
    const db = getDatabaseAdapter();
    
    const rows = await db.executeQuery(
      `SELECT 
        crh.id,
        crh.client_id,
        crh.platform,
        crh.report_path,
        crh.status,
        crh.created_at,
        c.first_name,
        c.last_name,
        c.platform_email as email
      FROM credit_report_history crh
      JOIN clients c ON crh.client_id = c.id
      WHERE crh.client_id = ?
      ORDER BY crh.created_at DESC
      LIMIT 1`,
      [clientId]
    );
    
    console.log('🔍 DEBUG: Database adapter query returned', rows?.length || 0, 'rows');
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No credit report found for this client'
      });
    }

    const report = rows[0];
    console.log(`🔍 DEBUG: Found report with path: ${report.report_path}`);
    
    // Read the report file
    const fs = await import('fs');
    const path = await import('path');
    
    // Check if the path is absolute or relative
    let reportPath;
    if (path.isAbsolute(report.report_path)) {
      reportPath = report.report_path;
    } else {
      // For relative paths, check if it starts with scraper-output
      if (report.report_path.startsWith('scraper-output')) {
        reportPath = path.join(process.cwd(), report.report_path);
      } else {
        // Default to uploads/credit-reports for legacy paths
        reportPath = path.join(process.cwd(), 'uploads', 'credit-reports', report.report_path);
      }
    }
    
    console.log(`🔍 DEBUG: Looking for file at: ${reportPath}`);
    
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        success: false,
        message: 'Credit report file not found'
      });
    }

    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    console.log('🔍 DEBUG: Successfully loaded JSON file');
    console.log('🔍 DEBUG: reportData keys:', Object.keys(reportData));
    
    // Log activity: report viewed
    try {
      const { getDatabaseAdapter } = await import('../database/databaseAdapter.js');
      const db = getDatabaseAdapter();
      const desc = `Credit report viewed for client ${clientId} (platform: ${report.platform}) (IP: ${req.ip})`;
      try {
        await db.executeQuery(
          `INSERT INTO activities (user_id, client_id, type, description, metadata) VALUES (?, ?, ?, ?, ?)`,
          [
            user.id,
            Number(clientId),
            'note_added',
            desc,
            JSON.stringify({ event: 'report_viewed', platform: report.platform, ip_address: req.ip, user_agent: req.get('User-Agent') || null })
          ]
        );
      } catch (e) {
        console.warn('Activities log insert failed (non-blocking):', e?.message || e);
      }
      try {
        await db.executeQuery(
          `INSERT INTO user_activities (user_id, activity_type, resource_type, resource_id, description, ip_address, user_agent, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            'view',
            'credit_report',
            Number(clientId),
            desc,
            req.ip,
            req.get('User-Agent') || null,
            null
          ]
        );
      } catch (e2) {
        console.warn('User activities log insert failed (non-blocking):', e2?.message || e2);
      }
    } catch (logErr) {
      console.warn('Logging error (non-blocking):', logErr?.message || logErr);
    }

    res.json({
      success: true,
      data: {
        ...reportData,
        metadata: {
          id: report.id,
          client_id: report.client_id,
          platform: report.platform,
          status: report.status,
          created_at: report.created_at,
          client_name: `${report.first_name} ${report.last_name}`,
          email: report.email
        }
      }
    });

  } catch (error) {
    console.error('Error fetching client credit report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/credit-reports/funding-manager/:userId
 * @desc Get latest credit report for a client (funding manager access - only for clients with funding requests)
 * @access Private (Funding Manager only)
 */
router.get('/funding-manager/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const requestingUserId = req.user.id;
    
    console.log(`🔍 DEBUG: Funding manager ${requestingUserId} requesting credit report for user ${userId}`);
    
    // Only funding managers can access this endpoint
    if (req.user.role !== 'funding_manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Funding manager role required.'
      });
    }
    
    // Get database adapter
    const db = getDatabaseAdapter();
    
    // First, verify that the user has submitted at least one funding request
    const fundingRequestQuery = `
      SELECT COUNT(*) as request_count
      FROM funding_requests fr
      WHERE fr.user_id = ?
    `;
    
    const fundingRequestResult = await db.getQuery(fundingRequestQuery, [userId]);
    
    if (!fundingRequestResult || fundingRequestResult.request_count === 0) {
      return res.status(404).json({
        success: false,
        message: 'No funding requests found for this user. Credit report access denied.'
      });
    }
    
    console.log(`🔍 DEBUG: User ${userId} has ${fundingRequestResult.request_count} funding request(s)`);
    
    // Get the latest credit report for the user's clients
    const query = `
      SELECT 
        crh.id,
        crh.client_id,
        crh.platform,
        crh.report_path,
        crh.status,
        crh.created_at,
        crh.updated_at,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        c.email as client_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email
      FROM credit_report_history crh
      LEFT JOIN clients c ON crh.client_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ? 
        AND crh.status = 'completed'
      ORDER BY crh.created_at DESC
      LIMIT 1
    `;
    
    const rows = await db.allQuery(query, [userId]);
    
    console.log(`🔍 DEBUG: Query returned ${rows.length} rows`);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No credit report found for this user\'s clients'
      });
    }
    
    const report = rows[0];
    console.log(`🔍 DEBUG: Found report with path: ${report.report_path}`);
    
    // Parse the JSON report file
    let reportData = null;
    if (report.report_path) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        
        const fullPath = path.resolve(report.report_path);
        console.log(`🔍 DEBUG: Reading file from: ${fullPath}`);
        
        if (fs.existsSync(fullPath)) {
          const fileContent = fs.readFileSync(fullPath, 'utf8');
          reportData = JSON.parse(fileContent);
          console.log(`🔍 DEBUG: Successfully parsed JSON report`);
        } else {
          console.log(`🔍 DEBUG: File not found at path: ${fullPath}`);
        }
      } catch (parseError) {
        console.error('Error parsing JSON report:', parseError);
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        metadata: report,
        reportData: reportData,
        fundingRequestCount: fundingRequestResult.request_count
      }
    });
    
  } catch (error) {
    console.error('Error fetching credit report for funding manager:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch credit report',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route GET /api/credit-reports/json-file
 * @desc Get content of a JSON file
 * @access Private
 */
router.get('/json-file', authenticateToken, async (req, res) => {
  try {
    const { path } = req.query;
    
    if (!path || typeof path !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }
    
    // Import fs module
    const fs = await import('fs');
    
    // Check if file exists
    if (!fs.existsSync(path)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Read the JSON file
    const fileContent = fs.readFileSync(path, 'utf8');
    let jsonData;
    
    try {
      jsonData = JSON.parse(fileContent);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON file'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: jsonData
    });
  } catch (error) {
    console.error('Error reading JSON file:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to read JSON file',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route GET /api/credit-reports/fetch
 * @desc Fetch credit report from specified platform
 * @access Private
 */
router.get('/fetch', authenticateToken, async (req, res) => {
  try {
    // Get query parameters
    const { platform, username, password, clientId } = req.query;
    
    // Validate required parameters
    if (!platform || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: platform, username, and password are required'
      });
    }
    
    // Validate platform
    if (!Object.values(PLATFORMS).includes(platform.toString().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported platform: ${platform}. Supported platforms: ${Object.values(PLATFORMS).join(', ')}`
      });
    }
    
    // Set default scraper options
    const scraperOptions = {
      saveHtml: true,
      takeScreenshots: true,
      outputDir: './scraper-output'
    };
    
    console.log(`🔍 Fetching credit report from ${platform} for user ${username}`);
    
    // Call the scraper service
    const result = await fetchCreditReport(
      platform.toLowerCase(),
      { username, password },
      scraperOptions
    );
    
    if (result.success) {
      // If clientId is provided, save to database
      if (clientId) {
        try {
          const dbUtil = await import('../database/dbConnection.js');
          const db = await dbUtil.getConnection();
          
          await db.query(
            'INSERT INTO credit_report_history (client_id, platform, report_path, status, created_at) VALUES (?, ?, ?, ?, NOW())',
            [clientId, platform.toLowerCase(), result.reportPath || '', 'completed']
          );
          
          console.log(`✅ Credit report saved to database for client ${clientId}`);
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // Don't fail the request if database save fails
        }
      }

      // Log activity for report fetching
      try {
        const { getDatabaseAdapter } = await import('../database/databaseAdapter.js');
        const db = getDatabaseAdapter();
        const desc = `Credit report fetched for client ${clientId || 'unknown'} on ${String(platform).toLowerCase()} (IP: ${req.ip})`;
        // Activities (MySQL schema)
        try {
          await db.executeQuery(
            `INSERT INTO activities (user_id, client_id, type, description, metadata) VALUES (?, ?, ?, ?, ?)`,
            [
              req.user.id,
              clientId ? Number(clientId) : null,
              'note_added',
              desc,
              JSON.stringify({ event: 'report_fetched', platform: String(platform).toLowerCase(), ip_address: req.ip, user_agent: req.get('User-Agent') || null })
            ]
          );
        } catch (e) {
          console.warn('Activities log insert failed (non-blocking):', e?.message || e);
        }
        // User activities (cross-db, includes IP)
        try {
          await db.executeQuery(
            `INSERT INTO user_activities (user_id, activity_type, resource_type, resource_id, description, ip_address, user_agent, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.user.id,
              'import',
              'credit_report',
              clientId ? Number(clientId) : null,
              desc,
              req.ip,
              req.get('User-Agent') || null,
              null
            ]
          );
        } catch (e2) {
          console.warn('User activities log insert failed (non-blocking):', e2?.message || e2);
        }
      } catch (logErr) {
        console.warn('Logging error (non-blocking):', logErr?.message || logErr);
      }
      // Notify admins about report fetch
      try {
        const db = getDatabaseAdapter();
        const admins = await db.allQuery(
          `SELECT id, email FROM users WHERE role = 'admin' AND (is_active = 1 OR status = 'active')`
        );
        const title = 'Credit Report Fetched';
        const actorEmail = (req.user && req.user.email) ? req.user.email : 'unknown';
        const msg = `Credit report fetched for client ${clientId || 'unknown'} on ${String(platform).toLowerCase()} by ${actorEmail} (IP: ${req.ip})`;
        for (const admin of admins || []) {
          await db.executeQuery(
            `INSERT INTO admin_notifications (
               recipient_id, sender_id, title, message, type, priority,
               action_url, action_text, expires_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              admin.id,
              req.user ? req.user.id : null,
              title,
              msg,
              'info',
              'low',
              '/admin/reports',
              'View Reports',
              null
            ]
          );
        }
      } catch (notifyErr) {
        console.warn('Admin notification for report fetch failed (non-blocking):', notifyErr?.message || notifyErr);
      }
      
      res.json({
        success: true,
        message: 'Credit report fetched successfully',
        data: result.data,
        reportPath: result.reportPath,
        screenshots: result.screenshots
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to fetch credit report',
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error in fetch endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
