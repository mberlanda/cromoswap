import type { Scan, Session, AlbumEntry } from '../domain/types';
import type { AlbumRepo, ScanInput, ScanRepo, SessionRepo } from './types';

// Session IDs created or resumed on this device — used to populate the home
// screen without a server-side user account system.
const SESSION_IDS_KEY = 'wc-session-ids';

function getLocalSessionIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SESSION_IDS_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function saveLocalSessionId(id: string): void {
  const ids = new Set(getLocalSessionIds());
  ids.add(id);
  localStorage.setItem(SESSION_IDS_KEY, JSON.stringify([...ids]));
}

function mapSession(d: Record<string, unknown>): Session {
  return {
    id: d['id'] as string,
    userName: d['userName'] as string,
    createdAt: d['createdAt'] as string,
    updatedAt: d['updatedAt'] as string,
  };
}

function mapScan(d: Record<string, unknown>): Scan {
  return {
    id: d['id'] as string,
    sessionId: d['sessionId'] as string,
    normalizedCode: d['normalizedCode'] as string,
    source: d['source'] as Scan['source'],
    confidence: d['confidence'] as number,
    capturedAt: d['capturedAt'] as string,
    createdAt: (d['createdAt'] ?? d['capturedAt']) as string,
    updatedAt: (d['updatedAt'] ?? d['capturedAt']) as string,
  };
}

function mapAlbumEntry(d: Record<string, unknown>): AlbumEntry {
  return {
    id: d['id'] as string,
    userName: d['userName'] as string,
    normalizedCode: d['normalizedCode'] as string,
    ownedAt: d['ownedAt'] as string,
  };
}

export class ApiSessionRepo implements SessionRepo {
  baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  async create(userName: string): Promise<Session> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: { userName }, scans: [] }),
    });
    if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
    const data = await res.json() as Record<string, unknown>;
    const session = mapSession(data);
    saveLocalSessionId(session.id);
    return session;
  }

  async list(): Promise<Session[]> {
    const ids = getLocalSessionIds();
    if (ids.length === 0) return [];
    const qs = ids.map((id) => `ids[]=${encodeURIComponent(id)}`).join('&');
    const res = await fetch(`${this.baseUrl}/api/v1/sessions?${qs}`);
    if (!res.ok) return [];
    const data = await res.json() as Array<Record<string, unknown>>;
    return data.map(mapSession);
  }

  async get(id: string): Promise<Session | undefined> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions/${id}`);
    if (!res.ok) return undefined;
    return mapSession(await res.json() as Record<string, unknown>);
  }

  async update(id: string, patch: Partial<Pick<Session, 'userName'>>): Promise<Session> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: patch }),
    });
    if (!res.ok) throw new Error(`Failed to update session: ${res.status}`);
    return mapSession(await res.json() as Record<string, unknown>);
  }
}

export class ApiScanRepo implements ScanRepo {
  baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  async add(input: ScanInput): Promise<Scan> {
    const res = await fetch(`${this.baseUrl}/api/v1/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: input.sessionId,
        normalizedCode: input.normalizedCode,
        source: input.source,
        confidence: input.confidence,
        capturedAt: input.capturedAt,
      }),
    });
    if (!res.ok) throw new Error(`Failed to add scan: ${res.status}`);
    return mapScan(await res.json() as Record<string, unknown>);
  }

  async listBySession(sessionId: string): Promise<Scan[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions/${sessionId}/scans`);
    if (!res.ok) return [];
    const data = await res.json() as Array<Record<string, unknown>>;
    return data.map(mapScan);
  }

  async update(id: string, patch: Partial<Pick<Scan, 'normalizedCode'>>): Promise<Scan> {
    const res = await fetch(`${this.baseUrl}/api/v1/scans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ normalizedCode: patch.normalizedCode }),
    });
    if (!res.ok) throw new Error(`Failed to update scan: ${res.status}`);
    return mapScan(await res.json() as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/scans/${id}`, { method: 'DELETE' });
  }
}

export class ApiAlbumRepo implements AlbumRepo {
  baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  async listByUser(userName: string): Promise<AlbumEntry[]> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/album_stickers?user_name=${encodeURIComponent(userName)}`,
    );
    if (!res.ok) return [];
    const data = await res.json() as Array<Record<string, unknown>>;
    return data.map(mapAlbumEntry);
  }

  async toggle(userName: string, normalizedCode: string): Promise<'added' | 'removed'> {
    const res = await fetch(`${this.baseUrl}/api/v1/album_stickers/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, normalizedCode }),
    });
    if (!res.ok) throw new Error(`Failed to toggle sticker: ${res.status}`);
    const data = await res.json() as { action: 'added' | 'removed' };
    return data.action;
  }
}
