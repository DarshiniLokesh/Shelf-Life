import mssql from 'mssql';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

export interface User {
  id: string;
  name: string;
  token: string;
  createdAt: Date;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  quantityType: string;
  quantityValue: number | null;
  unit: string | null;
  expiryDate: Date | null;
  status: string;
  addedById: string;
  lastTouchedById: string;
  usedUpById: string | null;
  createdAt: Date;
  updatedAt: Date;
  addedByName?: string;
  lastTouchedByName?: string;
  usedUpByName?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  itemId: string | null;
  details: string;
  createdAt: Date;
  userName?: string;
}

// ----------------------------------------------------
// Unified Database Interface
// ----------------------------------------------------
export interface IDatabase {
  initialize(): Promise<void>;
  getUserByName(name: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(name: string, token: string): Promise<User>;
  getItems(): Promise<Item[]>;
  getItemById(id: string): Promise<Item | null>;
  createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item>;
  updateItem(id: string, item: Partial<Item>): Promise<Item>;
  deleteItem(id: string): Promise<Item>;
  createAuditLog(action: string, userId: string, itemId: string | null, details: string): Promise<void>;
  getAuditLogs(): Promise<AuditLog[]>;
  clearData(): Promise<void>; // Helpful for tests
}

// ----------------------------------------------------
// Implementation 1: MS SQL Database
// ----------------------------------------------------
class MssqlDatabase implements IDatabase {
  private pool: mssql.ConnectionPool | null = null;
  private config: mssql.config;

