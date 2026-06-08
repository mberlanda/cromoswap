import type { Scan, Session, AlbumEntry } from '../domain/types';
import type { AlbumRepo, ScanInput, ScanRepo, SessionRepo } from './types';

// Session IDs created or resumed on this device — used to populate the home
// screen without a server-side user account system.
const SESSION_IDS_KEY = 'wc-session-ids';

/** Supplies the current bearer token (or null when logged out). */
export type TokenProvider = () => string | null;

// Headers for an authenticated JSON write: includes the bearer token when one
// is available. Reads use the public endpoints and don't need it.
function writeHeaders(getToken?: TokenProvider): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken?.();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function getLocalSessionIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SESSION_IDS_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function saveLocalSessionId(id: string): void {
  try {
    const ids = new Set(getLocalSessionIds());
    ids.add(id);
    localStorage.setItem(SESSION_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage may be unavailable (private mode); adopting the session
    // must not fail because we couldn't persist its id for the resume list.
  }
}

/** Record a cloud session id so it appears in the home resume list. */
export function rememberSessionId(id: string): void {
  saveLocalSessionId(id);
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
  private getToken?: TokenProvider;
  constructor(baseUrl: string, getToken?: TokenProvider) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  async create(userName: string): Promise<Session> {
    const res = await fetch(`${this.baseUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: writeHeaders(this.getToken),
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
    const res = await fetch(`${this.baseUrl}/api/v1/sessions?${qs}`, {
      headers: writeHeaders(this.getToken),
    });
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
      headers: writeHeaders(this.getToken),
      body: JSON.stringify({ session: patch }),
    });
    if (!res.ok) throw new Error(`Failed to update session: ${res.status}`);
    return mapSession(await res.json() as Record<string, unknown>);
  }
}

export class ApiScanRepo implements ScanRepo {
  baseUrl: string;
  private getToken?: TokenProvider;
  constructor(baseUrl: string, getToken?: TokenProvider) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  async add(input: ScanInput): Promise<Scan> {
    const res = await fetch(`${this.baseUrl}/api/v1/scans`, {
      method: 'POST',
      headers: writeHeaders(this.getToken),
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
      headers: writeHeaders(this.getToken),
      body: JSON.stringify({ normalizedCode: patch.normalizedCode }),
    });
    if (!res.ok) throw new Error(`Failed to update scan: ${res.status}`);
    return mapScan(await res.json() as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/scans/${id}`, {
      method: 'DELETE',
      headers: writeHeaders(this.getToken),
    });
  }
}

export class ApiAlbumRepo implements AlbumRepo {
  baseUrl: string;
  private getToken?: TokenProvider;
  constructor(baseUrl: string, getToken?: TokenProvider) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  async listByUser(userName: string): Promise<AlbumEntry[]> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/album_stickers?user_name=${encodeURIComponent(userName)}`,
    );
    if (!res.ok) return [];
    const data = await res.json() as Array<Record<string, unknown>>;
    return data.map(mapAlbumEntry);
  }

  // userName is sent for compatibility but the server authorizes off the token
  // and ignores a matching value (a mismatched one is rejected).
  async toggle(userName: string, normalizedCode: string): Promise<'added' | 'removed'> {
    const res = await fetch(`${this.baseUrl}/api/v1/album_stickers/toggle`, {
      method: 'POST',
      headers: writeHeaders(this.getToken),
      body: JSON.stringify({ userName, normalizedCode }),
    });
    if (!res.ok) throw new Error(`Failed to toggle sticker: ${res.status}`);
    const data = await res.json() as { action: 'added' | 'removed' };
    return data.action;
  }

  // The backend only exposes a per-sticker toggle, so a batch set reads the
  // current owned set once and toggles only the codes whose state must change.
  async setMany(userName: string, normalizedCodes: string[], owned: boolean): Promise<void> {
    const current = new Set((await this.listByUser(userName)).map((e) => e.normalizedCode));
    for (const normalizedCode of normalizedCodes) {
      if (current.has(normalizedCode) !== owned) {
        await this.toggle(userName, normalizedCode);
      }
    }
  }
}
