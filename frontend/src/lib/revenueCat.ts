import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from "@revenuecat/purchases-capacitor";

// RevenueCat's Android key is a public identifier (like a Stripe publishable
// key) — safe to bake into the client bundle. Real value comes from the
// RevenueCat dashboard once the project is set up.
const ANDROID_API_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as
  | string
  | undefined;

// Entitlement identifier configured in the RevenueCat dashboard — must match
// exactly what's set up there. Our own backend (isPro flag, set by the
// webhook in revenueCatService.ts) stays the source of truth for gating;
// this is only used for an optimistic client-side check right after a
// purchase, before the webhook has had a chance to land.
const PRO_ENTITLEMENT_ID = "gymstrack_pro";

let configuredUserId: string | null = null;

// Play Store policy requires digital subscriptions sold from the Android app
// to go through Google Play Billing — RevenueCat wraps that. Web/iOS keep
// using Stripe directly (see lib/openExternal.ts).
export async function ensureRevenueCatConfigured(userId: string) {
  if (!Capacitor.isNativePlatform() || !ANDROID_API_KEY) return;
  if (configuredUserId === userId) return;

  if (!configuredUserId) {
    await Purchases.configure({ apiKey: ANDROID_API_KEY, appUserID: userId });
  } else {
    await Purchases.logIn({ appUserID: userId });
  }
  configuredUserId = userId;
}

function packageTypeForPlan(
  plan: "monthly" | "annual" | "lifetime",
): PACKAGE_TYPE {
  if (plan === "annual") return PACKAGE_TYPE.ANNUAL;
  if (plan === "lifetime") return PACKAGE_TYPE.LIFETIME;
  return PACKAGE_TYPE.MONTHLY;
}

export function isEntitledToPro(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

// Distinguishes "the user backed out of the Play Store purchase sheet" (not
// an error — dismiss silently) from actual failures (network, misconfigured
// product, etc. — show the user something went wrong).
export class PurchaseCancelledError extends Error {
  constructor() {
    super("Achat annulé.");
    this.name = "PurchaseCancelledError";
  }
}

export async function purchasePlan(
  plan: "monthly" | "annual" | "lifetime",
): Promise<CustomerInfo> {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) {
    throw new Error("Aucune offre Pro disponible pour le moment.");
  }

  const targetType = packageTypeForPlan(plan);
  const pkg: PurchasesPackage | undefined = current.availablePackages.find(
    (p) => p.packageType === targetType,
  );
  if (!pkg) {
    throw new Error("Ce plan n'est pas disponible sur Android pour le moment.");
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return customerInfo;
  } catch (error) {
    const purchasesError = error as PurchasesError;
    if (purchasesError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      throw new PurchaseCancelledError();
    }
    throw error;
  }
}

// Lets a user who reinstalled the app or switched devices recover a
// subscription tied to their Google Play account without paying again —
// required by Play Store review guidelines for restorable purchases.
export async function restorePurchases(): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}
