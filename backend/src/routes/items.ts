import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateItemInput } from '../lib/validation';
import { broadcastUpdate } from '../lib/events';

const router = Router();

// GET /api/items - Fetch all items
router.get('/', async (req, res) => {
  try {
    const items = await db.getItems();
    const mappedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantityType: item.quantityType,
      quantityValue: item.quantityValue,
      unit: item.unit,
      expiryDate: item.expiryDate ? item.expiryDate.toISOString() : null,
      status: item.status,
      addedBy: { id: item.addedById, name: item.addedByName || 'Unknown' },
      lastTouchedBy: { id: item.lastTouchedById, name: item.lastTouchedByName || 'Unknown' },
      usedUpBy: item.usedUpById ? { id: item.usedUpById, name: item.usedUpByName || 'Unknown' } : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return res.status(200).json(mappedItems);
  } catch (error) {
    console.error('GET /api/items error:', error);
    return res.status(500).json({ error: 'Failed to retrieve inventory items.' });
  }
});

// POST /api/items - Add a new item
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { error, validatedData } = validateItemInput(req.body);

    if (error || !validatedData) {
      return res.status(400).json({ error });
    }

    const created = await db.createItem({
      name: validatedData.name,
      category: validatedData.category,
      quantityType: validatedData.quantityType,
      quantityValue: validatedData.quantityValue,
      unit: validatedData.unit,
      expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
      status: 'active',
      addedById: user.id,
      lastTouchedById: user.id,
      usedUpById: null,
    });

    await db.createAuditLog('CREATE_ITEM', user.id, created.id, `Added "${created.name}" to category "${created.category}"`);

    const mappedItem = {
      id: created.id,
      name: created.name,
      category: created.category,
      quantityType: created.quantityType,
      quantityValue: created.quantityValue,
      unit: created.unit,
      expiryDate: created.expiryDate ? created.expiryDate.toISOString() : null,
      status: created.status,
      addedBy: { id: created.addedById, name: created.addedByName || user.name },
      lastTouchedBy: { id: created.lastTouchedById, name: created.lastTouchedByName || user.name },
      usedUpBy: null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    broadcastUpdate('create', mappedItem);
    return res.status(201).json(mappedItem);
  } catch (error) {
    console.error('POST /api/items error:', error);
    return res.status(500).json({ error: 'Failed to create inventory item.' });
  }
});

// PUT /api/items/:id - Edit an item
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const existing = await db.getItemById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const { error, validatedData } = validateItemInput(req.body);
    if (error || !validatedData) {
      return res.status(400).json({ error });
    }

    const updated = await db.updateItem(id, {
      name: validatedData.name,
      category: validatedData.category,
      quantityType: validatedData.quantityType,
      quantityValue: validatedData.quantityValue,
      unit: validatedData.unit,
      expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
      lastTouchedById: user.id,
    });

    await db.createAuditLog('UPDATE_ITEM', user.id, updated.id, `Updated details of "${updated.name}"`);

    const mappedItem = {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      quantityType: updated.quantityType,
      quantityValue: updated.quantityValue,
      unit: updated.unit,
      expiryDate: updated.expiryDate ? updated.expiryDate.toISOString() : null,
      status: updated.status,
      addedBy: { id: updated.addedById, name: updated.addedByName || 'Unknown' },
      lastTouchedBy: { id: updated.lastTouchedById, name: updated.lastTouchedByName || user.name },
      usedUpBy: updated.usedUpById ? { id: updated.usedUpById, name: updated.usedUpByName || 'Unknown' } : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    broadcastUpdate('update', mappedItem);
    return res.status(200).json(mappedItem);
  } catch (error) {
    console.error('PUT /api/items/:id error:', error);
    return res.status(500).json({ error: 'Failed to update inventory item.' });
  }
});

// DELETE /api/items/:id - Delete an item
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await db.getItemById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const deleted = await db.deleteItem(id);

    await db.createAuditLog('DELETE_ITEM', req.user!.id, deleted.id, `Deleted item "${deleted.name}"`);

    const mappedItem = {
      id: deleted.id,
      name: deleted.name,
      category: deleted.category,
      quantityType: deleted.quantityType,
      quantityValue: deleted.quantityValue,
      unit: deleted.unit,
      expiryDate: deleted.expiryDate ? deleted.expiryDate.toISOString() : null,
      status: deleted.status,
      addedBy: { id: deleted.addedById, name: deleted.addedByName || 'Unknown' },
      lastTouchedBy: { id: deleted.lastTouchedById, name: deleted.lastTouchedByName || 'Unknown' },
      usedUpBy: deleted.usedUpById ? { id: deleted.usedUpById, name: deleted.usedUpByName || 'Unknown' } : null,
      createdAt: deleted.createdAt.toISOString(),
      updatedAt: deleted.updatedAt.toISOString(),
    };

    broadcastUpdate('delete', mappedItem);
    return res.status(200).json(mappedItem);
  } catch (error) {
    console.error('DELETE /api/items/:id error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to delete inventory item.' });
  }
});

// POST /api/items/:id/use - Mark item as used up
router.post('/:id/use', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const existing = await db.getItemById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (existing.status === 'used') {
      return res.status(400).json({ error: 'Item is already marked as used up.' });
    }

    const updated = await db.updateItem(id, {
      status: 'used',
      usedUpById: user.id,
      lastTouchedById: user.id,
    });

    await db.createAuditLog('USE_ITEM', user.id, updated.id, `Marked item "${updated.name}" as Used Up`);

    const mappedItem = {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      quantityType: updated.quantityType,
      quantityValue: updated.quantityValue,
      unit: updated.unit,
      expiryDate: updated.expiryDate ? updated.expiryDate.toISOString() : null,
      status: updated.status,
      addedBy: { id: updated.addedById, name: updated.addedByName || 'Unknown' },
      lastTouchedBy: { id: updated.lastTouchedById, name: updated.lastTouchedByName || user.name },
      usedUpBy: { id: user.id, name: user.name },
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    broadcastUpdate('use', mappedItem);
    return res.status(200).json(mappedItem);
  } catch (error) {
    console.error('POST /api/items/:id/use error:', error);
    return res.status(500).json({ error: 'Failed to mark item as used up.' });
  }
});

export default router;
