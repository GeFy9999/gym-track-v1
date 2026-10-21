import { API_URL } from "../lib/api";

// Signing up doesn't log in: the account only works once its email is
// confirmed. To spare the user retyping everything when they come back
// from the email, the credentials they just entered are kept here — in
// memory only, never in storage — and used to sign them in from the
// "I confirmed" button. Lost on reload, in which case they just log in.
// The address alone is kept in localStorage so "resend the email" still
// works after a reload.
const EMAIL_KEY = "pendingSignupEmail";

let pending: { email: string; password: string } | null = null;

export const setPendingSignup = (email: string, password: string) => {
  pending = { email, password };
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // Storage unavailable — only "resend" after a reload is affected.
  }
};

export const getPendingSignupEmail = (): string => {
  if (pending) return pending.email;
  try {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
};

export const hasPendingCredentials = () => pending !== null;

export const clearPendingSignup = () => {
  pending = null;
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Nothing to clean up.
  }
};

export type PendingLoginResult =
  | { status: "ok"; token: string; user: { id: string; language?: string } }
  | { status: "notVerified" }
  | { status: "noCredentials" }
  | { status: "error"; message?: string };

/** Signs in with the credentials typed at signup, once the email is confirmed. */
export async function loginWithPendingSignup(): Promise<PendingLoginResult> {
  if (!pending) return { status: "noCredentials" };

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pending),
  });
  const result = await res.json().catch(() => ({}));

  if (res.status === 403 && result.emailNotVerified) {
    return { status: "notVerified" };
  }
  if (!res.ok) return { status: "error", message: result.error };

  clearPendingSignup();
  return { status: "ok", token: result.token, user: result.user };
}

export async function resendVerificationEmail(email: string) {
  const res = await fetch(`${API_URL}/auth/resend-verification-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const result = await res.json().catch(() => ({}));
    throw new Error(result.error);
  }
}
