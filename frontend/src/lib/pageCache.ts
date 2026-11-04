// The last answer each screen got, kept in memory for as long as the app
// runs: coming back to a page shows it right away with what it showed
// before, while it quietly fetches fresh data — instead of a skeleton on
// every visit. Scoped to the signed-in token, so another account signing in
// on the same device never sees the previous one's data.
const store = new Map<string, unknown>();
let owner: string | null = null;

function scope() {
  const token = localStorage.getItem("token");
  if (token !== owner) {
    store.clear();
    owner = token;
  }
}

export function getPageCache<T>(key: string): T | undefined {
  scope();
  return store.get(key) as T | undefined;
}

export function setPageCache(key: string, data: unknown) {
  scope();
  store.set(key, data);
}
