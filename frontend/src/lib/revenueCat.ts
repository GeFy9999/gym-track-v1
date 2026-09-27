import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  PACKAGE_TYPE,
  type PurchasesPackage,
} from "@revenuecat/purchases-capacitor";

// RevenueCat's Android key is a public identifier (like a Stripe publishable
// key) — safe to bake into the client bundle. Real value comes from the
// RevenueCat dashboard once the project is set up.
const ANDROID_API_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as
  | string
  | undefined;

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

export async function purchasePlan(
  plan: "monthly" | "annual" | "lifetime",
): Promise<void> {
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

  await Purchases.purchasePackage({ aPackage: pkg });
}
