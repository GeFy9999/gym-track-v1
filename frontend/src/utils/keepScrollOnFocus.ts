// Room kept between a field and the keyboard / screen edge.
const MARGIN = 12;
// How long after the tap the browser may still move the page while the
// keyboard slides up.
const WATCH_MS = 1000;

/**
 * Call from a field's onFocus. When the phone keyboard opens, the browser
 * scrolls the page to "reveal" the focused field — even when it was already
 * in plain sight above where the keyboard lands, which just jolts the page
 * down a notch. For about a second after the tap, any such scroll is undone
 * as long as the field would still be fully visible at its original
 * position; if the keyboard really would cover it, the browser's scroll is
 * left alone.
 */
export function keepScrollOnFocus(field: HTMLElement) {
  const savedY = window.scrollY;
  const viewport = window.visualViewport;

  const check = () => {
    const delta = window.scrollY - savedY;
    if (delta === 0) return;
    const visibleHeight = viewport?.height ?? window.innerHeight;
    const rect = field.getBoundingClientRect();
    // Where the field would sit if the page hadn't moved.
    const top = rect.top + delta;
    const bottom = rect.bottom + delta;
    if (top >= MARGIN && bottom <= visibleHeight - MARGIN) {
      window.scrollTo({ top: savedY, behavior: "instant" });
    }
  };

  window.addEventListener("scroll", check);
  viewport?.addEventListener("resize", check);
  window.setTimeout(() => {
    window.removeEventListener("scroll", check);
    viewport?.removeEventListener("resize", check);
  }, WATCH_MS);
}
