/**
 * Credit Report Scraper Routes
 * 
 * API endpoints for scraping credit reports from various platforms
 */

import express from 'express';
import { z } from 'zod';
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
    const durationMs = Date.now() - startTime;
    console.log(`Scrape finished for ${platform} in ${durationMs}ms`);
    
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
      }

      // Extract report date if available
      if (reportData && reportData.reportData && reportData.reportData.ReportDate) {
        reportDate = reportData.reportData.ReportDate;
      }

      // Create notes with additional report information
      if (reportData && reportData.reportData) {
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
        report_path: reportData.filePath || null,
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