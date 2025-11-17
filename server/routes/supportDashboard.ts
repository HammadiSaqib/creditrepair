import { Router } from 'express';
import { supportDashboardService } from '../services/supportDashboardService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

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

export default router;