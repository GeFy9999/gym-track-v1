import { useEffect, useState } from "react";
import { getDateLocale } from "../i18n";
import { formatAmount } from "../utils/units";
import { fetchStorePlanPrices, type StorePlanPrices } from "./revenueCat";

export type Plan = "monthly" | "annual" | "lifetime";

// Our own prices, in CAD: what Stripe charges on the web, and the base the
// loyalty discounts are counted in (backend utils/loyalty.ts).
export const BASE_PRICES: Record<Plan, number> = {
  monthly: 4.99,
  annual: 29.99,
  lifetime: 79.99,
};

const STORAGE_KEY = "storePlanPrices";

// Last prices Google Play gave, kept so they show right away next time
// (and offline) instead of flashing the CAD fallback first.
let cached: StorePlanPrices | null = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
})();
let inFlight: Promise<StorePlanPrices | null> | null = null;

function loadStorePrices(): Promise<StorePlanPrices | null> {
  inFlight ??= fetchStorePlanPrices()
    .then((prices) => {
      if (prices) {
        cached = prices;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(prices));
        } catch {
          // Only a convenience — the prices are fetched again next time.
        }
      }
      return cached;
    })
    .catch(() => cached)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

// Google Play's prices on Android (null on the web, where Stripe charges
// the CAD base prices).
export function useStorePrices(): StorePlanPrices | null {
  const [prices, setPrices] = useState(cached);
  useEffect(() => {
    let active = true;
    loadStorePrices().then((p) => {
      if (active && p) setPrices(p);
    });
    return () => {
      active = false;
    };
  }, []);
  return prices;
}

export function getCachedStorePrices(): StorePlanPrices | null {
  return cached;
}

// A plan's price as the user will actually be charged.
export function formatPlanPrice(plan: Plan, prices: StorePlanPrices | null) {
  return prices?.[plan]?.label ?? `${formatAmount(BASE_PRICES[plan])}$`;
}

export function planPriceValue(plan: Plan, prices: StorePlanPrices | null) {
  return prices?.[plan]?.price ?? BASE_PRICES[plan];
}

// An amount counted in CAD (a loyalty discount, a discounted price) shown in
// the store's currency. Google Play sets each country's price from ours, so
// the same ratio as the plan's own price converts it.
export function formatMoney(
  cad: number,
  prices: StorePlanPrices | null,
  plan: Exclude<Plan, "lifetime"> = "monthly",
) {
  const local = prices?.[plan];
  if (!prices || !local) return `${formatAmount(cad)}$`;
  return new Intl.NumberFormat(getDateLocale(), {
    style: "currency",
    currency: prices.currency,
  }).format((cad * local.price) / BASE_PRICES[plan]);
}
