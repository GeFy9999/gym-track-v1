import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { startLoyaltyReminderSchedule } from "./services/loyaltyReminders.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Started here, not in app.ts, so tests importing the app never run it.
  startLoyaltyReminderSchedule();
});
