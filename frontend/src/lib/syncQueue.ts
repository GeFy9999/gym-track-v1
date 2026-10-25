import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { getOfflineDb, type PendingMutation } from "./offlineDb";
import { API_URL } from "./api";

type SyncListener = (pending: number) => void;
const listeners = new Set<SyncListener>();
let replaying: Promise<void> | null = null;

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

export const isLocalId = (id: string) => id.startsWith("temp-");

// Things created offline get a temporary id ("temp-…") until the server
// gives them a real one. Kept here so a screen still holding the temporary
// id (e.g. a session opened offline) can find where it went.
const ALIASES_KEY = "offlineIdAliases";

export function resolveLocalId(id: string): string {
  if (!isLocalId(id)) return id;
  try {
    const aliases = JSON.parse(localStorage.getItem(ALIASES_KEY) ?? "{}");
    return aliases[id] ?? id;
  } catch {
    return id;
  }
}

function rememberAlias(localId: string, realId: string) {
  try {
    const aliases = JSON.parse(localStorage.getItem(ALIASES_KEY) ?? "{}");
    aliases[localId] = realId;
    localStorage.setItem(ALIASES_KEY, JSON.stringify(aliases));
  } catch {
    // Only affects re-finding a screen opened offline.
  }
}

// The queue is replayed in `createdAt` order, so that must be strictly
// increasing: two writes in the same millisecond (quick taps — a set added
// then edited) would otherwise tie, and the tie is broken by their random
// ids, i.e. possibly the wrong way round.
let lastStamp = 0;

async function nextQueueStamp(): Promise<number> {
  if (lastStamp === 0) {
    const db = await getOfflineDb();
    const newest = await db
      .transaction("pendingMutations")
      .store.index("by-createdAt")
      .openCursor(null, "prev");
    lastStamp = newest?.value.createdAt ?? 0;
  }
  lastStamp = Math.max(Date.now(), lastStamp + 1);
  return lastStamp;
}

// Called for a write that couldn't (or mustn't yet) go to the server — no
// connection, or earlier writes still waiting — so it's stored locally and
// sent for real, in order, once we're back online.
export async function enqueueMutation(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  body: unknown,
  label: string,
  localId?: string,
): Promise<void> {
  const db = await getOfflineDb();
  const mutation: PendingMutation = {
    id: crypto.randomUUID(),
    method,
    url,
    body,
    createdAt: await nextQueueStamp(),
    label,
    ...(localId ? { localId } : {}),
  };
  await db.add("pendingMutations", mutation);
  notify(await pendingMutationCount());
}

// Once a create made offline reaches the server, every request queued
// after it that still names its temporary id now names the real one.
async function rewriteLocalId(localId: string, realId: string) {
  const db = await getOfflineDb();
  const all = await db.getAll("pendingMutations");
  for (const m of all) {
    const body = m.body === undefined ? undefined : JSON.stringify(m.body);
    const mentions = m.url.includes(localId) || body?.includes(localId);
    if (!mentions) continue;
    await db.put("pendingMutations", {
      ...m,
      url: m.url.split(localId).join(realId),
      body: body === undefined ? undefined : JSON.parse(body.split(localId).join(realId)),
    });
  }
  rememberAlias(localId, realId);
}

async function replayOnce(): Promise<void> {
  const db = await getOfflineDb();
  const token = localStorage.getItem("token");
  if (!token) return;

  while (true) {
    const all = await db.getAllFromIndex("pendingMutations", "by-createdAt");
    const next = all[0];
    if (!next) break;

    let res: Response;
    try {
      res = await fetch(`${API_URL}${next.url}`, {
        method: next.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: next.body !== undefined ? JSON.stringify(next.body) : undefined,
      });
    } catch {
      break; // network error — still offline, try again later
    }

    // Session expired / not allowed: keep everything for after the user
    // logs back in, rather than throwing their offline work away.
    if (res.status === 401 || res.status === 403) break;
    // Server/transient error — stop, try again later (order matters).
    if (res.status >= 500) break;

    if (!res.ok) {
      // Any other 4xx means this request itself is invalid (not a
      // connectivity problem) — drop it rather than retry forever.
      console.error(
        `[sync] dropping invalid queued request: ${next.method} ${next.url} (${res.status})`,
      );
    } else if (next.localId) {
      const created = await res.json().catch(() => null);
      if (created && typeof created.id === "string") {
        await rewriteLocalId(next.localId, created.id);
      }
    }

    await db.delete("pendingMutations", next.id);
    notify(await pendingMutationCount());
  }
}

// Replays queued writes strictly in the order they were made — a set logged
// before another one must still reach the server first, so on the first
// failure (still offline, or a server error) we stop rather than skip ahead
// and risk landing them out of order. Concurrent calls share one run.
export function replayPendingMutations(): Promise<void> {
  if (!navigator.onLine) return Promise.resolve();
  replaying ??= replayOnce().finally(() => {
    replaying = null;
  });
  return replaying;
}

const RETRY_EVERY_MS = 20_000;

export function initSyncQueue() {
  replayPendingMutations();
  window.addEventListener("online", () => {
    replayPendingMutations();
  });
  // Coming back to the app is a good moment to retry (the network may have
  // come back while it was in the background)…
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") replayPendingMutations();
  });
  if (Capacitor.isNativePlatform()) {
    CapacitorApp.addListener("resume", () => replayPendingMutations()).catch(
      () => {},
    );
  }
  // …and "online" doesn't mean the network actually works (gym basements):
  // keep retrying while anything is waiting.
  window.setInterval(async () => {
    if ((await pendingMutationCount()) > 0) replayPendingMutations();
  }, RETRY_EVERY_MS);
}
