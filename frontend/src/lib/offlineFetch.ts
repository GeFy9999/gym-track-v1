import { API_URL } from "./api";
import { enqueueMutation } from "./syncQueue";

export type OfflineFetchResult =
  | { queued: false; response: Response }
  | { queued: true };

// Wraps a mutating request (POST/PATCH/DELETE): if the network itself is
// unreachable, fetch() throws (not a 4xx/5xx — those still resolve
// normally), so that's the one case we catch here and queue for later
// instead of surfacing as an error. A real server error (validation
// failure, 401, etc.) is left completely alone and returned as-is so
// existing error handling keeps working unchanged.
export async function offlineAwareFetch(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown,
  label: string,
): Promise<OfflineFetchResult> {
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
    await enqueueMutation(method, path, body, label);
    return { queued: true };
  }
}
