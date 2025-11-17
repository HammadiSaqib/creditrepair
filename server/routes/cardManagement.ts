import express, { Request, Response } from 'express';
import multer from 'multer';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { executeQuery } from '../database/mysqlConfig.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Valid US state codes (2-letter)
const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

// Also allow 'USA' to represent nationwide coverage
const STATE_OR_COUNTRY_CODES = [...US_STATE_CODES, 'USA'];

// Validation schemas
const createCardValidation = [
  body('card_image')
    .optional({ checkFalsy: true, nullable: true })
    .isURL()
    .withMessage('Card image must be a valid URL'),
  body('bank_id').isInt({ min: 1 }).withMessage('Bank ID is required and must be a positive integer'),
  body('card_name').trim().isLength({ min: 1, max: 255 }).withMessage('Card name is required and must be between 1-255 characters'),
  body('card_link').isURL().withMessage('Card link must be a valid URL'),
  body('card_type').isIn(['business', 'personal']).withMessage('Card type must be either business or personal'),
  body('funding_type').trim().isLength({ min: 1, max: 100 }).withMessage('Funding type is required'),
  body('credit_bureaus').isArray({ min: 1 }).withMessage('At least one credit bureau must be selected'),
  body('credit_bureaus.*').isIn(['Experian', 'Equifax', 'TransUnion']).withMessage('Invalid credit bureau'),
  body('states').optional().isArray({ min: 1 }).withMessage('States must be an array'),
  body('states.*').optional().isIn(STATE_OR_COUNTRY_CODES).withMessage('Invalid state code'),
  body('state').optional().isIn(STATE_OR_COUNTRY_CODES).withMessage('State must be a valid US state code or USA'),
];

