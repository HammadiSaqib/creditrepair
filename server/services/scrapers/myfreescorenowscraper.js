/**
 * MyFreeScoreNow Scraper
 * 
 * This module provides functionality to scrape credit reports from MyFreeScoreNow.com
 */

import fs from 'fs';
import path from 'path';
import { Scraper } from '../../../scraper/scrapper.js';
import { convertNewToLegacy } from './converter.js';

const LEGACY_REPORT_KEYS = [
  'CreditReport',
  'Name',
  'Address',
  'DOB',
  'Score',
  'Employer',
  'Inquiries',
  'PublicRecords',
  'Accounts',
];

function hasWrapperKeys(reportData) {
  if (!reportData || typeof reportData !== 'object') return false;
  return (
    Object.prototype.hasOwnProperty.call(reportData, 'success') ||
    Object.prototype.hasOwnProperty.call(reportData, 'message') ||
    Object.prototype.hasOwnProperty.call(reportData, 'data')
  );
}

function isStrictLegacyReportData(reportData) {
  if (!reportData || typeof reportData !== 'object') return false;
  if (hasWrapperKeys(reportData)) return false;
  return LEGACY_REPORT_KEYS.every((key) => Array.isArray(reportData[key]));
}

// Helper function to safely stringify objects with circular references and non-serializable values
const safeStringify = (obj) => {
  try {
    // Handle circular references
    const seen = new Set();
    return JSON.stringify(obj, (key, value) => {
      // Handle non-serializable values
      if (typeof value === 'function') return '[Function]';
      if (value instanceof RegExp) return value.toString();
      if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
      if (value === undefined) return null;
      
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    }, 2);
  } catch (err) {
    console.error('Error in safeStringify:', err);
    // Fallback to a basic representation
    return JSON.stringify({
      error: 'Could not stringify object',
      reason: err.message,
      partialData: Object.keys(obj)
    });
  }
};

/**
 * Fetch credit report from MyFreeScoreNow
 * @param {string} username - MyFreeScoreNow account username
 * @param {string} password - MyFreeScoreNow account password
 * @param {Object} options - Additional options for the scraper
 * @returns {Promise<Object>} - The scraped credit report data and file path
 */
async function fetchMyFreeScoreNowReport(username, password, options = {}) {
  const { outputDir = './scraper-output', clientId } = options;
  const configPath = path.resolve(process.cwd(), 'configs/pupeeter_saad.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Initialize the scraper with the configuration
    const scraper = new Scraper(config);
    
    // Perform the scraping
    const scrapedData = await scraper.Scrap(false, username, password);
    let convertedPayload = null;
    if (isStrictLegacyReportData(scrapedData)) {
      convertedPayload = {
        clientInfo: {
          clientId: clientId || 'unknown',
          username,
          timestamp: new Date().toISOString(),
        },
        reportData: scrapedData,
      };
    } else {
      convertedPayload = convertNewToLegacy(
        {
          clientInfo: {
            clientId: clientId || 'unknown',
            username,
            timestamp: new Date().toISOString(),
          },
          reportData: scrapedData,
        },
        clientId || 'unknown',
        username
      );
      console.log('Converted MyFreeScoreNow payload to strict legacy report format');
    }

    const reportData = convertedPayload.reportData;
    if (!isStrictLegacyReportData(reportData)) {
      throw new Error('Invalid converted reportData: strict legacy keys missing');
    }
    if (hasWrapperKeys(reportData)) {
      throw new Error('Invalid converted reportData: success/message/data wrapper keys are not allowed');
    }
    
    // Save the report data to a file
    let filePath = null;
    if (reportData) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `client_${clientId || 'unknown'}_report_${timestamp}.json`;
      filePath = path.join(outputDir, filename);
      
      // Add client information to the report data
      const reportWithClientInfo = {
        clientInfo: {
          clientId: clientId || 'unknown',
          username,
          timestamp: new Date().toISOString(),
          reportDate: new Date().toLocaleDateString()
        },
        reportData
      };

      reportWithClientInfo.clientInfo = {
        ...reportWithClientInfo.clientInfo,
        ...convertedPayload.clientInfo,
      };
      
      // Write the JSON file using safeStringify
      fs.writeFileSync(filePath, safeStringify(reportWithClientInfo));
      console.log(`📁 Report saved to ${filePath}`);
      
      // Add the file path to the report data so it can be saved in the database
      reportData.filePath = filePath;
      
      // Log the file path to verify it's being set correctly
      console.log(`Setting reportData.filePath to: ${filePath}`);
    }
    
    return { reportData, filePath };
  } catch (error) {
    console.error('MyFreeScoreNow scraper error:', error);
    throw error;
  }
}

export default fetchMyFreeScoreNowReport;