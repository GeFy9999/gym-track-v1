import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Seed muscle groups
  const muscleGroups = [
    { name: "Chest" },
    { name: "Dos" },
    { name: "Biceps" },
    { name: "Triceps" },
    { name: "Épaules" },
    { name: "Avant-bras" },
    { name: "Trapèze" },
    { name: "Legs" },
    { name: "Abdominaux" },
  ];

  for (const group of muscleGroups) {
    await prisma.muscleGroup.upsert({
      where: { name: group.name },
      update: {},
      create: group,
    });
  }
  console.log("✅ Muscle groups seeded");

  // Exercises themselves come from the licensed ExerciseDB pack, synced by
  // scripts/import-exercisedb.ts (run right after this on every start).
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
