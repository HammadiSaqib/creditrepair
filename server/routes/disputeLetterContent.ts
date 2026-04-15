import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { executeQuery } from '../database/mysqlConfig.js';

const router = Router();
router.use(authenticateToken, requireRole('support', 'super_admin', 'admin'));

const BLOCK_ORDER = [
  'HEADER',
  'INTRO',
  ...Array.from({ length: 18 }, (_, i) => `BLOCK_${i + 1}`),
  'OUTRO',
];
const CONTENT_TYPES = ['STANDARD', 'ENHANCED'] as const;

const blockOrderSql = `FIELD(block, ${BLOCK_ORDER.map((b) => `'${b}'`).join(',')})`;
const contentTypeOrderSql = `FIELD(\`type\`, ${CONTENT_TYPES.map((value) => `'${value}'`).join(',')})`;
let ensureSchemaPromise: Promise<void> | null = null;

const normalizeBlockLabel = (value: unknown) => {
  const label = String(value ?? '').trim();
  return label || null;
};

const normalizeContentType = (value: unknown, fallback = 'STANDARD') => {
  const normalized = String(value ?? fallback).trim().toUpperCase();
  return CONTENT_TYPES.includes(normalized as (typeof CONTENT_TYPES)[number])
    ? normalized
    : null;
};

const ensureDisputeLetterContentSchema = async () => {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      try {
        const rows = await executeQuery<any[]>('SHOW COLUMNS FROM dispute_letter_content');
        const columns = new Map(
          rows.map((row: any) => [String(row.Field || '').toLowerCase(), String(row.Type || '').toLowerCase()]),
        );

        if (!columns.has('block_label')) {
          await executeQuery(
            'ALTER TABLE dispute_letter_content ADD COLUMN block_label VARCHAR(255) NULL AFTER block',
          );
        }

        if (!columns.has('type')) {
          await executeQuery(
            "ALTER TABLE dispute_letter_content ADD COLUMN `type` VARCHAR(32) NOT NULL DEFAULT 'STANDARD' AFTER category",
          );
        }

        await executeQuery(
          "UPDATE dispute_letter_content SET `type` = 'STANDARD' WHERE `type` IS NULL OR TRIM(`type`) = ''",
        );

        const clauseContentType = columns.get('clause_content') || '';
        if (clauseContentType && clauseContentType !== 'longtext') {
          await executeQuery(
            'ALTER TABLE dispute_letter_content MODIFY COLUMN clause_content LONGTEXT NOT NULL',
          );
        }
      } catch (error: any) {
        ensureSchemaPromise = null;
        throw error;
      }
    })();
  }

  await ensureSchemaPromise;
};

