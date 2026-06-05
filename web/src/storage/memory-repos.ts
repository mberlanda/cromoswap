import type { Scan, Session, AlbumEntry } from '../domain/types';
import type { Clock, IdGen, ImageStore, ScanInput, ScanRepo, SessionRepo, AlbumRepo } from './types';

export class MemorySessionRepo implements SessionRepo {
  private readonly sessions = new Map<string, Session>();
  private readonly ids: IdGen;
  private readonly clock: Clock;

  constructor(ids: IdGen, clock: Clock) {
    this.ids = ids;
    this.clock = clock;
  }

  async create(userName: string): Promise<Session> {
    const now = this.clock();
    const session: Session = { id: this.ids(), userName, createdAt: now, updatedAt: now };
    this.sessions.set(session.id, session);
    return session;
  }

  async get(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async list(): Promise<Session[]> {
    return [...this.sessions.values()];
  }

  async update(id: string, patch: Partial<Pick<Session, 'userName'>>): Promise<Session> {
    const existing = this.sessions.get(id);
    if (!existing) throw new Error(`session not found: ${id}`);
    const updated: Session = { ...existing, ...patch, updatedAt: this.clock() };
    this.sessions.set(id, updated);
    return updated;
  }
}

export class MemoryScanRepo implements ScanRepo {
  private readonly scans = new Map<string, Scan>();
  private readonly ids: IdGen;
  private readonly clock: Clock;

  constructor(ids: IdGen, clock: Clock) {
    this.ids = ids;
    this.clock = clock;
  }

  async add(input: ScanInput): Promise<Scan> {
    const now = this.clock();
    const scan: Scan = { id: this.ids(), ...input, createdAt: now, updatedAt: now };
    this.scans.set(scan.id, scan);
    return scan;
  }

  async listBySession(sessionId: string): Promise<Scan[]> {
    return [...this.scans.values()].filter((s) => s.sessionId === sessionId);
  }

  async update(id: string, patch: Partial<Pick<Scan, 'normalizedCode'>>): Promise<Scan> {
    const existing = this.scans.get(id);
    if (!existing) throw new Error(`scan not found: ${id}`);
    const updated: Scan = { ...existing, ...patch, updatedAt: this.clock() };
    this.scans.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.scans.delete(id);
  }
}

export class MemoryImageStore implements ImageStore {
  private readonly images = new Map<string, string>();

  async put(scanId: string, dataUrl: string): Promise<void> {
    this.images.set(scanId, dataUrl);
  }

  async get(scanId: string): Promise<string | undefined> {
    return this.images.get(scanId);
  }

  async delete(scanId: string): Promise<void> {
    this.images.delete(scanId);
  }
}

export class MemoryAlbumRepo implements AlbumRepo {
  private readonly entries = new Map<string, AlbumEntry>();
  private readonly ids: IdGen;
  private readonly clock: Clock;

  constructor(ids: IdGen, clock: Clock) {
    this.ids = ids;
    this.clock = clock;
  }

  async toggle(userName: string, normalizedCode: string): Promise<'added' | 'removed'> {
    const key = `${userName}:${normalizedCode}`;
    if (this.entries.has(key)) {
      this.entries.delete(key);
      return 'removed';
    }
    const entry: AlbumEntry = {
      id: this.ids(),
      userName,
      normalizedCode,
      ownedAt: this.clock(),
    };
    this.entries.set(key, entry);
    return 'added';
  }

  async setMany(userName: string, normalizedCodes: string[], owned: boolean): Promise<void> {
    for (const normalizedCode of normalizedCodes) {
      const key = `${userName}:${normalizedCode}`;
      if (owned) {
        if (!this.entries.has(key)) {
          this.entries.set(key, {
            id: this.ids(),
            userName,
            normalizedCode,
            ownedAt: this.clock(),
          });
        }
      } else {
        this.entries.delete(key);
      }
    }
  }

  async listByUser(userName: string): Promise<AlbumEntry[]> {
    return [...this.entries.values()].filter((e) => e.userName === userName);
  }
}
