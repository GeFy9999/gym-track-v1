import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { startLoyaltyReminderSchedule } from "./services/loyaltyReminders.js";

// Refuse to start without the secrets that protect accounts and payments,
// rather than running half-configured (e.g. signing tokens with no key).
const missing = ["JWT_SECRET", "DATABASE_URL"].filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Started here, not in app.ts, so tests importing the app never run it.
  startLoyaltyReminderSchedule();
});
