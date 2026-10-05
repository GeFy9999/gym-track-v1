import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  STORE_REPLACEMENT_MODE,
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

// RevenueCat reports Google Play subscriptions as
// "<subscriptionId>:<basePlanId>"; a plan change on Google Play replaces the
// old purchase, which is identified by its subscription id alone.
function googlePlaySubscriptionId(productId: string): string {
  return productId.split(":")[0] ?? productId;
}

export async function purchasePlan(
  plan: "monthly" | "annual" | "lifetime",
  {
    skipTrial = false,
    replacingProductId = null,
  }: {
    skipTrial?: boolean;
    // The Google Play subscription being switched away from, if any — so
    // the new plan replaces it instead of being bought alongside it.
    replacingProductId?: string | null;
  } = {},
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

  // The free trial is once per GymsTrack account (see User.hasUsedTrial),
  // but Google Play only knows the Google account — and purchasePackage
  // picks the offer with the free trial by default. Once our account has
  // used its trial, buy the plain base plan instead.
  const basePlan = skipTrial
    ? pkg.product.subscriptionOptions?.find(
        (o) => o.isBasePlan && !o.freePhase,
      )
    : undefined;

  const storeProductChangeInfo =
    replacingProductId && plan !== "lifetime"
      ? { oldProductIdentifier: googlePlaySubscriptionId(replacingProductId) }
      : null;

  try {
    const { customerInfo } = basePlan
      ? await Purchases.purchaseSubscriptionOption({
          subscriptionOption: basePlan,
          storeProductChangeInfo,
        })
      : await Purchases.purchasePackage({ aPackage: pkg, storeProductChangeInfo });
    return customerInfo;
  } catch (error) {
    const purchasesError = error as PurchasesError;
    if (purchasesError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      throw new PurchaseCancelledError();
    }
    throw error;
  }
}

// Google Play can't lower one subscriber's renewal price, so the loyalty
// discount is delivered as cheaper "tier" base plans (see the backend's
// utils/loyalty.ts). This moves the subscriber to the tier they've earned as
// a DEFERRED change: nothing is charged now, and the new, lower price
// applies from their next renewal. Google Play shows its own confirmation
// sheet, which the user has to accept.
export async function switchToLoyaltyTier(
  newProductId: string,
  oldProductId: string,
): Promise<CustomerInfo> {
  const { products } = await Purchases.getProducts({
    productIdentifiers: [newProductId],
  });
  const product = products.find((p) => p.identifier === newProductId) ?? products[0];
  if (!product) {
    throw new Error("Ce palier de réduction n'est pas encore disponible sur Google Play.");
  }

  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct({
      product,
      storeProductChangeInfo: {
        oldProductIdentifier: googlePlaySubscriptionId(oldProductId),
        replacementMode: STORE_REPLACEMENT_MODE.DEFERRED,
      },
    });
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
