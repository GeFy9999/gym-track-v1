import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { calendarRouter } from "./controllers/calendarController.js";
import { metaRouter } from "./controllers/metaController.js";
import { exercisesRouter } from "./controllers/exercisesController.js";
import { muscleGroups } from "./controllers/muscleGroupsController.js";

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
