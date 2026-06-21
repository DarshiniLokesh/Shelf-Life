import { Router } from 'express';
import { registerClient, unregisterClient } from '../lib/events';

const router = Router();

// GET /api/events - Stream Sent Events
router.get('/', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  const clientId = Math.random().toString(36).substring(2, 15);
  registerClient(clientId, res);

  // Send an initial keepalive comment
  res.write(': keepalive\n\n');

  req.on('close', () => {
    unregisterClient(clientId);
  });
});

export default router;
