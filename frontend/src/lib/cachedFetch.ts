import { API_URL } from "./api";
import { getOfflineDb } from "./offlineDb";

// GET with an offline fallback: the network first (so data is always fresh
// when there is one), and the last good answer, kept in IndexedDB, when
// there isn't — no connection, a server error, or a request that hangs on a
// bad gym signal for longer than `timeoutMs`.
//
// Throws when there's neither a usable answer nor anything cached, or when
// the server actually said no (4xx): `status` is set then.
export class FetchFailedError extends Error {
  constructor(public status?: number) {
    super(status ? `HTTP ${status}` : "Network unavailable");
  }
}

export async function cachedJson<T>(
  path: string,
  {
    cacheKey = path,
    timeoutMs = 8000,
  }: { cacheKey?: string; timeoutMs?: number } = {},
): Promise<{ data: T; fromCache: boolean }> {
  const token = localStorage.getItem("token");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    });
    if (res.ok) {
      const data = (await res.json()) as T;
      const db = await getOfflineDb();
      await db.put("getCache", { key: cacheKey, data, cachedAt: Date.now() });
      return { data, fromCache: false };
    }
    // A real "no" from the server is not something a cached copy should
    // paper over (expired session, Pro-only…); a server error is.
    if (res.status < 500) throw new FetchFailedError(res.status);
  } catch (err) {
    if (err instanceof FetchFailedError) throw err;
    // Network error or timeout: fall through to the cache.
  } finally {
    window.clearTimeout(timeout);
  }

  const cached = await readCached<T>(cacheKey);
  if (cached === undefined) throw new FetchFailedError();
  return { data: cached, fromCache: true };
}

export async function readCached<T>(cacheKey: string): Promise<T | undefined> {
  const db = await getOfflineDb();
  return (await db.get("getCache", cacheKey))?.data as T | undefined;
}

export async function writeCached(cacheKey: string, data: unknown) {
  const db = await getOfflineDb();
  await db.put("getCache", { key: cacheKey, data, cachedAt: Date.now() });
}
