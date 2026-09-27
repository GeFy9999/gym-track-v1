import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

// Stripe Checkout/Portal can't be embedded in a native WebView reliably, and
// there's no deep-link plumbing (yet) to bring the user back into the app
// afterwards — so on native we hand the URL to the system browser instead
// and rely on refreshProStatus() (see useIsPro) to pick up the new Pro
// status once the user switches back to the app.
export async function openExternalUrl(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.location.href = url;
  }
}
