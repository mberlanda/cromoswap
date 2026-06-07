import type { Scan, Session } from '../domain/types';

export type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>;

export interface SyncResult {
  ok: boolean;
}

/** Scan fields safe to sync to the backend — never image data. */
interface ScanPayload {
  id: string;
  normalizedCode: string;
  source: Scan['source'];
  confidence: number;
  capturedAt: string;
}

function toScanPayload(scan: Scan): ScanPayload {
  return {
    id: scan.id,
    normalizedCode: scan.normalizedCode,
    source: scan.source,
    confidence: scan.confidence,
    capturedAt: scan.capturedAt,
  };
}

export interface LeaderboardEntry {
  userName: string;
  owned: number;
  missing: number;
}

/**
 * Best-effort push of a session and its scans (codes + metadata only, no
 * images) to the backend. Never throws: resolves { ok: false } on any failure
 * so the local-first app keeps working offline.
 */
function jsonHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function pushSession(
  session: Session,
  scans: Scan[],
  baseUrl: string,
  token: string | null,
  fetchImpl: FetchImpl,
): Promise<SyncResult> {
  const body = JSON.stringify({
    session: { id: session.id, userName: session.userName, createdAt: session.createdAt },
    scans: scans.map(toScanPayload),
  });

  try {
    const response = await fetchImpl(`${baseUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body,
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}

/** Syncs the full set of album-owned codes for the token user. Best-effort; never throws. */
export async function syncAlbumStickers(
  userName: string,
  codes: string[],
  baseUrl: string,
  token: string | null,
  fetchImpl: FetchImpl,
): Promise<SyncResult> {
  try {
    const response = await fetchImpl(`${baseUrl}/api/v1/album_stickers/sync`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ userName, codes }),
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}

/** Fetches the global leaderboard. Returns [] on any error. */
export async function fetchLeaderboard(
  baseUrl: string,
  fetchImpl: FetchImpl,
): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetchImpl(`${baseUrl}/api/v1/leaderboard`);
    if (!response.ok) return [];
    return (await response.json()) as LeaderboardEntry[];
  } catch {
    return [];
  }
}
