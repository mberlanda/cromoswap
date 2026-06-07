import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TOKEN_KEY,
  getToken,
  setToken,
  clearToken,
  decodeToken,
  isExpired,
  getStoredUser,
  register,
  login,
  changePassword,
} from '../src/auth/auth';

// Builds an unsigned JWT-shaped string with the given payload (header.payload.sig).
function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

const future = () => Math.floor(Date.now() / 1000) + 3600;
const past = () => Math.floor(Date.now() / 1000) - 3600;

beforeEach(() => localStorage.clear());

describe('token store', () => {
  it('round-trips the token in localStorage under cromoswap-token', () => {
    expect(getToken()).toBeNull();
    setToken('abc');
    expect(getToken()).toBe('abc');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc');
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe('decodeToken', () => {
  it('extracts userId and exp', () => {
    const claims = decodeToken(fakeJwt({ user_id: 'u1', exp: future() }));
    expect(claims?.userId).toBe('u1');
  });

  it('returns null for a malformed token', () => {
    expect(decodeToken('garbage')).toBeNull();
    expect(decodeToken('a.b')).toBeNull();
  });
});

describe('isExpired / getStoredUser', () => {
  it('treats a past exp as expired', () => {
    expect(isExpired(fakeJwt({ user_id: 'u1', exp: past() }))).toBe(true);
    expect(isExpired(fakeJwt({ user_id: 'u1', exp: future() }))).toBe(false);
  });

  it('returns the user only for a valid stored token', () => {
    setToken(fakeJwt({ user_id: 'u1', exp: future() }));
    expect(getStoredUser()?.userId).toBe('u1');

    setToken(fakeJwt({ user_id: 'u1', exp: past() }));
    expect(getStoredUser()).toBeNull();
  });
});

describe('auth API', () => {
  const BASE = 'http://api.test';
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const ok = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('register POSTs credentials and returns token/user/session', async () => {
    fetchMock.mockResolvedValue(
      ok({ token: 't1', user: { id: 'u1', username: 'mauro' }, session: { id: 's1', userName: 'mauro' } }, 201),
    );
    const res = await register(BASE, 'mauro', 'supersecret');
    expect(res.token).toBe('t1');
    expect(res.user.username).toBe('mauro');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/auth/register`);
    expect(JSON.parse(init.body)).toEqual({ username: 'mauro', password: 'supersecret' });
  });

  it('register throws the server error message on 422', async () => {
    fetchMock.mockResolvedValue(ok({ errors: ['Username has already been taken'] }, 422));
    await expect(register(BASE, 'mauro', 'supersecret')).rejects.toThrow(/already been taken/);
  });

  it('login returns the auth response', async () => {
    fetchMock.mockResolvedValue(
      ok({ token: 't2', user: { id: 'u1', username: 'mauro' }, session: null }),
    );
    const res = await login(BASE, 'mauro', 'supersecret');
    expect(res.token).toBe('t2');
    expect(res.session).toBeNull();
  });

  it('login throws on 401', async () => {
    fetchMock.mockResolvedValue(ok({ error: 'invalid credentials' }, 401));
    await expect(login(BASE, 'mauro', 'nope')).rejects.toThrow(/invalid credentials/);
  });

  it('changePassword sends the bearer token and both passwords', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    await changePassword(BASE, 't1', 'oldpassword', 'newpassword');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/auth/password`);
    expect(init.headers.Authorization).toBe('Bearer t1');
    expect(JSON.parse(init.body)).toEqual({ currentPassword: 'oldpassword', newPassword: 'newpassword' });
  });

  it('changePassword throws the server error on 422', async () => {
    fetchMock.mockResolvedValue(ok({ errors: ['current password is incorrect'] }, 422));
    await expect(changePassword(BASE, 't1', 'wrong', 'newpassword')).rejects.toThrow(/incorrect/);
  });
});