// GET /categories – list category names from support_letter_categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const rows = await executeQuery<any[]>(
      'SELECT DISTINCT name FROM support_letter_categories ORDER BY name ASC'
    );
    res.json({ success: true, data: rows.map((r: any) => r.name) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET / – list entries with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    await ensureDisputeLetterContentSchema();
    const { bureau, round, category, type, block } = req.query;
    let sql = 'SELECT * FROM dispute_letter_content WHERE 1=1';
    const params: any[] = [];

    if (bureau) {
      sql += ' AND bureau = ?';
      params.push(String(bureau));
    }
    if (round) {
      sql += ' AND round = ?';
      params.push(Number(round));
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(String(category));
    }
    if (type) {
      const normalizedType = normalizeContentType(type);
      if (!normalizedType) {
        return res.status(400).json({ success: false, error: `Invalid type: ${type}` });
      }
      sql += ' AND `type` = ?';
      params.push(normalizedType);
    }
    if (block) {
      sql += ' AND block = ?';
      params.push(String(block));
    }

    sql += ` ORDER BY bureau, round, category, ${contentTypeOrderSql}, ${blockOrderSql}, id`;
    const rows = await executeQuery<any[]>(sql, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /summary – compact list for tree navigator
router.get('/summary', async (req: Request, res: Response) => {
  try {
    await ensureDisputeLetterContentSchema();
    const { bureau, type } = req.query;
    let sql =
      `SELECT bureau, round, category, \`type\`, block, MAX(NULLIF(block_label, '')) as block_label, COUNT(*) as variant_count
       FROM dispute_letter_content`;
    const params: any[] = [];
    const where: string[] = [];

    if (bureau) {
      where.push('bureau = ?');
      params.push(String(bureau).toUpperCase());
    }
    if (type) {
      const normalizedType = normalizeContentType(type);
      if (!normalizedType) {
        return res.status(400).json({ success: false, error: `Invalid type: ${type}` });
      }
      where.push('`type` = ?');
      params.push(normalizedType);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }

    sql += `
       GROUP BY bureau, round, category, \`type\`, block
       ORDER BY bureau, round, category, ${contentTypeOrderSql}, ${blockOrderSql}`;

    const rows = await executeQuery<any[]>(sql, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /block-label – rename a block label
router.put('/block-label', async (req: Request, res: Response) => {
  try {
    await ensureDisputeLetterContentSchema();
    const { bureau, round, category, type, block, block_label } = req.body;
    if (!bureau || round == null || !category || !type || !block) {
      return res.status(400).json({
        success: false,
        error: 'bureau, round, category, type, and block are required',
      });
    }
    if (!BLOCK_ORDER.includes(String(block))) {
      return res.status(400).json({ success: false, error: `Invalid block: ${block}` });
    }
    const normalizedType = normalizeContentType(type);
    if (!normalizedType) {
      return res.status(400).json({ success: false, error: `Invalid type: ${type}` });
    }

    const normalizedLabel = normalizeBlockLabel(block_label);
    await executeQuery(
      `UPDATE dispute_letter_content
       SET block_label = ?
       WHERE bureau = ? AND round = ? AND category = ? AND \`type\` = ? AND block = ?`,
      [normalizedLabel, String(bureau).toUpperCase(), Number(round), String(category), normalizedType, String(block)],
    );

    res.json({ success: true, data: { block_label: normalizedLabel } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /block-scope – rename across all rounds
router.put('/block-scope', async (req: Request, res: Response) => {
  try {
    await ensureDisputeLetterContentSchema();
    const { bureau, category, type, block, block_label } = req.body;
    if (!bureau || !category || !type || !block) {
      return res.status(400).json({
        success: false,
        error: 'bureau, category, type, and block are required',
      });
    }
    if (!BLOCK_ORDER.includes(String(block))) {
      return res.status(400).json({ success: false, error: `Invalid block: ${block}` });
    }
    const normalizedType = normalizeContentType(type);
    if (!normalizedType) {
      return res.status(400).json({ success: false, error: `Invalid type: ${type}` });
    }

    const normalizedLabel = normalizeBlockLabel(block_label);
    await executeQuery(
      `UPDATE dispute_letter_content
       SET block_label = ?
       WHERE bureau = ? AND category = ? AND \`type\` = ? AND block = ?`,
      [normalizedLabel, String(bureau).toUpperCase(), String(category), normalizedType, String(block)],
    );

    res.json({ success: true, data: { block_label: normalizedLabel } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /block-scope – delete across rounds
router.delete('/block-scope', async (req: Request, res: Response) => {
  try {
    await ensureDisputeLetterContentSchema();
    const { bureau, category, type, block } = req.body || {};
    if (!bureau || !category || !type || !block) {
      return res.status(400).json({
        success: false,
        error: 'bureau, category, type, and block are required',
      });
    }
    if (!BLOCK_ORDER.includes(String(block))) {
      return res.status(400).json({ success: false, error: `Invalid block: ${block}` });
    }
    const normalizedType = normalizeContentType(type);
    if (!normalizedType) {
      return res.status(400).json({ success: false, error: `Invalid type: ${type}` });
    }

    const result: any = await executeQuery(
      `DELETE FROM dispute_letter_content
       WHERE bureau = ? AND category = ? AND \`type\` = ? AND block = ?`,
      [String(bureau).toUpperCase(), String(category), normalizedType, String(block)],
    );

    res.json({ success: true, data: { deleted: Number(result?.affectedRows || 0) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /:id – single entry
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ID' });
    }
    const rows = await executeQuery<any[]>(
      'SELECT * FROM dispute_letter_content WHERE id = ?',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / – create a new entry
router.post('/', async (req: Request, res: Response) => {
  try {
    await ensureDisputeLetterContentSchema();
    const { clause_content, bureau, round, category, type, block, block_label } = req.body;
    const normalizedBureau = String(bureau || 'ALL').toUpperCase();
    const normalizedType = normalizeContentType(type || 'STANDARD');
    if (!clause_content || round == null || !category || !block) {
      return res.status(400).json({
        success: false,
        error: 'clause_content, round, category, and block are required',
      });
    }
    if (!normalizedType) {
      return res.status(400).json({ success: false, error: `Invalid type: ${type}` });
    }
    if (!BLOCK_ORDER.includes(String(block))) {
      return res.status(400).json({ success: false, error: `Invalid block: ${block}` });
    }

    let normalizedLabel = normalizeBlockLabel(block_label);
    if (!normalizedLabel) {
      const existingRows = await executeQuery<any[]>(
        `SELECT MAX(NULLIF(block_label, '')) AS block_label
         FROM dispute_letter_content
         WHERE bureau = ? AND round = ? AND category = ? AND \`type\` = ? AND block = ?`,
        [normalizedBureau, Number(round), String(category), normalizedType, String(block)],
      );
      normalizedLabel = normalizeBlockLabel(existingRows[0]?.block_label);
    }

    const result = await executeQuery<any>(
      `INSERT INTO dispute_letter_content (clause_content, bureau, round, category, \`type\`, block, block_label)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clause_content, normalizedBureau, Number(round), String(category), normalizedType, String(block), normalizedLabel]
    );
    const insertId = result.insertId;
    res.json({ success: true, data: { id: insertId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /:id – update an entry
router.put('/:id', async (req: Request, res: Response) => {
  try {
    await ensureDisputeLetterContentSchema();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ID' });
    }
    const { clause_content, bureau, round, category, type, block, block_label } = req.body;
    const sets: string[] = [];
    const params: any[] = [];

    if (clause_content !== undefined) {
      sets.push('clause_content = ?');
      params.push(clause_content);
    }
    if (bureau !== undefined) {
      sets.push('bureau = ?');
      params.push(String(bureau).toUpperCase());
    }
    if (round !== undefined) {
      sets.push('round = ?');
      params.push(Number(round));
    }
    if (category !== undefined) {
      sets.push('category = ?');
      params.push(String(category));
    }
    if (type !== undefined) {
      const normalizedType = normalizeContentType(type);
      if (!normalizedType) {
        return res.status(400).json({ success: false, error: `Invalid type: ${type}` });
      }
      sets.push('`type` = ?');
      params.push(normalizedType);
    }
    if (block !== undefined) {
      if (!BLOCK_ORDER.includes(String(block))) {
        return res.status(400).json({ success: false, error: `Invalid block: ${block}` });
      }
      sets.push('block = ?');
      params.push(String(block));
    }
    if (block_label !== undefined) {
      sets.push('block_label = ?');
      params.push(normalizeBlockLabel(block_label));
    }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    params.push(id);
    await executeQuery(
      `UPDATE dispute_letter_content SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /:id – delete an entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ID' });
    }
    await executeQuery('DELETE FROM dispute_letter_content WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
