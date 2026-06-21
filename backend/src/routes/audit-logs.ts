import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/audit-logs - Fetch all activity audit logs
router.get('/', requireAuth, async (req, res) => {
  try {
    const logs = await db.getAuditLogs();
    const mappedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      userId: log.userId,
      userName: log.userName || 'Unknown',
      itemId: log.itemId,
      details: log.details,
      createdAt: log.createdAt.toISOString()
    }));

    return res.status(200).json(mappedLogs);
  } catch (error) {
    console.error('GET /api/audit-logs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve activity logs.' });
  }
});

export default router;
