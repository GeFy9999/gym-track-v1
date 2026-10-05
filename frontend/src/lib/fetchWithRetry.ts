// fetch() that retries a few times on failures that are usually momentary:
// no network yet (app just resumed), or the server answering 5xx while it
// restarts (a redeploy runs migrations + the exercise import before
// listening). Client errors (401, 404...) are returned as-is — retrying
// those can't help.
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  { attempts = 3, delayMs = 1500 }: { attempts?: number; delayMs?: number } = {},
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status < 500 || i === attempts - 1) return res;
    } catch (err) {
      lastError = err;
      if (i === attempts - 1) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
  }
  throw lastError;
}
