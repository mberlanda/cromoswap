// Cloud authentication for the web client: a localStorage-backed JWT plus the
// register/login/change-password calls. The token persists across reloads on
// the same device; cross-device continuity comes from logging in again.

export const TOKEN_KEY = 'cromoswap-token';

export interface TokenClaims {
  userId: string;
  exp: number;
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthSession {
  id: string;
  userName: string;
  createdAt?: string;
  updatedAt?: string;
  scanCount?: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  session: AuthSession | null;
}

export type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>;

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore (private mode / storage disabled)
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function decodeToken(token: string): TokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // JWT segments are unpadded base64url; atob needs the '=' padding restored.
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    if (typeof payload['user_id'] !== 'string' || typeof payload['exp'] !== 'number') return null;
    return { userId: payload['user_id'], exp: payload['exp'] };
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const claims = decodeToken(token);
  if (!claims) return true;
  return claims.exp * 1000 <= Date.now();
}

/** The token claims (userId/exp) from the stored token, or null if
 *  missing/expired/invalid. Not a full AuthUser — just what the JWT carries. */
export function getStoredUser(): TokenClaims | null {
  const token = getToken();
  if (!token || isExpired(token)) return null;
  return decodeToken(token);
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { errors?: string[]; error?: string };
    if (body.errors?.length) return body.errors.join(', ');
    if (body.error) return body.error;
  } catch {
    // fall through
  }
  return `Request failed (${res.status})`;
}

async function postAuth(
  url: string,
  body: unknown,
  fetchImpl: FetchImpl,
): Promise<AuthResponse> {
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as AuthResponse;
}

export function register(
  baseUrl: string,
  username: string,
  password: string,
  fetchImpl: FetchImpl = (u, i) => fetch(u, i),
): Promise<AuthResponse> {
  return postAuth(`${baseUrl}/api/v1/auth/register`, { username, password }, fetchImpl);
}

export function login(
  baseUrl: string,
  username: string,
  password: string,
  fetchImpl: FetchImpl = (u, i) => fetch(u, i),
): Promise<AuthResponse> {
  return postAuth(`${baseUrl}/api/v1/auth/login`, { username, password }, fetchImpl);
}

export async function changePassword(
  baseUrl: string,
  token: string,
  currentPassword: string,
  newPassword: string,
  fetchImpl: FetchImpl = (u, i) => fetch(u, i),
): Promise<void> {
  const res = await fetchImpl(`${baseUrl}/api/v1/auth/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error(await readError(res));
}
