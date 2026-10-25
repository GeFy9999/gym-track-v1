import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// Offline-first storage: writes made with no connection go here first, then
// get replayed against the real API once the connection comes back (see
// syncQueue.ts). Kept in its own file so every other module can import just
// the small piece it needs instead of the whole IndexedDB setup.

export type PendingMutation = {
  id: string;
  method: "POST" | "PATCH" | "DELETE";
  url: string;
  body: unknown;
  createdAt: number;
  // Human-readable label only, for the "syncing…" UI — never parsed.
  label: string;
  // For a create made offline: the temporary id ("temp-…") the app gave the
  // new resource. Once the server answers with the real id, every later
  // queued request mentioning the temporary one is rewritten to use it.
  localId?: string;
};

export type CachedSession = {
  sessionId: string;
  data: unknown;
  cachedAt: number;
};

// Last good answer of a GET, for when the network isn't there (see
// cachedFetch.ts).
export type CachedResponse = {
  key: string;
  data: unknown;
  cachedAt: number;
};

interface GymsTrackDB extends DBSchema {
  pendingMutations: {
    key: string;
    value: PendingMutation;
    indexes: { "by-createdAt": number };
  };
  sessionCache: {
    key: string;
    value: CachedSession;
  };
  getCache: {
    key: string;
    value: CachedResponse;
  };
}

let dbPromise: Promise<IDBPDatabase<GymsTrackDB>> | null = null;

export function getOfflineDb() {
  if (!dbPromise) {
    dbPromise = openDB<GymsTrackDB>("gymstrack-offline", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const mutations = db.createObjectStore("pendingMutations", {
            keyPath: "id",
          });
          mutations.createIndex("by-createdAt", "createdAt");
          db.createObjectStore("sessionCache", { keyPath: "sessionId" });
        }
        if (oldVersion < 2) {
          db.createObjectStore("getCache", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}
