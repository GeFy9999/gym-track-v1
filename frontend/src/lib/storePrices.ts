import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { getDateLocale } from "../i18n";
import { API_URL } from "./api";
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

// On the web: the visitor's currency (from their IP, server side) and how
// much a CAD is worth in it, to show an equivalent next to the CAD prices.
type LocalCurrency = { currency: string; rate: number | null };
const LOCAL_KEY = "localCurrency";

let local: LocalCurrency | null = (() => {
  try {
    return JSON.parse(sessionStorage.getItem(LOCAL_KEY) ?? "null");
  } catch {
    return null;
  }
})();
let localRequest: Promise<LocalCurrency | null> | null = null;

function loadLocalCurrency(): Promise<LocalCurrency | null> {
  if (Capacitor.isNativePlatform() || local) return Promise.resolve(local);
  localRequest ??= fetch(`${API_URL}/pricing/local`)
    .then((res) => (res.ok ? (res.json() as Promise<LocalCurrency>) : null))
    .then((info) => {
      if (info) {
        local = info;
        try {
          sessionStorage.setItem(LOCAL_KEY, JSON.stringify(info));
        } catch {
          // Asked again next time.
        }
      }
      return local;
    })
    .catch(() => local)
    .finally(() => {
      localRequest = null;
    });
  return localRequest;
}

const isForeignVisitor = () => !!local && local.currency !== "CAD";

// A CAD amount as the web shows it: "4,99$" in Canada, "4,99 $ CA"
// elsewhere, so nobody takes it for their own dollars.
function formatCad(cad: number) {
  return isForeignVisitor()
    ? `${formatAmount(cad)} $ CA`
    : `${formatAmount(cad)}$`;
}

// "≈ 3,19 €" for a visitor outside Canada on the web, null otherwise.
export function formatLocalEquivalent(cad: number): string | null {
  if (!local?.rate || local.currency === "CAD") return null;
  try {
    return `≈ ${new Intl.NumberFormat(getDateLocale(), {
      style: "currency",
      currency: local.currency,
    }).format(cad * local.rate)}`;
  } catch {
    return null;
  }
}

// Google Play's prices on Android (null on the web, where Stripe charges
// the CAD base prices). Also re-renders once the web visitor's currency is
// known, for the CAD labels and equivalents below.
export function useStorePrices(): StorePlanPrices | null {
  const [prices, setPrices] = useState(cached);
  const [, setLocalLoaded] = useState(local);
  useEffect(() => {
    let active = true;
    loadStorePrices().then((p) => {
      if (active && p) setPrices(p);
    });
    loadLocalCurrency().then((info) => {
      if (active) setLocalLoaded(info);
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
  return prices?.[plan]?.label ?? formatCad(BASE_PRICES[plan]);
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
  const store = prices?.[plan];
  if (!prices || !store) return formatCad(cad);
  return new Intl.NumberFormat(getDateLocale(), {
    style: "currency",
    currency: prices.currency,
  }).format((cad * store.price) / BASE_PRICES[plan]);
}
