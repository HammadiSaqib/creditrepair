import express from 'express';
import { Request, Response } from 'express';
import { runQuery, getQuery, allQuery } from '../database/databaseAdapter.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

function getServerBaseUrl(req: Request): string {
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3001';
  return `${proto}://${host}`;
}

// Configure multer for client document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(process.cwd(), 'uploads/client-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, and PDF files are allowed.'));
    }
  }
});

type StoredOtherDocument = {
  id: number;
  document_type: 'other';
  file_url: string;
  original_name: string | null;
  created_at: string;
};

function isMissingTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ER_NO_SUCH_TABLE|doesn't exist|does not exist/i.test(message);
}

function normalizeStoredDate(value: unknown): string {
  const parsed = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function normalizeStoredOtherDocument(value: unknown): StoredOtherDocument | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const id = Number(candidate.id);
  const fileUrl = typeof candidate.file_url === 'string' ? candidate.file_url : '';
  if (!Number.isFinite(id) || !fileUrl) return null;

  return {
    id,
    document_type: 'other',
    file_url: fileUrl,
    original_name: typeof candidate.original_name === 'string' ? candidate.original_name : null,
    created_at: normalizeStoredDate(candidate.created_at),
  };
}

function parseStoredOtherDocuments(value: unknown): StoredOtherDocument[] {
  if (!value) return [];
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { return []; }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((entry) => normalizeStoredOtherDocument(entry))
    .filter((entry): entry is StoredOtherDocument => Boolean(entry));
}

function sortStoredOtherDocuments(documents: StoredOtherDocument[]): StoredOtherDocument[] {
  return [...documents].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

function mergeStoredOtherDocuments(
  currentDocuments: StoredOtherDocument[],
  incomingDocuments: StoredOtherDocument[]
): StoredOtherDocument[] {
  const merged = new Map<string, StoredOtherDocument>();
  for (const doc of [...currentDocuments, ...incomingDocuments]) {
    const key = `${doc.file_url}::${doc.original_name || ''}::${doc.created_at}`;
    if (!merged.has(key)) merged.set(key, doc);
  }
  return sortStoredOtherDocuments([...merged.values()]);
}

function createStoredOtherDocument(fileUrl: string, originalName: string): StoredOtherDocument {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000000),
    document_type: 'other',
    file_url: fileUrl,
    original_name: originalName || null,
    created_at: new Date().toISOString(),
  };
}

async function saveClientOtherDocuments(clientId: string, documents: StoredOtherDocument[]) {
  const normalizedDocuments = sortStoredOtherDocuments(documents);
  await runQuery(
    'UPDATE clients SET other_documents = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify(normalizedDocuments), clientId]
  );
}

async function ensureAdditionalDocsTable() {
  try {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS client_additional_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        original_name VARCHAR(255),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_client_doc (client_id, document_type),
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (e) {
    // Table likely already exists
  }
}
ensureAdditionalDocsTable();

async function getLegacyOtherDocuments(clientId: string): Promise<StoredOtherDocument[]> {
  try {
    await ensureAdditionalDocsTable();
    const legacyDocuments = await allQuery(
      `SELECT id, file_url, original_name, created_at
         FROM client_additional_documents
        WHERE client_id = ? AND document_type = 'other'
        ORDER BY created_at DESC`,
      [clientId]
    );
    return legacyDocuments
      .map((doc: any) => normalizeStoredOtherDocument({
        id: doc.id, file_url: doc.file_url,
        original_name: doc.original_name, created_at: doc.created_at,
      }))
      .filter((doc: any): doc is StoredOtherDocument => Boolean(doc));
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

async function loadClientOtherDocuments(clientId: string): Promise<StoredOtherDocument[]> {
  const client = await getQuery(
    'SELECT id, other_documents FROM clients WHERE id = ?',
    [clientId]
  );
  if (!client) return [];

  const currentDocuments = parseStoredOtherDocuments(client.other_documents);
  const legacyDocuments = await getLegacyOtherDocuments(clientId);
  if (!legacyDocuments.length) return sortStoredOtherDocuments(currentDocuments);

  const mergedDocuments = mergeStoredOtherDocuments(currentDocuments, legacyDocuments);
  await saveClientOtherDocuments(clientId, mergedDocuments);
  await runQuery(
    `DELETE FROM client_additional_documents WHERE client_id = ? AND document_type = 'other'`,
    [clientId]
  );
  return mergedDocuments;
}

// Upload document (clients table columns: dl_or_id_card, poa, ssc)
router.post('/:clientId/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const { type } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!['dl_or_id_card', 'poa', 'ssc'].includes(type)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const client = await getQuery('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (!client) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Client not found' });
    }

    const baseUrl = getServerBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/client-documents/${req.file.filename}`;

    await runQuery(`UPDATE clients SET ${type} = ? WHERE id = ?`, [fileUrl, clientId]);
    res.json({ message: 'Document uploaded successfully', fileUrl, type });
  } catch (error) {
    console.error('Error uploading document:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    }
    res.status(500).json({ message: 'Error uploading document' });
  }
});

// Delete document
router.delete('/:clientId/document/:type', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, type } = req.params;
    if (!['dl_or_id_card', 'poa', 'ssc'].includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    await runQuery(`UPDATE clients SET ${type} = NULL WHERE id = ?`, [clientId]);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Error deleting document' });
  }
});

// Upload additional document
router.post('/:clientId/additional/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const { type } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!['dl_or_id_card', 'poa', 'ssc', 'other'].includes(type)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const client = await getQuery('SELECT id FROM clients WHERE id = ?', [clientId]);
    if (!client) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Client not found' });
    }

    const baseUrl = getServerBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/client-documents/${req.file.filename}`;

    if (type === 'other') {
      const existing = await loadClientOtherDocuments(clientId);
      const uploaded = createStoredOtherDocument(fileUrl, req.file.originalname);
      await saveClientOtherDocuments(clientId, [...existing, uploaded]);
      return res.json({ message: 'Additional document uploaded successfully', fileUrl, type, data: uploaded });
    }

    await runQuery(
      'INSERT INTO client_additional_documents (client_id, document_type, file_url, original_name) VALUES (?, ?, ?, ?)',
      [clientId, type, fileUrl, req.file.originalname]
    );
    res.json({ message: 'Additional document uploaded successfully', fileUrl, type });
  } catch (error) {
    console.error('Error uploading additional document:', error);
    if ((req as any).file?.path && fs.existsSync((req as any).file.path)) {
      try { fs.unlinkSync((req as any).file.path); } catch (e) { /* ignore */ }
    }
    res.status(500).json({ message: 'Error uploading additional document' });
  }
});

