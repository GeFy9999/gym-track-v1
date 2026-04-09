import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  console.log("Muscle groups seeded!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
