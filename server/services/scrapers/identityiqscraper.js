/**
 * IdentityIQ Scraper
 *
 * Scrapes credit report data from IdentityIQ, handling SSN last 4 when required.
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { Scraper } from '../../../scraper/scrapper.js';

const configPath = path.resolve(process.cwd(), 'configs/identityiq_config.json');
function loadConfig() {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[IdentityIQ] Failed to load config from', configPath, err);
    return {};
  }
}
let config = loadConfig();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Safe stringify helper mirroring myfreescorenowscraper.js
const safeStringify = (obj) => {
  try {
    const seen = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'function') return '[Function]';
      if (value instanceof RegExp) return value.toString();
      if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
      if (value === undefined) return null;
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    }, 2);
  } catch (err) {
    console.error('Error in safeStringify:', err);
    return JSON.stringify({ error: 'Could not stringify object', reason: err.message, partialData: Object.keys(obj) });
  }
};

async function fetchIdentityIQReport(username, password, options = {}) {
  const { outputDir = './scraper-output', clientId, ssnLast4 } = options;
  // Reload config on each invocation to pick up recent changes
  config = loadConfig();
  console.log('[IdentityIQ] Config reloaded. loginUrl=', config.loginUrl, 'base url=', config.url);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let browser = null;
  let page = null;
  try {
    console.log(`[IdentityIQ] Starting scraper for clientId=${clientId || 'unknown'} username=${String(username).slice(0,3)}***`);
    browser = await puppeteer.launch({
      headless: config.puppeteerConfig?.headless,
      args: config.puppeteerConfig?.args || [],
    });
    page = await browser.newPage();
    if (config.puppeteerResolution) await page.setViewport(config.puppeteerResolution);
    if (config.puppeteerHttpHeaders) await page.setExtraHTTPHeaders(config.puppeteerHttpHeaders);
    // Ensure we don't hang on long-lived network activity
    try {
      if (page.setDefaultNavigationTimeout) {
        page.setDefaultNavigationTimeout(config.waitTimeouts?.navigation || 30000);
      }
      if (page.setDefaultTimeout) {
        page.setDefaultTimeout(config.waitTimeouts?.element || 10000);
      }
    } catch {}
    console.log('[IdentityIQ] Browser launched, page initialized');

    // Capture TrueLink JSONP if present
    let rawCreditData = null;
    let htmlReportPath = null;
    page.on('response', async (response) => {
      try {
        const url = response.url();
        if (url.includes('/dsply.aspx')) {
          const text = await response.text();
          const jsonString = text.replace(/^jsonp_callback\(/, '').replace(/\);$/, '');
          rawCreditData = JSON.parse(jsonString);
          console.log(`[IdentityIQ] Captured JSONP credit data from ${url}, keys=${Object.keys(rawCreditData || {}).length}`);
        } else if (url.includes('csid.co')) {
          // CSID cloud source hosts JSON with the personal credit report in a single line
          try {
            const text = await response.text();
            const maybeJson = text.trim();
            // Avoid parsing HTML by a quick guard
            if (maybeJson.startsWith('{') || maybeJson.startsWith('[')) {
              const parsed = JSON.parse(maybeJson);
              rawCreditData = parsed;
              console.log(`[IdentityIQ] Captured CSID JSON from ${url}, keys=${Object.keys(rawCreditData || {}).length}`);
            }
          } catch (err) {
            console.log('[IdentityIQ] Failed to parse CSID JSON:', err?.message || err);
          }
        }
      } catch (e) {
        // ignore
      }
    });

    // Navigate to login
    const targetLoginUrl = config.loginUrl || config.url;
    console.log(`[IdentityIQ] Navigating to login URL: ${targetLoginUrl}`);
    await page.goto(targetLoginUrl, { waitUntil: 'domcontentloaded', timeout: config.waitTimeouts?.navigation || 30000 });

    const typeIntoFirstMatch = async (selectors, value, label = 'field') => {
      const list = Array.isArray(selectors) ? selectors : [selectors];
      const frames = page.frames();
      const timeout = config.waitTimeouts?.element || 10000;
      for (const sel of list) {
        // Search in main page and all frames
        for (const ctx of [page, ...frames]) {
          try {
            await ctx.waitForSelector(sel, { timeout });
            await ctx.focus(sel);
            await ctx.type(sel, value, { delay: 50 });
            console.log(`[IdentityIQ] Typed into ${label}: ${sel}`);
            return true;
          } catch {}
        }
      }
      console.log(`[IdentityIQ] Failed to type into any selector for ${label} (tried ${list.length} selectors)`);
      return false;
    };

    const clickFirstMatch = async (selectors, label = 'button') => {
      const list = Array.isArray(selectors) ? selectors : [selectors];
      const frames = page.frames();
      const timeout = config.waitTimeouts?.element || 10000;
      for (const sel of list) {
        // Native selector attempt across all frames
        for (const ctx of [page, ...frames]) {
          try {
            await ctx.waitForSelector(sel, { timeout });
            await ctx.click(sel);
            console.log(`[IdentityIQ] Clicked ${label}: ${sel}`);
            return true;
          } catch {}
        }
        // Text-based contains handling: e.g., 'button:contains("Login")'
        const containsMatch = sel.match(/^([a-zA-Z0-9\.#\-]+):contains\((.+)\)$/);
        if (containsMatch) {
          const tag = containsMatch[1];
          const text = containsMatch[2].replace(/^['"]|['"]$/g, '').trim();
          try {
            const clicked = await page.evaluate(({ tag, text }) => {
              const els = Array.from(document.querySelectorAll(tag));
              const t = text.toLowerCase();
              const el = els.find(e => (e.innerText || e.textContent || '').toLowerCase().includes(t));
              if (el) { el.click(); return true; }
              return false;
            }, { tag, text });
            if (clicked) {
              console.log(`[IdentityIQ] Clicked ${label} via text match: ${tag} contains "${text}"`);
              return true;
            }
          } catch {}
        }
      }
      console.log(`[IdentityIQ] Failed to click any selector for ${label} (tried ${list.length} selectors)`);
      return false;
    };

    const emailOk = await typeIntoFirstMatch(config.selectors?.email_field, username, 'email');
    const passOk = await typeIntoFirstMatch(config.selectors?.password_field, password, 'password');
    if (!emailOk || !passOk) {
      console.log('[IdentityIQ] Login fields not found via selectors; page URL:', page.url());
      // Fallback: retry on homepage to locate fields or login link
      try {
        console.log('[IdentityIQ] Retrying on homepage to locate login fields');
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: config.waitTimeouts?.navigation || 30000 });
        const emailOk2 = await typeIntoFirstMatch(config.selectors?.email_field, username, 'email');
        const passOk2 = await typeIntoFirstMatch(config.selectors?.password_field, password, 'password');
        if (!emailOk2 || !passOk2) {
          console.log('[IdentityIQ] Login fields still not found on homepage; will attempt text-based login button click if present');
        }
      } catch (e) {
        console.log('[IdentityIQ] Fallback navigation to homepage failed:', e?.message || e);
      }
    }
    await clickFirstMatch(config.selectors?.login_button, 'login_button');
    console.log('[IdentityIQ] Submitted login form, waiting for navigation or dashboard indicator...');
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: config.waitTimeouts?.navigation || 30000 }),
        (async () => {
          const indicators = Array.isArray(config.selectors?.dashboard_indicators) ? config.selectors.dashboard_indicators : [];
          for (const sel of indicators) {
            try { await page.waitForSelector(sel, { timeout: config.waitTimeouts?.element || 10000 }); return true; } catch {}
          }
          return false;
        })()
      ]);
    } catch {}

    // Security question page for SSN last 4
    let onSecurityPage = false;
    try {
      for (const sel of (config.selectors?.security_question_page || [])) {
        try {
          await page.waitForSelector(sel, { timeout: config.waitTimeouts?.security_question || 15000 });
          onSecurityPage = true;
          console.log(`[IdentityIQ] Security page detected via selector: ${sel}`);
          break;
        } catch {}
      }
      if (!onSecurityPage) {
        for (const sel of (config.selectors?.ssn_field || [])) {
          try {
            await page.waitForSelector(sel, { timeout: 3000 });
            onSecurityPage = true;
            console.log(`[IdentityIQ] Security SSN field detected via selector: ${sel}`);
            break;
          } catch {}
        }
      }
    } catch {}

    if (onSecurityPage) {
      if (!ssnLast4) {
        console.error('[IdentityIQ] Missing ssnLast4 for security question');
        throw new Error('SSN last 4 is required for IdentityIQ authentication.');
      }
      console.log('[IdentityIQ] Entering SSN last 4 and submitting security form');
      const ssnOk = await typeIntoFirstMatch(config.selectors?.ssn_field, String(ssnLast4), 'ssn_last4');
      if (!ssnOk) {
        console.log('[IdentityIQ] SSN field not found via selectors; attempting text-based Continue/Submit');
      }
      await clickFirstMatch(config.selectors?.security_submit_button, 'security_submit_button');
      await sleep(1500);
    }

    // If dashboard indicators exist, try clicking Credit Report link first; otherwise navigate directly
    let navigatedViaLink = false;
    try {
      const indicators = Array.isArray(config.selectors?.dashboard_indicators) ? config.selectors.dashboard_indicators : [];
      for (const sel of indicators) {
        try { await page.waitForSelector(sel, { timeout: 3000 }); navigatedViaLink = true; break; } catch {}
      }
      if (navigatedViaLink) {
        const clicked = await clickFirstMatch(config.selectors?.credit_report_link, 'credit_report_link');
        if (clicked) {
          try { await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: config.waitTimeouts?.navigation || 30000 }); } catch {}
        } else {
          navigatedViaLink = false;
        }
      }
    } catch {}

    const targetReportUrl = config.creditReportUrl || config.dashboardUrl;
    if (!navigatedViaLink) {
      console.log(`[IdentityIQ] Navigating to report page: ${targetReportUrl}`);
      await page.goto(targetReportUrl, { waitUntil: 'domcontentloaded', timeout: config.waitTimeouts?.navigation || 30000 });
    }

    // Try to capture TrueLink JSONP response directly to speed up extraction
    try {
      const resp = await page.waitForResponse((r) => {
        const u = r.url();
        return u.includes('/dsply.aspx') && r.status() === 200;
      }, { timeout: Math.max(8000, (config.waitTimeouts?.report_load || 20000) / 2) });
      if (resp) {
        const text = await resp.text();
        const jsonString = text.replace(/^jsonp_callback\(/, '').replace(/\);$/, '');
        try {
          rawCreditData = JSON.parse(jsonString);
          console.log('[IdentityIQ] Captured credit data via direct response to dsply.aspx');
        } catch {}
      }
    } catch {}

    // Also wait for CSID cloud JSON if present
    try {
      const csidResp = await page.waitForResponse((r) => {
        const u = r.url();
        return u.includes('csid.co') && r.status() === 200;
      }, { timeout: Math.max(10000, (config.waitTimeouts?.report_load || 20000)) });
      if (csidResp) {
        try {
          const text = await csidResp.text();
          const maybeJson = text.trim();
          if (maybeJson.startsWith('{') || maybeJson.startsWith('[')) {
            rawCreditData = JSON.parse(maybeJson);
            console.log('[IdentityIQ] Captured credit data via CSID cloud JSON');
          }
        } catch (e) {
          console.log('[IdentityIQ] Failed to parse CSID waitForResponse JSON:', e?.message || e);
        }
      }
    } catch {}

    // Attempt to click "Download this report" and capture the HTML page
    try {
      // Prepare popup listener before attempting click
      let popupPage = null;
      page.once('popup', (p) => { popupPage = p; });

      const downloadCandidates = [
        'a.imgDownloadAction',
        'a.re-btn-link.imgDownloadAction',
        'a[onclick*="downloadCreditReport"]',
        "a:contains(\"Download this report\")",
        "button:contains(\"Download this report\")",
        "a:contains(\"Download Report\")",
        "button:contains(\"Download Report\")",
        "a:contains(\"Download\")",
        "button:contains(\"Download\")",
        "a[href*='CRDownload']",
        "a[href*='ReportDownload']",
        "a[href*='CreditReportContent']",
      ];

      let clickedDownload = await clickFirstMatch(downloadCandidates, 'download_report');

      if (!clickedDownload) {
        // Try direct function invocation as a fallback
        clickedDownload = await page.evaluate(() => {
          try {
            if (typeof window.downloadCreditReport === 'function') {
              window.downloadCreditReport();
              return true;
            }
            const btn = document.querySelector('a.imgDownloadAction') || document.querySelector('a[onclick*="downloadCreditReport"]');
            if (btn) { btn.click(); return true; }
            const els = Array.from(document.querySelectorAll('a, button'));
            const match = els.find(e => /download this report|^\s*download\b/i.test((e.innerText || e.textContent || '')));
            if (match) { match.click(); return true; }
          } catch {}
          return false;
        });
        console.log(clickedDownload ? '[IdentityIQ] Invoked downloadCreditReport() via evaluate' : '[IdentityIQ] Download button not found via known selectors');
      }

      if (clickedDownload) {
        // Handle potential popup or same-tab navigation
        try {
          await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: config.waitTimeouts?.navigation || 30000 });
        } catch {}
        const dlPage = popupPage || page;
        try {
          await dlPage.waitForFunction(() => {
            const titleOk = document.title.toLowerCase().includes('credit report - identityiq');
            const hasCss = !!document.querySelector("link[href*='CRDownload.css']");
            return titleOk || hasCss;
          }, { timeout: config.waitTimeouts?.report_load || 20000 });
        } catch {}
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `client_${clientId || 'unknown'}_identityiq_download_${timestamp}.html`;
          const fullPath = path.join(outputDir, filename);
          const htmlContent = await dlPage.content();
          fs.writeFileSync(fullPath, htmlContent);
          htmlReportPath = fullPath;
          console.log(`[IdentityIQ] HTML report saved to ${fullPath}`);
        } catch (e) {
          console.log('[IdentityIQ] Failed to save HTML report:', e?.message || e);
        }
      }
    } catch (e) {
      console.log('[IdentityIQ] Error during download button click:', e?.message || e);
    }

    // If redirected back to login, attempt one retry then proceed
    try {
      if (config.selectors?.login_page) {
        const onLogin = await page.$(config.selectors.login_page);
        if (onLogin) {
          console.log('[IdentityIQ] Detected login page after navigation; attempting a single re-login');
          const emailRetry = await typeIntoFirstMatch(config.selectors?.email_field, username, 'email');
          const passRetry = await typeIntoFirstMatch(config.selectors?.password_field, password, 'password');
          if (emailRetry && passRetry) {
            await clickFirstMatch(config.selectors?.login_button, 'login_button');
            try { await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: config.waitTimeouts?.navigation || 30000 }); } catch {}
          }
        }
      }
    } catch {}

    // Wait for report container (fast path if JSONP was not captured)
    let reportContainerFound = false;
    for (const sel of (config.selectors?.credit_report_container || [])) {
      try {
        await page.waitForSelector(sel, { timeout: Math.min(12000, config.waitTimeouts?.report_load || 20000) });
        reportContainerFound = true;
        console.log(`[IdentityIQ] Report container found: ${sel}`);
        break;
      } catch {}
    }
    if (!reportContainerFound) console.log('[IdentityIQ] Report container not found; using fallback extraction');
    await sleep(2000);

    // Fallback extraction
    if (!rawCreditData || Object.keys(rawCreditData).length === 0) {
      try {
        const candidate = await page.evaluate((evalString) => {
          try { return Function('return ' + evalString)(); } catch { return null; }
        }, config.evaluations?.get_credit_data);
        if (candidate) {
          rawCreditData = candidate;
          console.log('[IdentityIQ] Extracted credit data via evaluation');
        }
      } catch {}

      if (!rawCreditData) {
        try {
          rawCreditData = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            for (const script of scripts) {
              const content = script.textContent || '';
              if (content.includes('BundleComponents') || content.includes('TrueLinkCreditReportType')) {
                const match = content.match(/\{[\s\S]*\}/);
                if (match) {
                  try { return JSON.parse(match[0]); } catch {}
                }
              }
            }
            return null;
          });
          if (rawCreditData) console.log('[IdentityIQ] Extracted credit data from script tag JSON');
        } catch {}
      }
    }

    // Parse into unified structure via Scraper.Parse
    let reportStructured = {};
    if (rawCreditData) {
      console.log('[IdentityIQ] Parsing raw credit data into unified structure');
      const scraper = new Scraper(config);
      reportStructured = await scraper.Parse(rawCreditData);
      console.log(`[IdentityIQ] Parse complete, sections=${Object.keys(reportStructured || {}).length}`);
    }

    // Save JSON
    let filePath = null;
    if (reportStructured && Object.keys(reportStructured).length) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `client_${clientId || 'unknown'}_identityiq_${timestamp}.json`;
      filePath = path.join(outputDir, filename);
      const reportWithClientInfo = {
        clientInfo: {
          clientId: clientId || 'unknown',
          username,
          timestamp: new Date().toISOString(),
          reportDate: new Date().toLocaleDateString(),
        },
        reportData: reportStructured,
      };
      fs.writeFileSync(filePath, safeStringify(reportWithClientInfo));
      reportStructured.filePath = filePath;
      console.log(`[IdentityIQ] Report saved to ${filePath}`);
    }

    // If JSON wasn’t parsed, return the HTML download file path instead
    if (!filePath && htmlReportPath) {
      filePath = htmlReportPath;
      console.log(`[IdentityIQ] Returning HTML file path as report_path: ${filePath}`);
    }

    return { reportData: reportStructured, filePath };
  } catch (error) {
    console.error('[IdentityIQ] Scraper error:', error);
    throw error;
  } finally {
    try {
      if (page) await page.close();
      if (browser) await browser.close();
      console.log('[IdentityIQ] Browser closed');
    } catch {}
  }
}

export default fetchIdentityIQReport;