  constructor() {
    this.config = {
      server: process.env.MSSQL_HOST || 'localhost',
      port: parseInt(process.env.MSSQL_PORT || '1433'),
      user: process.env.MSSQL_USER || 'sa',
      password: process.env.MSSQL_PASSWORD || '',
      database: process.env.MSSQL_DATABASE || 'shelflife',
      options: {
        encrypt: true, // For azure
        trustServerCertificate: true, // For local dev
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
  }

  async initialize(): Promise<void> {
    try {
      console.log(`[DB] Connecting to MS SQL Server at ${this.config.server}:${this.config.port}...`);
      this.pool = await new mssql.ConnectionPool(this.config).connect();
      console.log('[DB] Connected to MS SQL Server.');

      // Create Tables if they don't exist
      await this.pool.request().query(`
        if not exists (select * from sysobjects where name='Users' and xtype='U')
        create table Users (
          id varchar(50) primary key,
          name nvarchar(100) unique not null,
          token varchar(100) not null,
          createdAt datetime default getdate()
        );

        if not exists (select * from sysobjects where name='Items' and xtype='U')
        create table Items (
          id varchar(50) primary key,
          name nvarchar(100) not null,
          category varchar(50) not null,
          quantityType varchar(50) not null,
          quantityValue float null,
          unit nvarchar(50) null,
          expiryDate datetime null,
          status varchar(50) not null default 'active',
          addedById varchar(50) not null,
          lastTouchedById varchar(50) not null,
          usedUpById varchar(50) null,
          createdAt datetime default getdate(),
          updatedAt datetime default getdate(),
          foreign key (addedById) references Users(id),
          foreign key (lastTouchedById) references Users(id),
          foreign key (usedUpById) references Users(id)
        );

        if not exists (select * from sysobjects where name='AuditLogs' and xtype='U')
        create table AuditLogs (
          id varchar(50) primary key,
          action varchar(50) not null,
          userId varchar(50) not null,
          itemId varchar(50) null,
          details nvarchar(max) not null,
          createdAt datetime default getdate(),
          foreign key (userId) references Users(id)
        );
      `);
      console.log('[DB] Database tables verified/created.');
    } catch (err) {
      console.error('[DB] Failed to connect to MS SQL Database:', err);
      throw err;
    }
  }

  async getUserByName(name: string): Promise<User | null> {
    const result = await this.pool!.request()
      .input('name', mssql.NVarChar, name)
      .query('SELECT * FROM Users WHERE name = @name');
    return result.recordset[0] || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.pool!.request()
      .input('id', mssql.VarChar, id)
      .query('SELECT * FROM Users WHERE id = @id');
    return result.recordset[0] || null;
  }

  async createUser(name: string, token: string): Promise<User> {
    const id = uuidv4();
    await this.pool!.request()
      .input('id', mssql.VarChar, id)
      .input('name', mssql.NVarChar, name)
      .input('token', mssql.VarChar, token)
      .query('INSERT INTO Users (id, name, token) VALUES (@id, @name, @token)');
    return { id, name, token, createdAt: new Date() };
  }

  async getItems(): Promise<Item[]> {
    // Join with Users to get addedBy, lastTouchedBy, and usedUpBy names
    const result = await this.pool!.request().query(`
      SELECT 
        i.*,
        u1.name as addedByName,
        u2.name as lastTouchedByName,
        u3.name as usedUpByName
      FROM Items i
      JOIN Users u1 ON i.addedById = u1.id
      JOIN Users u2 ON i.lastTouchedById = u2.id
      LEFT JOIN Users u3 ON i.usedUpById = u3.id
      ORDER BY i.updatedAt DESC
    `);
    return result.recordset;
  }

  async getItemById(id: string): Promise<Item | null> {
    const result = await this.pool!.request()
      .input('id', mssql.VarChar, id)
      .query(`
        SELECT 
          i.*,
          u1.name as addedByName,
          u2.name as lastTouchedByName,
          u3.name as usedUpByName
        FROM Items i
        JOIN Users u1 ON i.addedById = u1.id
        JOIN Users u2 ON i.lastTouchedById = u2.id
        LEFT JOIN Users u3 ON i.usedUpById = u3.id
        WHERE i.id = @id
      `);
    return result.recordset[0] || null;
  }

  async createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const id = uuidv4();
    await this.pool!.request()
      .input('id', mssql.VarChar, id)
      .input('name', mssql.NVarChar, item.name)
      .input('category', mssql.VarChar, item.category)
      .input('quantityType', mssql.VarChar, item.quantityType)
      .input('quantityValue', mssql.Float, item.quantityValue)
      .input('unit', mssql.NVarChar, item.unit)
      .input('expiryDate', mssql.DateTime, item.expiryDate)
      .input('status', mssql.VarChar, item.status)
      .input('addedById', mssql.VarChar, item.addedById)
      .input('lastTouchedById', mssql.VarChar, item.lastTouchedById)
      .query(`
        INSERT INTO Items (id, name, category, quantityType, quantityValue, unit, expiryDate, status, addedById, lastTouchedById)
        VALUES (@id, @name, @category, @quantityType, @quantityValue, @unit, @expiryDate, @status, @addedById, @lastTouchedById)
      `);
    
    const created = await this.getItemById(id);
    return created!;
  }

  async updateItem(id: string, item: Partial<Item>): Promise<Item> {
    let updateFields: string[] = [];
    const request = this.pool!.request().input('id', mssql.VarChar, id);

    if (item.name !== undefined) {
      request.input('name', mssql.NVarChar, item.name);
      updateFields.push('name = @name');
    }
    if (item.category !== undefined) {
      request.input('category', mssql.VarChar, item.category);
      updateFields.push('category = @category');
    }
    if (item.quantityType !== undefined) {
      request.input('quantityType', mssql.VarChar, item.quantityType);
      updateFields.push('quantityType = @quantityType');
    }
    if (item.quantityValue !== undefined) {
      request.input('quantityValue', mssql.Float, item.quantityValue);
      updateFields.push('quantityValue = @quantityValue');
    }
    if (item.unit !== undefined) {
      request.input('unit', mssql.NVarChar, item.unit);
      updateFields.push('unit = @unit');
    }
    if (item.expiryDate !== undefined) {
      request.input('expiryDate', mssql.DateTime, item.expiryDate);
      updateFields.push('expiryDate = @expiryDate');
    }
    if (item.status !== undefined) {
      request.input('status', mssql.VarChar, item.status);
      updateFields.push('status = @status');
    }
    if (item.lastTouchedById !== undefined) {
      request.input('lastTouchedById', mssql.VarChar, item.lastTouchedById);
      updateFields.push('lastTouchedById = @lastTouchedById');
    }
    if (item.usedUpById !== undefined) {
      request.input('usedUpById', mssql.VarChar, item.usedUpById);
      updateFields.push('usedUpById = @usedUpById');
    }

    // Always update updatedAt
    updateFields.push('updatedAt = GETDATE()');

    await request.query(`
      UPDATE Items 
      SET ${updateFields.join(', ')} 
      WHERE id = @id
    `);

    const updated = await this.getItemById(id);
    return updated!;
  }

  async deleteItem(id: string): Promise<Item> {
    const item = await this.getItemById(id);
    if (!item) throw new Error('Item not found.');

    await this.pool!.request()
      .input('id', mssql.VarChar, id)
      .query('DELETE FROM Items WHERE id = @id');
    
    return item;
  }

  async createAuditLog(action: string, userId: string, itemId: string | null, details: string): Promise<void> {
    const id = uuidv4();
    await this.pool!.request()
      .input('id', mssql.VarChar, id)
      .input('action', mssql.VarChar, action)
      .input('userId', mssql.VarChar, userId)
      .input('itemId', mssql.VarChar, itemId)
      .input('details', mssql.NVarChar, details)
      .query('INSERT INTO AuditLogs (id, action, userId, itemId, details) VALUES (@id, @action, @userId, @itemId, @details)');
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const result = await this.pool!.request().query(`
      SELECT 
        a.*,
        u.name as userName
      FROM AuditLogs a
      JOIN Users u ON a.userId = u.id
      ORDER BY a.createdAt DESC
    `);
    return result.recordset;
  }

  async clearData(): Promise<void> {
    await this.pool!.request().query('DELETE FROM AuditLogs; DELETE FROM Items; DELETE FROM Users;');
  }
}

// ----------------------------------------------------
// Implementation 2: In-Memory Database Fallback
// ----------------------------------------------------
class InMemoryDatabase implements IDatabase {
  private users: User[] = [];
  private items: Item[] = [];
  private auditLogs: AuditLog[] = [];

