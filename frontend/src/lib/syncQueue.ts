import { getOfflineDb, type PendingMutation } from "./offlineDb";
import { API_URL } from "./api";

type SyncListener = (pending: number) => void;
const listeners = new Set<SyncListener>();
let replaying = false;

function notify(pending: number) {
  listeners.forEach((fn) => fn(pending));
}

export function onSyncQueueChange(fn: SyncListener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function pendingMutationCount(): Promise<number> {
  const db = await getOfflineDb();
  return db.count("pendingMutations");
}

// Called by a mutation that failed purely because there's no connection
// (fetch threw a network error, not a 4xx/5xx from the server) — the write
// is stored locally and applied for real the next time we're back online.
export async function enqueueMutation(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  body: unknown,
  label: string,
): Promise<void> {
  const db = await getOfflineDb();
  const mutation: PendingMutation = {
    id: crypto.randomUUID(),
    method,
    url,
    body,
    createdAt: Date.now(),
    label,
  };
  await db.add("pendingMutations", mutation);
  notify(await pendingMutationCount());
}

// Replays queued writes strictly in the order they were made — a set logged
// before another one must still reach the server first, so on the first
// failure (still offline, or a real server error) we stop rather than skip
// ahead and risk landing them out of order.
export async function replayPendingMutations(): Promise<void> {
  if (replaying || !navigator.onLine) return;
  replaying = true;
  try {
    const db = await getOfflineDb();
    const token = localStorage.getItem("token");
    if (!token) return;

    while (true) {
      const all = await db.getAllFromIndex("pendingMutations", "by-createdAt");
      const next = all[0];
      if (!next) break;

      try {
        const res = await fetch(`${API_URL}${next.url}`, {
          method: next.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: next.body ? JSON.stringify(next.body) : undefined,
        });
        // A 4xx here means the request itself is invalid (not a
        // connectivity problem) — drop it rather than retry forever.
        if (!res.ok && res.status < 500) {
          console.error(
            `[sync] dropping invalid queued request: ${next.method} ${next.url} (${res.status})`,
          );
        } else if (!res.ok) {
          break; // server/transient error — stop, try again later
        }
        await db.delete("pendingMutations", next.id);
        notify(await pendingMutationCount());
      } catch {
        break; // network error — still offline, stop and retry later
      }
    }
  } finally {
    replaying = false;
  }
}

export function initSyncQueue() {
  replayPendingMutations();
  window.addEventListener("online", () => {
    replayPendingMutations();
  });
}
