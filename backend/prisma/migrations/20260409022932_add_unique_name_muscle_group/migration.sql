/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `MuscleGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MuscleGroup_name_key" ON "MuscleGroup"("name");
