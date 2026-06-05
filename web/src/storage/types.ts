import type { Scan, Session, AlbumEntry } from '../domain/types';

export type IdGen = () => string;
export type Clock = () => string;

/** Fields supplied when adding a scan; id/timestamps are assigned by the repo. */
export interface ScanInput {
  sessionId: string;
  normalizedCode: string;
  source: Scan['source'];
  confidence: number;
  capturedAt: string;
}

export interface SessionRepo {
  create(userName: string): Promise<Session>;
  get(id: string): Promise<Session | undefined>;
  list(): Promise<Session[]>;
  update(id: string, patch: Partial<Pick<Session, 'userName'>>): Promise<Session>;
}

export interface ScanRepo {
  add(input: ScanInput): Promise<Scan>;
  listBySession(sessionId: string): Promise<Scan[]>;
  update(id: string, patch: Partial<Pick<Scan, 'normalizedCode'>>): Promise<Scan>;
  delete(id: string): Promise<void>;
}

export interface ImageStore {
  put(scanId: string, dataUrl: string): Promise<void>;
  get(scanId: string): Promise<string | undefined>;
  delete(scanId: string): Promise<void>;
}

export interface AlbumRepo {
  toggle(userName: string, normalizedCode: string): Promise<'added' | 'removed'>;
  /** Mark every listed code owned (owned=true) or not owned (owned=false) in one batch. */
  setMany(userName: string, normalizedCodes: string[], owned: boolean): Promise<void>;
  listByUser(userName: string): Promise<AlbumEntry[]>;
}
