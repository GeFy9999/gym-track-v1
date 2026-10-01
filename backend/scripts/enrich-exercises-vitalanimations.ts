// One-off enrichment: attaches a real demonstration video (VitalAnimations
// free pack — licensed for commercial in-app use, no attribution required)
// to a hand-picked, manually-verified set of matching exercises.
//
// This mapping is curated by hand rather than name-matched automatically:
// the free pack only has 50 videos, and several near-miss names (e.g.
// "Dumbbell Bulgarian Split Squat" vs a generic "Dumbbell Squat" video)
// would otherwise risk showing the wrong movement under the right name.
// Deliberately excludes any such ambiguous pairing.
//
// Usage: npx tsx scripts/enrich-exercises-vitalanimations.ts
import { prisma } from "../src/prisma.js";

// Absolute URL: the frontend (a different origin) fetches this directly,
// so a relative "/static/..." path would resolve against the frontend's
// own domain instead of the backend's.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";
const VIDEO_BASE_URL = `${BACKEND_URL}/static/exercise-videos/`;

const MAPPING: { videoId: string; exerciseName: string }[] = [
  { videoId: "0052", exerciseName: "Svend Press" },
  { videoId: "0053", exerciseName: "Air Bike" },
  { videoId: "0054", exerciseName: "Barbell Squat" },
  { videoId: "0056", exerciseName: "Front Barbell Squat" },
  { videoId: "0057", exerciseName: "Barbell Hip Thrust" },
  { videoId: "0060", exerciseName: "Barbell Romanian Deadlift" },
  { videoId: "0061", exerciseName: "Cable Kickback" },
  { videoId: "0064", exerciseName: "Dumbbell Goblet Squat" },
  { videoId: "0068", exerciseName: "Hack Squat" },
  { videoId: "0072", exerciseName: "Kettlebell Swing" },
  { videoId: "0074", exerciseName: "Leg Press" },
  { videoId: "0078", exerciseName: "Run" },
  { videoId: "0079", exerciseName: "Seated Leg Curl" },
  { videoId: "0080", exerciseName: "Barbell Seated Overhead Press" },
  { videoId: "0084", exerciseName: "Smith Machine Stiff-Legged Deadlift" },
  { videoId: "0085", exerciseName: "Triceps Pushdown" },
  { videoId: "0087", exerciseName: "Dumbbell Arnold Press" },
  { videoId: "0089", exerciseName: "Barbell Upright Row" },
  { videoId: "0091", exerciseName: "Standing Dumbbell Upright Row" },
  { videoId: "0092", exerciseName: "Front Dumbbell Raise" },
  { videoId: "0093", exerciseName: "Front Plate Raise" },
  { videoId: "0095", exerciseName: "Cable Lateral Raise" },
  { videoId: "0096", exerciseName: "Dumbbell Lateral Raise" },
  { videoId: "0097", exerciseName: "Lever Lateral Raise" },
  { videoId: "0100", exerciseName: "Cable Rear Delt Fly" },
];

async function main() {
  let matched = 0;
  for (const { videoId, exerciseName } of MAPPING) {
    const result = await prisma.exercise.updateMany({
      where: { name: exerciseName },
      data: { videoUrl: VIDEO_BASE_URL + videoId + ".mp4" },
    });
    if (result.count > 0) matched += result.count;
    else console.warn(`No exercise found named "${exerciseName}" (video ${videoId})`);
  }
  console.log(`Attached video to ${matched} exercises.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
