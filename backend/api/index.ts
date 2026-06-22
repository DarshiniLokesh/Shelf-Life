import app, { ensureDbConnected } from '../src/app';

let dbPromise: Promise<void> | null = null;
const initializeDb = () => {
  if (!dbPromise) {
    dbPromise = ensureDbConnected();
  }
  return dbPromise;
};

export default async (req: any, res: any) => {
  await initializeDb();
  return app(req, res);
};
