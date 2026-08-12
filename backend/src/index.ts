import express from "express";
import cors from "cors";
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:5173"
).split(",");

app.use(
  cors({
    origin: allowedOrigins,
  }),
);
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
