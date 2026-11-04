import geoip from "geoip-country";

// Prices are set and charged in CAD (Stripe converts at checkout with
// Adaptive Pricing). For a visitor elsewhere, the web app shows an
// approximate equivalent in their currency next to the CAD price.

const BASE_CURRENCY = "CAD";
// European Central Bank reference rates, published once a working day.
const RATES_URL = `https://api.frankfurter.dev/v1/latest?base=${BASE_CURRENCY}`;
const RATES_TTL_MS = 12 * 60 * 60 * 1000;
const RATES_TIMEOUT_MS = 4000;

let rates: Record<string, number> | null = null;
let ratesFetchedAt = 0;
let ratesRequest: Promise<void> | null = null;

async function refreshRates() {
  try {
    const res = await fetch(RATES_URL, {
      signal: AbortSignal.timeout(RATES_TIMEOUT_MS),
    });
    if (!res.ok) return;
    const body = (await res.json()) as { rates?: Record<string, number> };
    if (body.rates) {
      rates = body.rates;
      ratesFetchedAt = Date.now();
    }
  } catch {
    // Keep the last rates (or none): the equivalent is only a hint.
  }
}

async function getRates() {
  if (!rates || Date.now() - ratesFetchedAt > RATES_TTL_MS) {
    ratesRequest ??= refreshRates().finally(() => {
      ratesRequest = null;
    });
    await ratesRequest;
  }
  return rates;
}

export function currencyForIp(ip: string | undefined): string {
  // "::ffff:1.2.3.4" is how Node reports an IPv4 client on an IPv6 socket.
  const address = ip?.replace(/^::ffff:/, "");
  const currency = address ? geoip.lookup(address)?.currency[0] : undefined;
  return currency ?? BASE_CURRENCY;
}

// The visitor's currency, and how much one CAD is worth in it (null when
// there's no rate for it — then only the CAD price is shown).
export async function getLocalPriceInfo(ip: string | undefined) {
  const currency = currencyForIp(ip);
  if (currency === BASE_CURRENCY) return { currency, rate: 1 };
  const rate = (await getRates())?.[currency] ?? null;
  return { currency, rate };
}

export function resetRatesCacheForTests() {
  rates = null;
  ratesFetchedAt = 0;
}
