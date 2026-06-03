import type { IDBPDatabase } from 'idb';
import type { Scan, Session } from '../domain/types';
import type { StickerDb } from './db';
import type { Clock, IdGen, ImageStore, ScanInput, ScanRepo, SessionRepo } from './types';

export class IdbSessionRepo implements SessionRepo {
  private readonly db: IDBPDatabase<StickerDb>;
  private readonly ids: IdGen;
  private readonly clock: Clock;

  constructor(db: IDBPDatabase<StickerDb>, ids: IdGen, clock: Clock) {
    this.db = db;
    this.ids = ids;
    this.clock = clock;
  }

  async create(userName: string): Promise<Session> {
    const now = this.clock();
    const session: Session = { id: this.ids(), userName, createdAt: now, updatedAt: now };
    await this.db.put('sessions', session);
    return session;
  }

  async get(id: string): Promise<Session | undefined> {
    return this.db.get('sessions', id);
  }

  async list(): Promise<Session[]> {
    return this.db.getAll('sessions');
  }

  async update(id: string, patch: Partial<Pick<Session, 'userName'>>): Promise<Session> {
    const existing = await this.db.get('sessions', id);
    if (!existing) throw new Error(`session not found: ${id}`);
    const updated: Session = { ...existing, ...patch, updatedAt: this.clock() };
    await this.db.put('sessions', updated);
    return updated;
  }
}

export class IdbScanRepo implements ScanRepo {
  private readonly db: IDBPDatabase<StickerDb>;
  private readonly ids: IdGen;
  private readonly clock: Clock;

  constructor(db: IDBPDatabase<StickerDb>, ids: IdGen, clock: Clock) {
    this.db = db;
    this.ids = ids;
    this.clock = clock;
  }

  async add(input: ScanInput): Promise<Scan> {
    const now = this.clock();
    const scan: Scan = { id: this.ids(), ...input, createdAt: now, updatedAt: now };
    await this.db.put('scans', scan);
    return scan;
  }

  async listBySession(sessionId: string): Promise<Scan[]> {
    return this.db.getAllFromIndex('scans', 'bySession', sessionId);
  }

  async update(id: string, patch: Partial<Pick<Scan, 'normalizedCode'>>): Promise<Scan> {
    const existing = await this.db.get('scans', id);
    if (!existing) throw new Error(`scan not found: ${id}`);
    const updated: Scan = { ...existing, ...patch, updatedAt: this.clock() };
    await this.db.put('scans', updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete('scans', id);
  }
}

export class IdbImageStore implements ImageStore {
  private readonly db: IDBPDatabase<StickerDb>;

  constructor(db: IDBPDatabase<StickerDb>) {
    this.db = db;
  }

  async put(scanId: string, dataUrl: string): Promise<void> {
    await this.db.put('images', { scanId, dataUrl });
  }

  async get(scanId: string): Promise<string | undefined> {
    const row = await this.db.get('images', scanId);
    return row?.dataUrl;
  }

  async delete(scanId: string): Promise<void> {
    await this.db.delete('images', scanId);
  }
}
