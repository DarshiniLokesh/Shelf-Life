import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import itemsRouter from './routes/items';
import eventsRouter from './routes/events';
import auditLogsRouter from './routes/audit-logs';
import { db } from './db';

const app = express();

app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/audit-logs', auditLogsRouter);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[App Error]', err);
  res.status(500).json({ error: 'An unexpected internal error occurred.' });
});

// Initialize database wrapper helper
let dbInitialized = false;
export async function ensureDbConnected() {
  if (!dbInitialized) {
    await db.initialize();
    dbInitialized = true;
  }
}

export default app;
