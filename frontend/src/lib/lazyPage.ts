import { lazy, type ComponentType } from "react";

// A route page loaded on demand (its own JS chunk, so the first screen
// doesn't wait on the code of every other page), with `preload()` to fetch
// it ahead of time — see the idle prefetch in App.tsx.
export function lazyPage<T extends ComponentType>(
  factory: () => Promise<{ default: T }>,
) {
  return Object.assign(lazy(factory), { preload: factory });
}
