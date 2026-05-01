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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json());

app.use("/api/calendar", calendarRouter);
app.use("/api/meta", metaRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/muscleGroups", muscleGroupsRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/sets", setsRouter);
app.use("/api/session-exercises", sessionExercisesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