const updateCardValidation = [
  body('card_image')
    .optional({ checkFalsy: true, nullable: true })
    .isURL()
    .withMessage('Card image must be a valid URL'),
  body('bank_id').optional().isInt({ min: 1 }).withMessage('Bank ID must be a positive integer'),
  body('card_name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Card name must be between 1-255 characters'),
  body('card_link').optional().isURL().withMessage('Card link must be a valid URL'),
  body('card_type').optional().isIn(['business', 'personal']).withMessage('Card type must be either business or personal'),
  body('funding_type').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Funding type is required'),
  body('credit_bureaus').optional().isArray({ min: 1 }).withMessage('At least one credit bureau must be selected'),
  body('credit_bureaus.*').optional().isIn(['Experian', 'Equifax', 'TransUnion']).withMessage('Invalid credit bureau'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  body('states').optional().isArray({ min: 1 }).withMessage('States must be an array'),
  body('states.*').optional().isIn(STATE_OR_COUNTRY_CODES).withMessage('Invalid state code'),
  body('state').optional().isIn(STATE_OR_COUNTRY_CODES).withMessage('State must be a valid US state code or USA'),
];

// Get all cards with filtering and pagination
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('search').optional().trim().isLength({ max: 255 }).withMessage('Search term too long'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  query('type').optional().isIn(['business', 'personal']).withMessage('Type must be business or personal'),
  query('bank_id').optional().isInt({ min: 1 }).withMessage('Bank ID must be a positive integer'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const rawPage = parseInt(req.query.page as string);
    const rawLimit = parseInt(req.query.limit as string);
    // Sanitize and cap pagination values, then inline into SQL to avoid ER_WRONG_ARGUMENTS
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const bankId = req.query.bank_id as string;

    let whereConditions = [];
    let queryParams: any[] = [];

    if (search) {
      whereConditions.push('(c.card_name LIKE ? OR b.name LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push('c.is_active = ?');
      queryParams.push(status === 'active');
    }

    if (type) {
      whereConditions.push('c.card_type = ?');
      queryParams.push(type);
    }

    if (bankId) {
      whereConditions.push('c.bank_id = ?');
      queryParams.push(parseInt(bankId));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM cards c 
      LEFT JOIN banks b ON c.bank_id = b.id 
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams) as RowDataPacket[];
    const total = countResult[0].total;

    // Get cards with bank information
    const cardsQuery = `
      SELECT 
        c.id,
        c.card_image,
        c.bank_id,
        b.name as bank_name,
        b.logo as bank_logo,
        c.card_name,
        c.card_link,
        c.card_type,
        c.funding_type,
        c.credit_bureaus,
        c.state,
        c.states,
        c.is_active,
        c.created_at,
        c.updated_at
      FROM cards c
      LEFT JOIN banks b ON c.bank_id = b.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const cards = await executeQuery(cardsQuery, queryParams) as RowDataPacket[];

    const parsedCards = cards.map(card => ({
      ...card,
      credit_bureaus: Array.isArray(card.credit_bureaus)
        ? card.credit_bureaus
        : (() => { try { return JSON.parse(card.credit_bureaus || '[]'); } catch { return []; } })(),
      states: Array.isArray(card.states)
        ? card.states
        : (() => { try { return JSON.parse(card.states || '[]'); } catch { return []; } })()
    }));

    res.json({
      cards: parsedCards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get card statistics (must be before /:id route)
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN card_type = 'business' THEN 1 ELSE 0 END) as business,
        SUM(CASE WHEN card_type = 'personal' THEN 1 ELSE 0 END) as personal
      FROM cards
    `;

    const result = await executeQuery(query) as RowDataPacket[];
    const stats = result[0];

    res.json({
      total: parseInt(stats.total) || 0,
      active: parseInt(stats.active) || 0,
      inactive: parseInt(stats.inactive) || 0,
      business: parseInt(stats.business) || 0,
      personal: parseInt(stats.personal) || 0
    });
  } catch (error) {
    console.error('Error fetching card stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/export', authenticateToken, async (req: Request, res: Response) => {
  try {
    const rawSearch = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const bankId = req.query.bank_id as string;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    if (rawSearch) {
      whereConditions.push('(c.card_name LIKE ? OR b.name LIKE ?)');
      queryParams.push(`%${rawSearch}%`, `%${rawSearch}%`);
    }
    if (status) {
      whereConditions.push('c.is_active = ?');
      queryParams.push(status === 'active');
    }
    if (type) {
      whereConditions.push('c.card_type = ?');
      queryParams.push(type);
    }
    if (bankId) {
      whereConditions.push('c.bank_id = ?');
      queryParams.push(parseInt(bankId));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        c.id,
        c.card_image,
        c.bank_id,
        b.name as bank_name,
        c.card_name,
        c.card_link,
        c.card_type,
        c.funding_type,
        c.credit_bureaus,
        c.state,
        c.states,
        c.is_active,
        c.created_at,
        c.updated_at
      FROM cards c
      LEFT JOIN banks b ON c.bank_id = b.id
      ${whereClause}
      ORDER BY c.created_at DESC
    `;

    const rows = await executeQuery(query, queryParams) as RowDataPacket[];

    const header = [
      'id','bank_id','bank_name','card_name','card_image','card_link','card_type','funding_type','credit_bureaus','states','state','is_active','created_at','updated_at'
    ];
    const csvRows = [header.join(',')];
    rows.forEach((r) => {
      const bureaus = Array.isArray(r.credit_bureaus)
        ? r.credit_bureaus
        : (() => { try { return JSON.parse(r.credit_bureaus || '[]'); } catch { return []; } })();
      const states = Array.isArray(r.states)
        ? r.states
        : (() => { try { return JSON.parse(r.states || '[]'); } catch { return []; } })();
      const values = [
        r.id,
        r.bank_id,
        r.bank_name || '',
        r.card_name || '',
        r.card_image || '',
        r.card_link || '',
        r.card_type || '',
        r.funding_type || '',
        JSON.stringify(bureaus),
        JSON.stringify(states),
        r.state || '',
        r.is_active ? 'true' : 'false',
        r.created_at,
        r.updated_at
      ];
      const line = values.map((v) => {
        const s = String(v ?? '');
        const needsQuote = /[",\n]/.test(s);
        const escaped = s.replace(/"/g, '""');
        return needsQuote ? `"${escaped}"` : escaped;
      }).join(',');
      csvRows.push(line);
    });

    const csv = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="cards_export.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/import', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const content = req.file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV has no data' });
    }
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name);

    let inserted = 0;
    let updated = 0;

    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i];
      const cols = [] as string[];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < raw.length; c++) {
        const ch = raw[c];
        if (ch === '"') {
          if (inQuotes && raw[c + 1] === '"') { current += '"'; c++; } else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          cols.push(current); current = '';
        } else { current += ch; }
      }
      cols.push(current);

      const get = (name: string) => {
        const j = idx(name);
        return j >= 0 ? cols[j] : '';
      };

      const idVal = parseInt(get('id'));
      const bankIdVal = parseInt(get('bank_id'));
      const cardNameVal = get('card_name');
      const cardLinkVal = get('card_link');
      const cardTypeVal = get('card_type');
      const fundingTypeVal = get('funding_type');
      const bureausStr = get('credit_bureaus');
      const statesStr = get('states');
      const stateStr = get('state');
      const activeStr = get('is_active');

      if (!bankIdVal || !cardNameVal || !cardLinkVal || !cardTypeVal || !fundingTypeVal) {
        continue;
      }

      const bankCheck = await executeQuery('SELECT id FROM banks WHERE id = ? AND is_active = true', [bankIdVal]) as RowDataPacket[];
      if (bankCheck.length === 0) {
        continue;
      }

      let bureaus: string[] = [];
      try { const parsed = JSON.parse(bureausStr); if (Array.isArray(parsed)) bureaus = parsed; } catch {}
      if (bureaus.length === 0 && bureausStr) {
        bureaus = bureausStr.split(';').map(s => s.trim()).filter(Boolean);
      }

      let statesArr: string[] = [];
      try { const parsedS = JSON.parse(statesStr); if (Array.isArray(parsedS)) statesArr = parsedS; } catch {}
      if (statesArr.length === 0 && statesStr) {
        statesArr = statesStr.split(';').map(s => s.trim().toUpperCase()).filter(Boolean);
      }
      const normalizedStates = statesArr.length > 0 ? statesArr.map(s => s.toUpperCase()) : (stateStr ? [stateStr.toUpperCase()] : []);
      const stateVal = normalizedStates.length > 0 ? normalizedStates[0] : null;
      const isActiveVal = String(activeStr).toLowerCase() === 'true';

      if (Number.isFinite(idVal)) {
        const existing = await executeQuery('SELECT id FROM cards WHERE id = ?', [idVal]) as RowDataPacket[];
        if (existing.length > 0) {
          await executeQuery(
            'UPDATE cards SET card_image = ?, bank_id = ?, card_name = ?, card_link = ?, card_type = ?, funding_type = ?, credit_bureaus = ?, state = ?, states = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
            [null, bankIdVal, cardNameVal, cardLinkVal, cardTypeVal, fundingTypeVal, JSON.stringify(bureaus), stateVal, normalizedStates.length > 0 ? JSON.stringify(normalizedStates) : null, isActiveVal, idVal]
          );
          updated += 1;
          continue;
        }
      }

      const result = await executeQuery(
        'INSERT INTO cards (card_image, bank_id, card_name, card_link, card_type, funding_type, credit_bureaus, state, states, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [null, bankIdVal, cardNameVal, cardLinkVal, cardTypeVal, fundingTypeVal, JSON.stringify(bureaus), stateVal, normalizedStates.length > 0 ? JSON.stringify(normalizedStates) : null, isActiveVal]
      ) as ResultSetHeader;
      if (result.insertId) inserted += 1;
    }

    res.json({ message: 'Import completed', inserted, updated });
  } catch (error) {
    console.error('Error importing cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single card by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const cardId = parseInt(req.params.id);
    if (isNaN(cardId)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }

    const query = `
      SELECT 
        c.id,
        c.card_image,
        c.bank_id,
        b.name as bank_name,
        c.card_name,
        c.card_link,
        c.card_type,
        c.funding_type,
        c.credit_bureaus,
        c.state,
        c.states,
        c.is_active,
        c.created_at,
        c.updated_at
      FROM cards c
      LEFT JOIN banks b ON c.bank_id = b.id
      WHERE c.id = ?
    `;

    const result = await executeQuery(query, [cardId]) as RowDataPacket[];

    if (result.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const raw = result[0] as any;
    const card = {
      ...raw,
      credit_bureaus: Array.isArray(raw.credit_bureaus)
        ? raw.credit_bureaus
        : (() => { try { return JSON.parse(raw.credit_bureaus || '[]'); } catch { return []; } })(),
      states: Array.isArray(raw.states)
        ? raw.states
        : (() => { try { return JSON.parse(raw.states || '[]'); } catch { return []; } })()
    };

    res.json({ card });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new card
router.post('/', authenticateToken, createCardValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      card_image,
      bank_id,
      card_name,
      card_link,
      card_type,
      funding_type,
      credit_bureaus,
      state,
      states
    } = req.body;

    // Verify bank exists
    const bankCheck = await executeQuery(
      'SELECT id FROM banks WHERE id = ? AND is_active = true',
      [bank_id]
    ) as RowDataPacket[];

    if (bankCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid or inactive bank selected' });
    }

    // Check for duplicate card name within the same bank
    const duplicateCheck = await executeQuery(
      'SELECT id FROM cards WHERE bank_id = ? AND card_name = ?',
      [bank_id, card_name]
    ) as RowDataPacket[];

    if (duplicateCheck.length > 0) {
      return res.status(400).json({ error: 'A card with this name already exists for the selected bank' });
    }

    const query = `
      INSERT INTO cards (
        card_image, bank_id, card_name, card_link, card_type, 
        funding_type, credit_bureaus, state, states, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
    `;

    const normalizedStates = Array.isArray(states)
      ? states.map((s: string) => s.trim().toUpperCase())
      : (state ? [String(state).trim().toUpperCase()] : []);

    const stateValue = normalizedStates.length > 0 ? normalizedStates[0] : (state || null);

    const result = await executeQuery(query, [
      (card_image && card_image.length > 0) ? card_image : null,
      bank_id,
      card_name,
      card_link,
      card_type,
      funding_type,
      JSON.stringify(credit_bureaus),
      stateValue || null,
      normalizedStates.length > 0 ? JSON.stringify(normalizedStates) : null
    ]) as ResultSetHeader;

    res.status(201).json({
      message: 'Card created successfully',
      card: {
        id: result.insertId,
        card_image,
        bank_id,
        card_name,
        card_link,
      card_type,
      funding_type,
      credit_bureaus,
      states: normalizedStates,
      state: stateValue || null,
      is_active: true
    }
    });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update card
router.put('/:id', authenticateToken, updateCardValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const cardId = parseInt(req.params.id);
    if (isNaN(cardId)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }

    // Check if card exists
    const existingCard = await executeQuery(
      'SELECT * FROM cards WHERE id = ?',
      [cardId]
    ) as RowDataPacket[];

    if (existingCard.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const updateFields = [];
    const updateValues = [];

    // Build dynamic update query
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'credit_bureaus') {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(req.body[key]));
        } else if (key === 'states') {
          const normalized = Array.isArray(req.body[key])
            ? req.body[key].map((s: string) => String(s).trim().toUpperCase())
            : [];
          updateFields.push(`states = ?`);
          updateValues.push(normalized.length > 0 ? JSON.stringify(normalized) : null);
          if (req.body.state === undefined) {
            updateFields.push(`state = ?`);
            updateValues.push(normalized.length > 0 ? normalized[0] : null);
          }
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(req.body[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // If updating bank_id or card_name, check for duplicates
    if (req.body.bank_id || req.body.card_name) {
      const checkBankId = req.body.bank_id || existingCard[0].bank_id;
      const checkCardName = req.body.card_name || existingCard[0].card_name;

      const duplicateCheck = await executeQuery(
        'SELECT id FROM cards WHERE bank_id = ? AND card_name = ? AND id != ?',
        [checkBankId, checkCardName, cardId]
      ) as RowDataPacket[];

      if (duplicateCheck.length > 0) {
        return res.status(400).json({ error: 'A card with this name already exists for the selected bank' });
      }
    }

    // If updating bank_id, verify bank exists and is active
    if (req.body.bank_id) {
      const bankCheck = await executeQuery(
        'SELECT id FROM banks WHERE id = ? AND is_active = true',
        [req.body.bank_id]
      ) as RowDataPacket[];

      if (bankCheck.length === 0) {
        return res.status(400).json({ error: 'Invalid or inactive bank selected' });
      }
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(cardId);

    const query = `UPDATE cards SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(query, updateValues);

    res.json({ message: 'Card updated successfully' });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete card
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const cardId = parseInt(req.params.id);
    if (isNaN(cardId)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }

    const result = await executeQuery(
      'DELETE FROM cards WHERE id = ?',
      [cardId]
    ) as ResultSetHeader;

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;