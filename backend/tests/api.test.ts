import request from 'supertest';
import app, { ensureDbConnected } from '../src/app';
import { db } from '../src/db';

beforeAll(async () => {
  await ensureDbConnected();
});

beforeEach(async () => {
  await db.clearData();
});

describe('ShelfLife API Tests', () => {
  
  describe('Authentication API (/api/auth)', () => {
    
    it('should reject empty display names', async () => {
      const res = await request(app)
        .post('/api/auth')
        .send({ name: '   ' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Display name is required');
    });

    it('should reject display names that are too short or long', async () => {
      const shortRes = await request(app)
        .post('/api/auth')
        .send({ name: 'A' });
      expect(shortRes.status).toBe(400);

      const longRes = await request(app)
        .post('/api/auth')
        .send({ name: 'A'.repeat(31) });
      expect(longRes.status).toBe(400);
    });

    it('should register a new username and return a 6-digit PIN', async () => {
      const res = await request(app)
        .post('/api/auth')
        .send({ name: 'Alice' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Alice');
      expect(res.body).toHaveProperty('token');
      expect(res.body.token).toMatch(/^[0-9]{6}$/);
      expect(res.body.isNew).toBe(true);
    });

    it('should request a PIN if trying to register an already taken username', async () => {
      // 1st register
      await request(app).post('/api/auth').send({ name: 'Alice' });

      // 2nd register (attempt without PIN)
      const res = await request(app)
        .post('/api/auth')
        .send({ name: 'Alice' });

      expect(res.status).toBe(200);
      expect(res.body.error).toBe('username_taken');
      expect(res.body.message).toContain('already registered');
    });

    it('should allow login of existing username with correct PIN', async () => {
      const reg = await request(app).post('/api/auth').send({ name: 'Alice' });
      const pin = reg.body.token;

      const loginRes = await request(app)
        .post('/api/auth')
        .send({ name: 'Alice', token: pin });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.name).toBe('Alice');
      expect(loginRes.body.token).toBe(pin);
    });

    it('should reject login of existing username with incorrect PIN', async () => {
      await request(app).post('/api/auth').send({ name: 'Alice' });

      const loginRes = await request(app)
        .post('/api/auth')
        .send({ name: 'Alice', token: '000000' }); // wrong PIN

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.error).toContain('Incorrect PIN');
    });
  });

  describe('Inventory API (/api/items)', () => {
    let user: { id: string; name: string; token: string };

    beforeEach(async () => {
      const reg = await request(app).post('/api/auth').send({ name: 'Alice' });
      user = reg.body;
    });

    it('should return empty list initially', async () => {
      const res = await request(app).get('/api/items');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should enforce auth protection on item creation', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Apple', category: 'Produce', quantityType: 'boolean' });

      expect(res.status).toBe(401);
    });

    it('should reject invalid item validation rules', async () => {
      const authHeader = {
        'x-user-id': user.id,
        'x-user-token': user.token,
      };

      // 1. Empty name
      const res1 = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({ name: '', category: 'Produce', quantityType: 'boolean' });
      expect(res1.status).toBe(400);

      // 2. Missing category
      const res2 = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({ name: 'Rice', quantityType: 'weight', quantityValue: 2, unit: 'kg' });
      expect(res2.status).toBe(400);

      // 3. Invalid weight unit (must be g/kg)
      const res3 = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({ name: 'Rice', category: 'Grain', quantityType: 'weight', quantityValue: 2, unit: 'lbs' });
      expect(res3.status).toBe(400);

      // 4. Invalid count quantity value (must be positive)
      const res4 = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({ name: 'Onions', category: 'Produce', quantityType: 'count', quantityValue: -5 });
      expect(res4.status).toBe(400);
    });

    it('should successfully add the required seed inventory items', async () => {
      const authHeader = {
        'x-user-id': user.id,
        'x-user-token': user.token,
      };

      // Seed 1: Basmati Rice (Grain, 2kg, no expiry)
      const resRice = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({
          name: 'Basmati Rice',
          category: 'Grain',
          quantityType: 'weight',
          quantityValue: 2,
          unit: 'kg',
          expiryDate: null
        });
      expect(resRice.status).toBe(201);
      expect(resRice.body.name).toBe('Basmati Rice');
      expect(resRice.body.quantityType).toBe('weight');
      expect(resRice.body.quantityValue).toBe(2);
      expect(resRice.body.unit).toBe('kg');
      expect(resRice.body.expiryDate).toBeNull();

      // Seed 2: Salt (Spice, presence only, no expiry)
      const resSalt = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({
          name: 'Salt',
          category: 'Spice',
          quantityType: 'boolean',
          quantityValue: null,
          unit: null,
          expiryDate: null
        });
      expect(resSalt.status).toBe(201);
      expect(resSalt.body.name).toBe('Salt');
      expect(resSalt.body.quantityType).toBe('boolean');
      expect(resSalt.body.quantityValue).toBeNull();

      // Seed 3: Onions (Produce, 4 count, expiry in 5 days)
      const onionsExpiry = new Date();
      onionsExpiry.setDate(onionsExpiry.getDate() + 5);
      
      const resOnions = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({
          name: 'Onions',
          category: 'Produce',
          quantityType: 'count',
          quantityValue: 4,
          expiryDate: onionsExpiry.toISOString()
        });
      expect(resOnions.status).toBe(201);
      expect(resOnions.body.name).toBe('Onions');
      expect(resOnions.body.quantityType).toBe('count');
      expect(resOnions.body.quantityValue).toBe(4);
      expect(new Date(resOnions.body.expiryDate).toDateString()).toBe(onionsExpiry.toDateString());

      // Seed 4: Milk (Dairy, 1 count, expiry tomorrow)
      const milkExpiry = new Date();
      milkExpiry.setDate(milkExpiry.getDate() + 1);

      const resMilk = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({
          name: 'Milk',
          category: 'Dairy',
          quantityType: 'count',
          quantityValue: 1,
          expiryDate: milkExpiry.toISOString()
        });
      expect(resMilk.status).toBe(201);
      expect(resMilk.body.name).toBe('Milk');
      expect(resMilk.body.quantityType).toBe('count');
      expect(resMilk.body.quantityValue).toBe(1);
    });

    it('should support editing an item', async () => {
      const authHeader = {
        'x-user-id': user.id,
        'x-user-token': user.token,
      };

      const original = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({ name: 'Milk', category: 'Dairy', quantityType: 'count', quantityValue: 1 });

      const itemId = original.body.id;

      // Edit item
      const updated = await request(app)
        .put(`/api/items/${itemId}`)
        .set(authHeader)
        .send({ name: 'Milk', category: 'Dairy', quantityType: 'count', quantityValue: 3 }); // updated qty to 3

      expect(updated.status).toBe(200);
      expect(updated.body.quantityValue).toBe(3);
    });

    it('should support marking an item as used up', async () => {
      const authHeader = {
        'x-user-id': user.id,
        'x-user-token': user.token,
      };

      const original = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({ name: 'Salt', category: 'Spice', quantityType: 'boolean' });

      const itemId = original.body.id;

      const usedRes = await request(app)
        .post(`/api/items/${itemId}/use`)
        .set(authHeader);

      expect(usedRes.status).toBe(200);
      expect(usedRes.body.status).toBe('used');
      expect(usedRes.body.usedUpBy.id).toBe(user.id);
      expect(usedRes.body.usedUpBy.name).toBe(user.name);
    });

    it('should support deleting an item', async () => {
      const authHeader = {
        'x-user-id': user.id,
        'x-user-token': user.token,
      };

      const original = await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({ name: 'Mistake Item', category: 'Other', quantityType: 'boolean' });

      const itemId = original.body.id;

      const deleteRes = await request(app)
        .delete(`/api/items/${itemId}`)
        .set(authHeader);

      expect(deleteRes.status).toBe(200);

      // Verify item is removed from lists
      const listRes = await request(app).get('/api/items');
      expect(listRes.body.find((item: any) => item.id === itemId)).toBeUndefined();
    });

    it('should generate and retrieve audit logs for registrations, logins, and creations', async () => {
      // Perform a login to trigger a LOGIN log
      await request(app)
        .post('/api/auth')
        .send({ name: user.name, token: user.token });

      const authHeader = {
        'x-user-id': user.id,
        'x-user-token': user.token,
      };

      // Let's create an item to trigger a CREATE_ITEM log
      await request(app)
        .post('/api/items')
        .set(authHeader)
        .send({ name: 'Apple', category: 'Produce', quantityType: 'boolean' });

      // Get audit logs
      const logsRes = await request(app)
        .get('/api/audit-logs')
        .set(authHeader);

      expect(logsRes.status).toBe(200);
      expect(logsRes.body.length).toBeGreaterThanOrEqual(3); // REGISTER, LOGIN, CREATE_ITEM
      
      const createLog = logsRes.body.find((l: any) => l.action === 'CREATE_ITEM');
      expect(createLog).toBeDefined();
      expect(createLog.details).toContain('Apple');
      expect(createLog.userName).toBe(user.name);

      const loginLog = logsRes.body.find((l: any) => l.action === 'LOGIN');
      expect(loginLog).toBeDefined();
    });
  });
});