  async initialize(): Promise<void> {
    console.log('[DB] Using In-Memory fallback database.');
  }

  async getUserByName(name: string): Promise<User | null> {
    return this.users.find(u => u.name.toLowerCase() === name.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async createUser(name: string, token: string): Promise<User> {
    const user: User = {
      id: uuidv4(),
      name,
      token,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async getItems(): Promise<Item[]> {
    return this.items.map(item => this.injectUserNames(item)).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getItemById(id: string): Promise<Item | null> {
    const item = this.items.find(i => i.id === id);
    if (!item) return null;
    return this.injectUserNames(item);
  }

  async createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const created: Item = {
      ...item,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(created);
    return this.injectUserNames(created);
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Item not found.');

    const updated = {
      ...this.items[idx],
      ...updates,
      updatedAt: new Date(),
    };
    this.items[idx] = updated;
    return this.injectUserNames(updated);
  }

  async deleteItem(id: string): Promise<Item> {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Item not found.');

    const deleted = this.items[idx];
    this.items.splice(idx, 1);
    return this.injectUserNames(deleted);
  }

  async createAuditLog(action: string, userId: string, itemId: string | null, details: string): Promise<void> {
    const log: AuditLog = {
      id: uuidv4(),
      action,
      userId,
      itemId,
      details,
      createdAt: new Date()
    };
    this.auditLogs.push(log);
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogs.map(log => {
      const user = this.users.find(u => u.id === log.userId);
      return {
        ...log,
        userName: user?.name || 'Unknown'
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async clearData(): Promise<void> {
    this.users = [];
    this.items = [];
    this.auditLogs = [];
  }

  private injectUserNames(item: Item): Item {
    const addedUser = this.users.find(u => u.id === item.addedById);
    const touchedUser = this.users.find(u => u.id === item.lastTouchedById);
    const usedUser = item.usedUpById ? this.users.find(u => u.id === item.usedUpById) : null;

    return {
      ...item,
      addedByName: addedUser?.name || 'Unknown',
      lastTouchedByName: touchedUser?.name || 'Unknown',
      usedUpByName: usedUser?.name || undefined,
    };
  }
}

// ----------------------------------------------------
// Export Database Instance Selector
// ----------------------------------------------------
const useRealMssql = process.env.NODE_ENV === 'test' 
  ? (process.env.USE_TEST_MSSQL === 'true')
  : (process.env.MSSQL_PASSWORD !== undefined || process.env.MSSQL_HOST !== undefined);

export const db: IDatabase = useRealMssql ? new MssqlDatabase() : new InMemoryDatabase();
