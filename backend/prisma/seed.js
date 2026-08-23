import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  // 2. Build a map of muscle group name → id
  const allGroups = await prisma.muscleGroup.findMany();
  const groupMap = {};
  for (const g of allGroups) {
    groupMap[g.name] = g.id;
  }

  // 3. Load exercises from JSON
  const exercisesPath = join(__dirname, "exercises-data.json");
  const exercises = JSON.parse(readFileSync(exercisesPath, "utf-8"));

  let created = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const muscleGroupId = groupMap[ex.muscleGroup];
    if (!muscleGroupId) {
      skipped++;
      continue;
    }

    // Check if exercise already exists (by name + muscleGroupId)
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, muscleGroupId },
    });

    if (!existing) {
      await prisma.exercise.create({
        data: {
          name: ex.name,
          muscleGroupId,
          image: ex.image || null,
          isCustom: false,
        },
      });
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`✅ Exercises seeded: ${created} created, ${skipped} skipped`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
