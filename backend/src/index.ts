import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { calendarRouter } from "./controllers/calendarController.js";
import { metaRouter } from "./controllers/metaController.js";
import { exercisesRouter } from "./controllers/exercisesController.js";
import { muscleGroupsRouter } from "./controllers/muscleGroupsController.js";
import { scheduleRouter } from "./controllers/scheduleController.js";
import { sessionsRouter } from "./controllers/sessionsController.js";
import { setsRouter } from "./controllers/setController.js";
import { sessionExercisesRouter } from "./controllers/sessionExerciseController.js";
import { authRouter } from "./controllers/authController.js";
import { bodyWeightRouter } from "./controllers/bodyWeightController.js";
import { trackedExerciseRouter } from "./controllers/trackedExerciseController.js";
import { progressPhotoRouter } from "./controllers/progressPhotoController.js";
import { exerciseNoteRouter } from "./controllers/exerciseNoteController.js";
import { importRouter } from "./controllers/importController.js";
import {
  stripeRouter,
  stripeWebhookHandler,
} from "./controllers/stripeController.js";

dotenv.config();

const app = express();

// Trust the reverse proxy (Docker / hosting)
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;

const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:5173"
).split(",");

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
  }),
);

// Stripe needs the raw, unparsed request body to verify the webhook
// signature — must be registered before express.json() below.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

app.use(express.json({ limit: "10mb" }));

app.use("/api/calendar", calendarRouter);
app.use("/api", metaRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/muscleGroups", muscleGroupsRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/sets", setsRouter);
app.use("/api/session-exercises", sessionExercisesRouter);
app.use("/api/auth", authRouter);
app.use("/api/body-weight", bodyWeightRouter);
app.use("/api/tracked-exercises", trackedExerciseRouter);
app.use("/api/progress-photos", progressPhotoRouter);
app.use("/api/exercise-notes", exerciseNoteRouter);
app.use("/api/import", importRouter);
app.use("/api/stripe", stripeRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
