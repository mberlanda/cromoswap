import type { Scan, Session } from '../domain/types';
import { pushSession, syncAlbumStickers, type FetchImpl } from './sync-client';
import { createAuthClient, getToken, type AuthClient } from '../auth/auth';

/**
 * Save-local-to-cloud: authenticate (register/login) then upload a local
 * session's scans and album into the authenticated cloud session.
 */
export interface CloudSaver {
  auth: AuthClient;
  /** Push the album (owned codes) and scans into the token user's cloud session. */
  upload(
    session: Session,
    scans: Scan[],
    ownedCodes: string[],
    username: string,
  ): Promise<{ ok: boolean }>;
}

export function buildCloudSaver(
  baseUrl: string,
  fetchImpl: FetchImpl = (u, i) => fetch(u, i),
): CloudSaver {
  return {
    auth: createAuthClient(baseUrl, fetchImpl),
    async upload(session, scans, ownedCodes, username) {
      const token = getToken();
      const album = await syncAlbumStickers(username, ownedCodes, baseUrl, token, fetchImpl);
      const sess = await pushSession(session, scans, baseUrl, token, fetchImpl);
      return { ok: album.ok && sess.ok };
    },
  };
}