// Get all documents for client
router.get('/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const client = await getQuery(
      'SELECT id, dl_or_id_card, poa, ssc, other_documents FROM clients WHERE id = ?',
      [clientId]
    );
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const otherDocs = await loadClientOtherDocuments(clientId);

    let additionalDocs: any[] = [];
    try {
      additionalDocs = await allQuery(
        'SELECT * FROM client_additional_documents WHERE client_id = ? ORDER BY created_at DESC',
        [clientId]
      );
    } catch (e) {
      if (!isMissingTableError(e)) throw e;
    }

    res.json({
      success: true,
      data: {
        dl_or_id_card: client.dl_or_id_card || null,
        poa: client.poa || null,
        ssc: client.ssc || null,
        other_documents: otherDocs,
        additional_documents: additionalDocs,
      }
    });
  } catch (error) {
    console.error('Error fetching client documents:', error);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

// Upload multiple additional documents at once
router.post('/:clientId/additional/upload-multiple', authenticateToken, upload.array('files', 20), async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const { type } = req.body;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
    if (!['dl_or_id_card', 'poa', 'ssc', 'other'].includes(type)) {
      files.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const client = await getQuery('SELECT id FROM clients WHERE id = ?', [clientId]);
    if (!client) {
      files.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
      return res.status(404).json({ message: 'Client not found' });
    }

    const baseUrl = getServerBaseUrl(req);

    if (type === 'other') {
      const existingOtherDocuments = await loadClientOtherDocuments(clientId);
      const uploadedDocuments = files.map((file) =>
        createStoredOtherDocument(
          `${baseUrl}/uploads/client-documents/${file.filename}`,
          file.originalname
        )
      );

      await saveClientOtherDocuments(clientId, [
        ...existingOtherDocuments,
        ...uploadedDocuments,
      ]);

      return res.json({
        success: true,
        message: `${uploadedDocuments.length} document(s) uploaded successfully`,
        data: uploadedDocuments,
      });
    }

    const uploaded: any[] = [];
    for (const file of files) {
      const fileUrl = `${baseUrl}/uploads/client-documents/${file.filename}`;
      await runQuery(
        'INSERT INTO client_additional_documents (client_id, document_type, file_url, original_name) VALUES (?, ?, ?, ?)',
        [clientId, type, fileUrl, file.originalname]
      );
      uploaded.push({ fileUrl, originalName: file.originalname });
    }

    res.json({ success: true, message: `${uploaded.length} document(s) uploaded successfully`, data: uploaded });
  } catch (error) {
    console.error('Error uploading multiple documents:', error);
    const files = req.files as Express.Multer.File[] | undefined;
    if (files) {
      files.forEach(f => { try { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch (e) {} });
    }
    res.status(500).json({ message: 'Error uploading documents' });
  }
});

// Delete additional document
router.delete('/:clientId/additional/:docId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, docId } = req.params;

    // Check if it's an "other" document stored in clients.other_documents JSON
    const existing = await loadClientOtherDocuments(clientId);
    const otherDocIndex = existing.findIndex(d => String(d.id) === String(docId));
    if (otherDocIndex !== -1) {
      existing.splice(otherDocIndex, 1);
      await saveClientOtherDocuments(clientId, existing);
      return res.json({ success: true, message: 'Document deleted successfully' });
    }

    // Otherwise try the additional documents table
    await runQuery(
      'DELETE FROM client_additional_documents WHERE id = ? AND client_id = ?',
      [docId, clientId]
    );
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting additional document:', error);
    res.status(500).json({ message: 'Error deleting document' });
  }
});

export default router;
