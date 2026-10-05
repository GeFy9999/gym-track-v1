import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
// Exercise.exerciseDbId is internal (it points into the licensed ExerciseDB
// pack, see services/exerciseDb.ts) — omitted from every query by default
// so it can never leak into an API response; read it with an explicit
// `select`/`omit: { exerciseDbId: false }` where it's actually needed.
const prisma = new PrismaClient({
  adapter,
  omit: { exercise: { exerciseDbId: true } },
});

export { prisma };
