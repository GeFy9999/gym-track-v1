// Calls the same backend the mobile/web app uses — this site authenticates
// and starts Stripe Checkout directly rather than sending visitors to the
// app itself (see conversation notes: the goal is that regular users never
// see the web app, only the native mobile app and this marketing/auth site).
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
