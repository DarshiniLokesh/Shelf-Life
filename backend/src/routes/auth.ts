import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// POST /api/auth - Login / Registration
router.post('/', async (req: Request, res: Response) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';

    if (!name) {
      return res.status(400).json({ error: 'Display name is required.' });
    }

    if (name.length < 2 || name.length > 30) {
      return res.status(400).json({ error: 'Display name must be between 2 and 30 characters.' });
    }

    const nameRegex = /^[a-zA-Z0-9_\-\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ error: 'Display name can only contain letters, numbers, spaces, underscores, and hyphens.' });
    }

    const existingUser = await db.getUserByName(name);

    if (existingUser) {
      if (!token) {
        return res.status(200).json({
          error: 'username_taken',
          message: 'This name is already registered. Please enter your PIN to login.',
        });
      }

      if (existingUser.token === token) {
        await db.createAuditLog('LOGIN', existingUser.id, null, 'Logged in');
        return res.status(200).json({
          id: existingUser.id,
          name: existingUser.name,
          token: existingUser.token,
          isNew: false,
        });
      } else {
        return res.status(401).json({ error: 'Incorrect PIN for this username. Please try again or ask a housemate to look up your PIN.' });
      }
    }

    // Register a new user with 6-digit PIN
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser = await db.createUser(name, generatedPin);

    await db.createAuditLog('REGISTER', newUser.id, null, `Registered new household name: ${name}`);

    return res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      token: newUser.token,
      isNew: true,
    });
  } catch (error) {
    console.error('Auth route error:', error);
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

export default router;
