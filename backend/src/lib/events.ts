import { Response } from 'express';

type Client = {
  id: string;
  res: Response;
};

const clients = new Set<Client>();

export function registerClient(id: string, res: Response) {
  clients.add({ id, res });
  console.log(`[SSE] Client registered: ${id}. Total active: ${clients.size}`);
}

export function unregisterClient(id: string) {
  for (const client of clients) {
    if (client.id === id) {
      clients.delete(client);
      console.log(`[SSE] Client unregistered: ${id}. Total active: ${clients.size}`);
      break;
    }
  }
}

export function broadcastUpdate(type: 'create' | 'update' | 'delete' | 'use', item: any) {
  const payload = JSON.stringify({ type, item, timestamp: new Date().toISOString() });
  const formattedMessage = `data: ${payload}\n\n`;

  console.log(`[SSE] Broadcasting event "${type}" to ${clients.size} clients.`);
  for (const client of clients) {
    try {
      client.res.write(formattedMessage);
      if ((client.res as any).flush) {
        (client.res as any).flush();
      }
    } catch (e) {
      console.warn(`[SSE] Failed to send to client ${client.id}, removing.`);
      clients.delete(client);
    }
  }
}
