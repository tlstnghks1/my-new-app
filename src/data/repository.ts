import type { Client } from '../types';

/**
 * Storage abstraction. The app only talks to this interface, so swapping
 * localStorage for a real backend (Supabase, Firebase, your own API) later
 * means writing one new class — no UI changes.
 */
export interface ClientRepository {
  load(): Promise<Client[]>;
  saveAll(clients: Client[]): Promise<void>;
}

const STORAGE_KEY = 'realtor-crm/clients/v1';

export class LocalStorageRepository implements ClientRepository {
  async load(): Promise<Client[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Client[]) : [];
    } catch {
      return [];
    }
  }

  async saveAll(clients: Client[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch (err) {
      console.error('Failed to save clients', err);
    }
  }

  static hasData(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
