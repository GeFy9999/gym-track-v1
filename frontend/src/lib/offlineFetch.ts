import { API_URL } from "./api";
import {
  enqueueMutation,
  pendingMutationCount,
  replayPendingMutations,
} from "./syncQueue";

export type OfflineFetchResult =
  | { queued: false; response: Response }
  | { queued: true };

// Wraps a mutating request (POST/PATCH/DELETE): if the network itself is
// unreachable, fetch() throws (not a 4xx/5xx — those still resolve
// normally), so that's the one case we catch here and queue for later
// instead of surfacing as an error. A real server error (validation
// failure, 401, etc.) is left completely alone and returned as-is so
// existing error handling keeps working unchanged.
//
// It also goes straight to the queue, without trying the network, when:
// - it names something created offline (a "temp-…" id): the server doesn't
//   know that id yet — the queue rewrites it once the create has synced;
// - earlier writes are still waiting: sending this one now could land it
//   before them (e.g. a set's edit before the set itself exists).
//
// `localId`: for a create, the temporary id the caller gave the new thing,
// so later queued requests mentioning it can be rewritten (see syncQueue).
export async function offlineAwareFetch(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown,
  label: string,
  { localId }: { localId?: string } = {},
): Promise<OfflineFetchResult> {
  const queue = async (): Promise<OfflineFetchResult> => {
    await enqueueMutation(method, path, body, label, localId);
    replayPendingMutations();
    return { queued: true };
  };

  const mentionsLocalId =
    path.includes("temp-") ||
    (body !== undefined && JSON.stringify(body).includes("temp-"));
  if (mentionsLocalId || (await pendingMutationCount()) > 0) return queue();

  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { queued: false, response };
  } catch {
    return queue();
  }
}
