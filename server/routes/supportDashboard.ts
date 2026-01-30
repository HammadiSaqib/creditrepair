import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { supportDashboardService } from '../services/supportDashboardService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getDatabaseAdapter } from '../database/databaseAdapter.js';

const router = Router();
const taskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.resolve(process.cwd(), 'uploads/tasks');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'task-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const taskUpload = multer({
  storage: taskStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
const taskStatusValues = new Set(['pending', 'in_progress', 'completed']);
const taskPriorityValues = new Set(['normal', 'medium', 'priority']);
const ensureSupportAccess = (req: any, res: any, next: any) => {
  const role = req.user?.role;
  if (!role) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (role !== 'support' && role !== 'super_admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  return next();
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await supportDashboardService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent tickets
router.get('/recent-tickets', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const tickets = await supportDashboardService.getRecentTickets(limit);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching recent tickets:', error);
    res.status(500).json({ error: 'Failed to fetch recent tickets' });
  }
});

// Get team performance metrics
router.get('/performance', async (req, res) => {
  try {
    const performance = await supportDashboardService.getTeamPerformance();
    res.json(performance);
  } catch (error) {
    console.error('Error fetching team performance:', error);
    res.status(500).json({ error: 'Failed to fetch team performance metrics' });
  }
});

router.get('/tasks', ensureSupportAccess, async (req, res) => {
  try {
    const db = getDatabaseAdapter();
    const tasks = await db.allQuery(
      `SELECT t.*,
              creator.first_name as created_by_first_name,
              creator.last_name as created_by_last_name,
              creator.email as created_by_email,
              updater.first_name as updated_by_first_name,
              updater.last_name as updated_by_last_name,
              updater.email as updated_by_email
       FROM project_tasks t
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users updater ON t.updated_by = updater.id
       ORDER BY t.created_at DESC`
    );
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project tasks' });
  }
});

router.post('/tasks', ensureSupportAccess, taskUpload.single('screenshot'), async (req, res) => {
  try {
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const status = String(req.body?.status || '').trim();
    const priority = String(req.body?.priority || '').trim();
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }
    if (status && !taskStatusValues.has(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }
    if (priority && !taskPriorityValues.has(priority)) {
      return res.status(400).json({ success: false, error: 'Invalid priority value' });
    }
    const db = getDatabaseAdapter();
    const normalizedStatus = status || 'pending';
    const normalizedPriority = priority || 'normal';
    const screenshotUrl = req.file ? `/uploads/tasks/${req.file.filename}` : null;
    const result = await db.executeQuery(
      `INSERT INTO project_tasks (title, description, screenshot_url, status, priority, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, screenshotUrl, normalizedStatus, normalizedPriority, userId, userId]
    );
    const dbType = db.getType();
    const taskId = dbType === 'mysql' ? (result as any)?.insertId : (result as any)?.lastID;
    const task = await db.getQuery(
      `SELECT t.*,
              creator.first_name as created_by_first_name,
              creator.last_name as created_by_last_name,
              creator.email as created_by_email,
              updater.first_name as updated_by_first_name,
              updater.last_name as updated_by_last_name,
              updater.email as updated_by_email
       FROM project_tasks t
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users updater ON t.updated_by = updater.id
       WHERE t.id = ?`,
      [taskId]
    );
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error creating project task:', error);
    res.status(500).json({ success: false, error: 'Failed to create project task' });
  }
});

router.put('/tasks/:id', ensureSupportAccess, async (req, res) => {
  try {
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const taskId = Number(req.params.id);
    if (!Number.isFinite(taskId)) {
      return res.status(400).json({ success: false, error: 'Invalid task id' });
    }
    const title = req.body?.title;
    const description = req.body?.description;
    const status = req.body?.status;
    const updates: string[] = [];
    const params: any[] = [];
    if (typeof title !== 'undefined') {
      const safeTitle = String(title).trim();
      if (!safeTitle) {
        return res.status(400).json({ success: false, error: 'Title cannot be empty' });
      }
      updates.push('title = ?');
      params.push(safeTitle);
    }
    if (typeof description !== 'undefined') {
      const safeDescription = String(description).trim();
      if (!safeDescription) {
        return res.status(400).json({ success: false, error: 'Description cannot be empty' });
      }
      updates.push('description = ?');
      params.push(safeDescription);
    }
    if (typeof status !== 'undefined') {
      const safeStatus = String(status).trim();
      if (!taskStatusValues.has(safeStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid status value' });
      }
      updates.push('status = ?');
      params.push(safeStatus);
    }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No updates provided' });
    }
    const db = getDatabaseAdapter();
    const dbType = db.getType();
    updates.push('updated_by = ?');
    params.push(userId);
    updates.push(dbType === 'mysql' ? 'updated_at = NOW()' : 'updated_at = CURRENT_TIMESTAMP');
    params.push(taskId);
    await db.executeQuery(
      `UPDATE project_tasks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    const task = await db.getQuery(
      `SELECT t.*,
              creator.first_name as created_by_first_name,
              creator.last_name as created_by_last_name,
              creator.email as created_by_email,
              updater.first_name as updated_by_first_name,
              updater.last_name as updated_by_last_name,
              updater.email as updated_by_email
       FROM project_tasks t
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users updater ON t.updated_by = updater.id
       WHERE t.id = ?`,
      [taskId]
    );
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error updating project task:', error);
    res.status(500).json({ success: false, error: 'Failed to update project task' });
  }
});

router.delete('/tasks/:id', ensureSupportAccess, async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (!Number.isFinite(taskId)) {
      return res.status(400).json({ success: false, error: 'Invalid task id' });
    }
    const db = getDatabaseAdapter();
    await db.executeQuery('DELETE FROM project_tasks WHERE id = ?', [taskId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project task:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project task' });
  }
});

export default router;
