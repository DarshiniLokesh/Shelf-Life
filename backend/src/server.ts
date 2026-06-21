import app, { ensureDbConnected } from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await ensureDbConnected();
    app.listen(PORT, () => {
      console.log(`[Server] ShelfLife backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Critical error starting database/server:', error);
    process.exit(1);
  }
}

startServer();
